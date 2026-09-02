import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CustomerAuthForm } from '@/components/auth/CustomerAuthForm';
import { getCustomerSession } from '@/lib/customer-auth';
import { safeCustomerRedirect } from '@/lib/validation/customer-auth';

export const metadata: Metadata = {
  title: 'Daftar Pelanggan | Digital Atelier',
  description: 'Buat akun pelanggan untuk menyimpan akses pesanan dan produk Digital Atelier.',
};

export default async function CustomerRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const nextPath = safeCustomerRedirect((await searchParams).next);
  const session = await getCustomerSession();
  if (session?.isRegistered) redirect(nextPath);
  return <CustomerAuthForm mode="register" nextPath={nextPath} />;
}
