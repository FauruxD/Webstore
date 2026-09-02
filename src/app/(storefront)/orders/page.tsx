import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Clock3,
  Download,
  MessageCircle,
  Package,
  ReceiptText,
  Search,
  ShoppingBag,
} from 'lucide-react';
import { getCustomerSession } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import {
  CUSTOMER_ORDER_FILTERS,
  getCustomerOrderPrimaryAction,
  getCustomerOrderStatusMeta,
  matchesCustomerOrderFilter,
  parseCustomerOrderFilter,
  type CustomerOrderTone,
} from '@/lib/orders/customer-order';
import { formatRupiah } from '@/lib/utils/invoice';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Pesanan Saya | Digital Atelier',
  description: 'Lihat status, pembayaran, pesan, dan akses unduhan pesanan Digital Atelier.',
};

export const dynamic = 'force-dynamic';

interface CustomerOrdersPageProps {
  searchParams: Promise<{ status?: string | string[] }>;
}

const TONE_CLASSES: Record<CustomerOrderTone, string> = {
  neutral: 'border-[#DAD6CD] bg-[#F4F1EA] text-[#4F4C46]',
  warning: 'border-[#D9B86C]/55 bg-[#FFF7E3] text-[#795710]',
  danger: 'border-[#B42318]/20 bg-[#B42318]/8 text-[#9D1D14]',
  info: 'border-[#6657E8]/20 bg-[#F3F0FF] text-[#5147B8]',
  success: 'border-[#187A4A]/20 bg-[#E8F4ED] text-[#17623F]',
};

