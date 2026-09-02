import { AccountRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { clearAdminSessionCookie, setAdminSessionCookie } from '@/lib/auth';
import { clearCustomerSessionCookie, setCustomerSessionCookie } from '@/lib/customer-auth';
import { authenticateAccount } from '@/lib/services/customer-account';
import {
  assertCustomerAuthRateLimit,
  clearCustomerAuthRateLimit,
  customerAuthRateLimitKey,
  CustomerAuthRateLimitError,
} from '@/lib/services/customer-auth-rate-limit';
import { CustomerLoginSchema, safeAdminRedirect, safeCustomerRedirect } from '@/lib/validation/customer-auth';
import { zodFieldErrors } from '@/lib/validation/admin-resources';

export async function POST(request: Request) {
  try {
    const parsed = CustomerLoginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Periksa kembali email dan password.', fieldErrors: zodFieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const rateLimitKey = customerAuthRateLimitKey(request, 'login', parsed.data.email);
    assertCustomerAuthRateLimit(rateLimitKey, { maxAttempts: 5, windowMs: 15 * 60_000 });

    const account = await authenticateAccount(parsed.data.email, parsed.data.password);
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Email atau password tidak valid.' },
        { status: 401 },
      );
    }

    clearCustomerAuthRateLimit(rateLimitKey);

    if (account.role === AccountRole.CUSTOMER) {
      const response = NextResponse.json({
        success: true,
        role: account.role,
        redirectUrl: safeCustomerRedirect(parsed.data.next),
        user: { displayName: account.displayName, email: account.emailNormalized },
      });
      clearAdminSessionCookie(response);
      setCustomerSessionCookie(response, account.customerAccessId);
      return response;
    }

    const response = NextResponse.json({
      success: true,
      role: account.role,
      redirectUrl: safeAdminRedirect(parsed.data.next),
      user: { displayName: account.displayName, email: account.emailNormalized },
    });
    clearCustomerSessionCookie(response);
    setAdminSessionCookie(response, {
      id: account.adminUserId,
      email: account.emailNormalized,
      name: account.displayName,
      role: account.role,
    });
    return response;
  } catch (cause: unknown) {
    if (cause instanceof CustomerAuthRateLimitError) {
      return NextResponse.json(
        { success: false, error: cause.message },
        { status: 429, headers: { 'Retry-After': String(cause.retryAfterSeconds) } },
      );
    }
    return NextResponse.json({ success: false, error: 'Login gagal. Silakan coba lagi.' }, { status: 500 });
  }
}
