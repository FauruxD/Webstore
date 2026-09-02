import React from 'react';
import Link from 'next/link';
import { Download, Filter, RotateCcw, Search } from 'lucide-react';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { formatRupiah } from '@/lib/utils/invoice';
import {
  buildReportWhere,
  getReportOrders,
  parseReportFilters,
  REPORT_STATUSES,
  reportFilterQuery,
  summarizeReport,
} from '@/lib/reports/reporting';

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Menunggu Pembayaran',
  WAITING_VERIFICATION: 'Menunggu Verifikasi',
  PAYMENT_REJECTED: 'Pembayaran Ditolak',
  PAYMENT_APPROVED: 'Pembayaran Disetujui',
  PRODUCT_SENT: 'Produk Dikirim',
  COMPLETED: 'Pesanan Selesai',
  EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan',
  REFUNDED: 'Dikembalikan',
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string }>;
}) {
  const filters = parseReportFilters(await searchParams);
  const [orders, totalMatching] = await Promise.all([
    getReportOrders(filters, 250),
    db.order.count({ where: buildReportWhere(filters) }),
  ]);
  const summary = summarizeReport(orders);
  const exportHref = `/api/admin/reports/export?${reportFilterQuery(filters)}`;

  return (
    <div className="w-full min-w-0 space-y-6 font-sans">
      <AdminPageHeader
        eyebrow="ANALISIS PENJUALAN"
        title="Laporan Operasional"
        description="Tinjau transaksi, omzet sah, diskon, pemenuhan produk, dan aktivitas unduhan dalam satu dataset."
        actions={
          <Link href={exportHref} className="inline-flex items-center gap-2 rounded-xl bg-[#6657E8] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#5244D2] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2">
            <Download className="h-4 w-4" /> Export Excel
          </Link>
        }
      />

      <form method="GET" className="admin-surface grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_180px_160px_160px_auto] lg:items-end">
        <div><label htmlFor="report-search" className="mb-1.5 block text-[11px] font-semibold text-[#111111]">Cari laporan</label><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8B80]" /><input id="report-search" name="q" defaultValue={filters.q} placeholder="Invoice, pelanggan, produk..." className="w-full rounded-xl border border-[#E5E2D9] bg-[#F8F6F0] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#6657E8]" /></div></div>
        <div><label htmlFor="report-status" className="mb-1.5 block text-[11px] font-semibold text-[#111111]">Status</label><select id="report-status" name="status" defaultValue={filters.status} className="w-full rounded-xl border border-[#E5E2D9] bg-[#F8F6F0] px-3 py-2.5 text-xs outline-none focus:border-[#6657E8]"><option value="">Semua status</option>{REPORT_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status] || status}</option>)}</select></div>
        <div><label htmlFor="report-from" className="mb-1.5 block text-[11px] font-semibold text-[#111111]">Dari tanggal</label><input id="report-from" type="date" name="from" defaultValue={filters.from} className="w-full rounded-xl border border-[#E5E2D9] bg-[#F8F6F0] px-3 py-2.5 text-xs outline-none focus:border-[#6657E8]" /></div>
        <div><label htmlFor="report-to" className="mb-1.5 block text-[11px] font-semibold text-[#111111]">Sampai tanggal</label><input id="report-to" type="date" name="to" defaultValue={filters.to} className="w-full rounded-xl border border-[#E5E2D9] bg-[#F8F6F0] px-3 py-2.5 text-xs outline-none focus:border-[#6657E8]" /></div>
        <div className="flex gap-2"><button type="submit" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#111111] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#6657E8]"><Filter className="h-3.5 w-3.5" /> Terapkan</button><Link href="/admin/reports" aria-label="Reset filter laporan" title="Reset filter" className="inline-flex items-center justify-center rounded-xl border border-[#E5E2D9] bg-white p-2.5 text-[#686660] hover:text-[#B42318]"><RotateCcw className="h-4 w-4" /></Link></div>
      </form>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Omzet sah', formatRupiah(summary.revenue), 'text-[#111111]'],
          ['Checkout', `${summary.checkout} pesanan`, 'text-[#111111]'],
          ['Diskon', formatRupiah(summary.discount), 'text-[#9A6000]'],
          ['Terkirim', `${summary.delivered} pesanan`, 'text-[#187A4A]'],
          ['Unduhan', `${summary.downloads} kali`, 'text-[#6657E8]'],
        ].map(([label, value, valueClass]) => (
          <div key={label} className="admin-surface min-w-0 p-4 sm:p-5"><span className="text-[11px] text-[#686660]">{label}</span><strong className={`mt-2 block truncate font-mono text-lg ${valueClass}`}>{value}</strong></div>
        ))}
      </div>

      <div className="admin-surface w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E2D9] p-4 sm:p-5"><div><h2 className="text-sm font-semibold text-[#111111]">Detail transaksi yang dilaporkan</h2><p className="mt-1 text-[11px] text-[#686660]">{totalMatching} baris sesuai filter. Tabel menampilkan maksimal 250 baris, sedangkan Excel maksimal 10.000 baris.</p></div><Link href={exportHref} className="text-xs font-semibold text-[#6657E8] hover:underline">Unduh dataset ini</Link></div>
        <div className="w-full overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>Invoice</th><th>Tanggal</th><th>Pelanggan</th><th>Produk</th><th>Subtotal</th><th>Diskon</th><th>Total</th><th>Status</th><th>Waktu Proses</th><th>Unduhan</th></tr></thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={10} className="p-4"><AdminEmptyState title="Tidak Ada Data Laporan" description="Ubah rentang tanggal atau filter status untuk melihat transaksi lain." /></td></tr>
              ) : orders.map((order) => (
                <tr key={order.id}>
                  <td><Link href={`/admin/orders/${order.id}`} className="font-mono font-bold text-[#6657E8] hover:underline">{order.invoice}</Link>{order.couponCode && <span className="mt-1 block text-[9px] text-[#686660]">Kupon: {order.couponCode}</span>}</td>
                  <td className="whitespace-nowrap text-[#686660]">{order.createdAt.toLocaleString('id-ID')}</td>
                  <td><span className="block font-semibold text-[#111111]">{order.customerName}</span><span className="mt-1 block font-mono text-[10px] text-[#686660]">{order.customerEmail}</span></td>
                  <td className="max-w-[260px]"><span className="line-clamp-2 text-[#111111]">{order.items.map((item) => `${item.productName} x${item.quantity}`).join(', ')}</span></td>
                  <td className="whitespace-nowrap font-mono">{formatRupiah(order.subtotal)}</td>
                  <td className="whitespace-nowrap font-mono text-[#9A6000]">{formatRupiah(order.discount)}</td>
                  <td className="whitespace-nowrap font-mono font-bold">{formatRupiah(order.total)}</td>
                  <td className="whitespace-nowrap"><AdminStatusBadge status={order.status} /></td>
                  <td className="min-w-[210px] text-[10px] leading-5 text-[#686660]"><span className="block">Approve: {order.paymentApprovedAt ? order.paymentApprovedAt.toLocaleString('id-ID') : '-'}</span><span className="block">Kirim: {order.productSentAt ? order.productSentAt.toLocaleString('id-ID') : '-'}</span><span className="block">Selesai: {order.completedAt ? order.completedAt.toLocaleString('id-ID') : '-'}</span></td>
                  <td className="whitespace-nowrap font-mono">{order.entitlements.reduce((sum, item) => sum + item.downloadCount, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
