import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Bell, LogOut, MessageCircle, ShoppingBag, UserRound } from 'lucide-react';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customer-auth';
import { formatRupiah } from '@/lib/utils/invoice';

export const metadata: Metadata = {
  title: 'Akun Saya | Digital Atelier',
  description: 'Ringkasan akun dan pesanan pelanggan Digital Atelier.',
};

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Menunggu pembayaran',
  WAITING_VERIFICATION: 'Menunggu verifikasi',
  PAYMENT_REJECTED: 'Pembayaran ditolak',
  PAYMENT_APPROVED: 'Pembayaran disetujui',
  PRODUCT_SENT: 'Produk dikirim',
  COMPLETED: 'Pesanan selesai',
  EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan',
  REFUNDED: 'Dikembalikan',
};

export default async function CustomerAccountPage() {
  const session = await getCustomerSession();
  if (!session?.isRegistered) redirect('/login?next=/account');

  const customer = await db.customerAccess.findUnique({
    where: { id: session.id },
    include: {
      account: { select: { createdAt: true, lastLoginAt: true } },
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: { select: { productName: true, quantity: true } },
          conversation: { select: { id: true } },
        },
      },
    },
  });
  if (!customer?.account) redirect('/login?next=/account');

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 md:px-12 md:py-14">
      <header className="flex flex-col gap-6 border-b border-[#DAD6CD] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6657E8]">Akun pelanggan</p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-[-0.035em] text-[#111111] sm:text-5xl">Halo, {customer.displayName}.</h1>
          <p className="mt-2 text-sm text-[#686660]">Kelola pesanan, pesan, notifikasi, dan unduhanmu dari satu tempat.</p>
        </div>
        <form action="/api/customer/auth/logout" method="POST">
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-[#DAD6CD] bg-white px-4 py-2.5 text-xs font-semibold text-[#111111] transition-colors hover:border-[#B42318] hover:text-[#B42318] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]">
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </form>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#DAD6CD] bg-white p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8E4FF] text-[#5147B8]"><UserRound className="h-5 w-5" /></div>
            <h2 className="mt-5 text-sm font-semibold text-[#111111]">Profil akun</h2>
            <dl className="mt-4 space-y-3 text-xs">
              <div><dt className="text-[#686660]">Nama</dt><dd className="mt-0.5 font-semibold text-[#111111]">{customer.displayName}</dd></div>
              <div><dt className="text-[#686660]">Email</dt><dd className="mt-0.5 break-all font-mono text-[#111111]">{customer.emailNormalized}</dd></div>
              <div><dt className="text-[#686660]">WhatsApp</dt><dd className="mt-0.5 font-mono text-[#111111]">{customer.whatsapp || 'Belum diisi'}</dd></div>
            </dl>
          </section>

          <nav aria-label="Navigasi akun" className="grid gap-2">
            <Link href="/orders" className="flex items-center justify-between rounded-xl border border-[#DAD6CD] bg-white px-4 py-3 text-sm font-semibold text-[#111111] transition-colors hover:border-[#6657E8]"><span className="inline-flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-[#6657E8]" /> Pesanan Saya</span><ArrowRight className="h-4 w-4 text-[#686660]" /></Link>
            <Link href="/messages" className="flex items-center justify-between rounded-xl border border-[#DAD6CD] bg-white px-4 py-3 text-sm font-semibold text-[#111111] transition-colors hover:border-[#6657E8]"><span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#6657E8]" /> Pesan</span><ArrowRight className="h-4 w-4 text-[#686660]" /></Link>
            <Link href="/notifications" className="flex items-center justify-between rounded-xl border border-[#DAD6CD] bg-white px-4 py-3 text-sm font-semibold text-[#111111] transition-colors hover:border-[#6657E8]"><span className="inline-flex items-center gap-2"><Bell className="h-4 w-4 text-[#6657E8]" /> Notifikasi</span><ArrowRight className="h-4 w-4 text-[#686660]" /></Link>
          </nav>
        </aside>

        <section className="min-w-0 rounded-2xl border border-[#DAD6CD] bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-[#E5E2D9] p-5 sm:p-6">
            <div><h2 className="text-base font-semibold text-[#111111]">Pesanan saya</h2><p className="mt-1 text-xs text-[#686660]">{customer.orders.length} pesanan terhubung ke akun ini.</p></div>
            <Link href="/orders" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#DAD6CD] px-3 py-2 text-xs font-semibold text-[#111111] hover:border-[#6657E8]">Lihat Semua <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>

          {customer.orders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="font-display text-2xl font-medium text-[#111111]">Belum ada pesanan.</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#686660]">Pesanan dari sesi yang sama akan muncul otomatis setelah checkout.</p>
              <Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#111111] px-5 py-3 text-xs font-semibold text-white hover:bg-[#6657E8]">Lihat Katalog <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E2D9]">
              {customer.orders.map((order) => (
                <article key={order.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-mono text-sm font-semibold text-[#111111]">{order.invoice}</h3><span className="rounded-lg bg-[#F3F0FF] px-2 py-1 text-[10px] font-semibold text-[#5147B8]">{STATUS_LABELS[order.status] || order.status}</span></div>
                    <p className="mt-2 truncate text-xs text-[#686660]">{order.items.map((item) => `${item.productName} x${item.quantity}`).join(', ')}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#686660]"><span>{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span><span className="font-mono font-semibold text-[#111111]">{formatRupiah(order.total)}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {order.conversation && <Link href={`/messages?conversation=${order.conversation.id}`} className="rounded-xl border border-[#DAD6CD] px-3 py-2 text-xs font-semibold text-[#111111] hover:border-[#6657E8]">Pesan</Link>}
                    <Link href={`/order/${order.invoice}`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6657E8]">Buka Pesanan <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