function formatOrderDate(value: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

export default async function CustomerOrdersPage({ searchParams }: CustomerOrdersPageProps) {
  const session = await getCustomerSession();
  const filter = parseCustomerOrderFilter((await searchParams).status);

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-12 sm:px-6 md:px-12 md:py-20">
        <section className="grid overflow-hidden rounded-2xl border border-[#DAD6CD] bg-white lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-7 sm:p-10 lg:p-14">
            <ReceiptText className="h-8 w-8 text-[#6657E8]" aria-hidden="true" />
            <h1 className="mt-8 max-w-xl font-display text-4xl font-medium tracking-[-0.035em] text-[#111111] sm:text-5xl">
              Pesanan Saya
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#686660]">
              Masuk untuk melihat seluruh pesanan, status pembayaran, percakapan, dan akses produkmu.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login?next=/orders" className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6657E8] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]">
                Masuk ke Akun <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/track-order" className="inline-flex items-center gap-2 rounded-xl border border-[#DAD6CD] bg-white px-5 py-3 text-sm font-semibold text-[#111111] transition-colors hover:border-[#6657E8] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]">
                <Search className="h-4 w-4" /> Lacak Pesanan
              </Link>
            </div>
          </div>
          <div className="flex min-h-64 items-center justify-center bg-[#E8E4FF] p-10 text-[#5147B8]">
            <ShoppingBag className="h-28 w-28 stroke-[1.1]" aria-hidden="true" />
          </div>
        </section>
      </div>
    );
  }

  const orders = await db.order.findMany({
    where: { customerAccessId: session.id },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: {
              slug: true,
              media: {
                where: { type: 'IMAGE' },
                orderBy: { position: 'asc' },
                take: 1,
                select: { url: true, altText: true },
              },
            },
          },
          entitlement: { select: { id: true, downloadCount: true, maxDownloads: true, revokedAt: true } },
        },
      },
      conversation: { select: { id: true } },
    },
  });

  const visibleOrders = orders.filter((order) => matchesCustomerOrderFilter(order.status, filter));
  const actionCount = orders.filter((order) => matchesCustomerOrderFilter(order.status, 'action')).length;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 md:px-12 md:py-14">
      <header className="border-b border-[#DAD6CD] pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6657E8]">Ruang pelanggan</p>
            <h1 className="mt-2 font-display text-4xl font-medium tracking-[-0.035em] text-[#111111] sm:text-5xl">Pesanan Saya</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#686660]">Pantau pembayaran, pengiriman produk, percakapan, dan akses unduhan dalam satu halaman.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#686660]">
            <span><strong className="font-mono text-base text-[#111111]">{orders.length}</strong> total pesanan</span>
            {actionCount > 0 && <span className="rounded-lg bg-[#FFF7E3] px-2.5 py-1.5 font-semibold text-[#795710]">{actionCount} perlu tindakan</span>}
          </div>
        </div>

        <nav aria-label="Filter pesanan" className="mt-7 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CUSTOMER_ORDER_FILTERS.map((item) => {
            const active = item.value === filter;
            const href = item.value === 'all' ? '/orders' : `/orders?status=${item.value}`;
            const count = orders.filter((order) => matchesCustomerOrderFilter(order.status, item.value)).length;
            return (
              <Link
                key={item.value}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]',
                  active
                    ? 'border-[#111111] bg-[#111111] text-white'
                    : 'border-[#DAD6CD] bg-white text-[#4F4C46] hover:border-[#6657E8] hover:text-[#111111]',
                )}
              >
                {item.label} <span className={active ? 'text-white/70' : 'text-[#77736B]'}>{count}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {visibleOrders.length === 0 ? (
        <section className="py-20 text-center">
          <Package className="mx-auto h-10 w-10 text-[#6657E8]" aria-hidden="true" />
          <h2 className="mt-6 font-display text-3xl font-medium text-[#111111]">
            {orders.length === 0 ? 'Belum ada pesanan.' : 'Tidak ada pesanan di status ini.'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#686660]">
            {orders.length === 0
              ? 'Pesanan dari checkout atau pelacakan yang berhasil akan muncul otomatis di sini.'
              : 'Pilih filter lain untuk melihat pesanan yang sedang berjalan atau sudah selesai.'}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white hover:bg-[#6657E8]">Lihat Katalog <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/track-order" className="inline-flex items-center gap-2 rounded-xl border border-[#DAD6CD] bg-white px-5 py-3 text-sm font-semibold text-[#111111] hover:border-[#6657E8]"><Search className="h-4 w-4" /> Lacak Pesanan</Link>
          </div>
        </section>
      ) : (
        <section aria-label="Daftar pesanan" className="mt-8 space-y-4">
          {visibleOrders.map((order) => {
            const status = getCustomerOrderStatusMeta(order.status);
            const firstItem = order.items[0];
            const preview = firstItem?.product.media[0];
            const entitlements = order.items.map((item) => item.entitlement).filter(Boolean);
            const hasDownload = entitlements.some((entitlement) => entitlement && !entitlement.revokedAt);
            const primaryAction = getCustomerOrderPrimaryAction(order.status, order.invoice, hasDownload);
            const remainingDownloads = entitlements.reduce(
              (total, entitlement) => total + (entitlement ? Math.max(0, entitlement.maxDownloads - entitlement.downloadCount) : 0),
              0,
            );

            return (
              <article key={order.id} className="overflow-hidden rounded-2xl border border-[#DAD6CD] bg-white">
                <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 p-5 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5 sm:p-6 lg:grid-cols-[112px_minmax(0,1fr)_auto] lg:items-center">
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-[#E5E2D9] bg-[#F3F0FF]">
                    {preview ? (
                      <Image
                        src={preview.url}
                        alt={preview.altText || firstItem?.productName || 'Produk digital'}
                        fill
                        unoptimized
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Package className="h-8 w-8 text-[#6657E8]" aria-hidden="true" /></div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-mono text-sm font-semibold text-[#111111]">{order.invoice}</h2>
                      <span className={cn('rounded-lg border px-2.5 py-1 text-[10px] font-semibold', TONE_CLASSES[status.tone])}>{status.label}</span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-[#111111]">
                      {firstItem?.productName || 'Pesanan produk digital'}
                      {order.items.length > 1 && <span className="font-normal text-[#686660]"> dan {order.items.length - 1} produk lain</span>}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#686660]">{status.description}</p>
                    {order.status === 'PAYMENT_REJECTED' && order.rejectionReason && (
                      <p className="mt-2 text-xs font-medium text-[#9D1D14]">Alasan: {order.rejectionReason}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-[#686660]">
                      <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {formatOrderDate(order.createdAt)}</span>
                      <span className="font-mono font-semibold text-[#111111]">{formatRupiah(order.total)}</span>
                      {hasDownload && <span className="inline-flex items-center gap-1.5 text-[#17623F]"><Download className="h-3.5 w-3.5" /> {remainingDownloads} unduhan tersisa</span>}
                    </div>
                    <div className="mt-4 flex items-center gap-1.5" aria-label={`Progres pesanan ${status.progress} dari 5 tahap`}>
                      {[1, 2, 3, 4, 5].map((step) => (
                        <span key={step} className={cn('h-1.5 flex-1 rounded-full', step <= status.progress ? 'bg-[#6657E8]' : 'bg-[#E5E2D9]')} aria-hidden="true" />
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:col-start-2 lg:col-start-auto lg:max-w-44 lg:justify-end">
                    {order.conversation && (
                      <Link href={`/messages?conversation=${order.conversation.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DAD6CD] px-3.5 py-2.5 text-xs font-semibold text-[#111111] hover:border-[#6657E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]">
                        <MessageCircle className="h-3.5 w-3.5" /> Pesan
                      </Link>
                    )}
                    <Link href={primaryAction.href} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#111111] px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#6657E8] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]">
                      {primaryAction.label} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    {primaryAction.href !== `/order/${order.invoice}` && (
                      <Link href={`/order/${order.invoice}`} className="w-full text-center text-[11px] font-semibold text-[#686660] underline-offset-4 hover:text-[#111111] hover:underline">Lihat Detail</Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
