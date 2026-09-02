import { NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/auth';
import { clearCustomerSessionCookie } from '@/lib/customer-auth';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/', request.url), 303);
  clearAdminSessionCookie(response);
  clearCustomerSessionCookie(response);
  return response;
}
