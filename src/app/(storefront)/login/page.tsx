import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CustomerAuthForm } from '@/components/auth/CustomerAuthForm';
import { getAdminSession } from '@/lib/auth';
import { getCustomerSession } from '@/lib/customer-auth';
import { safeAdminRedirect, safeCustomerRedirect, safeLoginIntent } from '@/lib/validation/customer-auth';

export const metadata: Metadata = {
  title: 'Masuk | Digital Atelier',
  description: 'Masuk ke akun Digital Atelier untuk mengakses ruang pelanggan atau dashboard admin sesuai peran.',
};

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const requestedNext = (await searchParams).next;
  const nextPath = safeLoginIntent(requestedNext);
  const [adminSession, customerSession] = await Promise.all([getAdminSession(), getCustomerSession()]);
  if (adminSession) redirect(safeAdminRedirect(requestedNext));
  if (customerSession?.isRegistered) redirect(safeCustomerRedirect(requestedNext));
  return <CustomerAuthForm mode="login" nextPath={nextPath} />;
}
