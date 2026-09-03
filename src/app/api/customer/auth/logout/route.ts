import { clearAdminSessionCookie } from '@/lib/auth';
import { clearCustomerSessionCookie } from '@/lib/customer-auth';
import { relativeRedirect } from '@/lib/relative-redirect';

export async function POST() {
  const response = relativeRedirect('/');
  clearAdminSessionCookie(response);
  clearCustomerSessionCookie(response);
  return response;
}
