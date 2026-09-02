import { NextResponse } from 'next/server';
import { getCustomerSession, setCustomerSessionCookie } from '@/lib/customer-auth';
import {
  CustomerAccountExistsError,
  registerCustomerAccount,
} from '@/lib/services/customer-account';
import {
  assertCustomerAuthRateLimit,
  clearCustomerAuthRateLimit,
  customerAuthRateLimitKey,
  CustomerAuthRateLimitError,
} from '@/lib/services/customer-auth-rate-limit';
import { CustomerRegisterSchema, safeCustomerRedirect } from '@/lib/validation/customer-auth';
import { zodFieldErrors } from '@/lib/validation/admin-resources';

export async function POST(request: Request) {
  try {
    const parsed = CustomerRegisterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Periksa kembali data pendaftaran.', fieldErrors: zodFieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const currentSession = await getCustomerSession();
    if (currentSession?.isRegistered) {
      return NextResponse.json({ success: false, error: 'Kamu sudah masuk ke akun pelanggan.' }, { status: 409 });
    }

    const rateLimitKey = customerAuthRateLimitKey(request, 'register', parsed.data.email);
    assertCustomerAuthRateLimit(rateLimitKey, { maxAttempts: 5, windowMs: 60 * 60_000 });

    const account = await registerCustomerAccount(parsed.data, currentSession?.id);
    clearCustomerAuthRateLimit(rateLimitKey);

    const response = NextResponse.json({
      success: true,
      redirectUrl: safeCustomerRedirect(parsed.data.next),
      claimedCurrentSession: account.claimedCurrentSession,
      customer: {
        displayName: account.displayName,
        email: account.emailNormalized,
      },
    }, { status: 201 });
    setCustomerSessionCookie(response, account.customerAccessId);
    return response;
  } catch (cause: unknown) {
    if (cause instanceof CustomerAuthRateLimitError) {
      return NextResponse.json(
        { success: false, error: cause.message },
        { status: 429, headers: { 'Retry-After': String(cause.retryAfterSeconds) } },
      );
    }
    if (cause instanceof CustomerAccountExistsError) {
      return NextResponse.json(
        { success: false, error: 'Email sudah memiliki akun. Silakan masuk.', fieldErrors: { email: 'Email sudah terdaftar' } },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: false, error: 'Pendaftaran gagal. Silakan coba lagi.' }, { status: 500 });
  }
}
