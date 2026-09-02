import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { formatRupiah } from '@/lib/utils/invoice';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { Search, Filter, Eye } from 'lucide-react';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const whereClause: any = {};
  if (status) {
    whereClause.status = status;
  }
  if (q) {
    whereClause.OR = [
      { invoice: { contains: q } },
      { customerName: { contains: q } },
      { customerEmail: { contains: q } },
    ];
  }

  const orders = await db.order.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: { items: true, entitlements: true },
  });

  return (
    <div className="space-y-6 w-full min-w-0 font-sans">
      <AdminPageHeader
        eyebrow="TRANSAKSI"
        title="Daftar Pesanan"
        description="Kelola seluruh pesanan pembeli, status pembayaran QRIS, dan pengiriman produk digital."
      />

      {/* Toolbar & Filter Card */}
      <div className="admin-surface p-4 md:p-5 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        <form method="GET" className="flex-1 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#686660] absolute left-3.5 top-3.5" />
            <input
              type="text"
              name="q"
              defaultValue={q || ''}
              placeholder="Cari Invoice, Nama, atau Email..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8F6F0] border border-[#E5E2D9] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
            />
          </div>

          <div className="relative min-w-[180px]">
            <Filter className="w-4 h-4 text-[#686660] absolute left-3.5 top-3.5" />
            <select
              name="status"
              defaultValue={status || ''}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8F6F0] border border-[#E5E2D9] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8] appearance-none"
            >
              <option value="">Semua Status</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="WAITING_VERIFICATION">Waiting Verification</option>
              <option value="PAYMENT_APPROVED">Pembayaran Disetujui</option>
              <option value="PRODUCT_SENT">Produk Dikirim</option>
              <option value="COMPLETED">Order Selesai</option>
              <option value="PAYMENT_REJECTED">Payment Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 bg-[#111111] text-white font-semibold text-xs rounded-xl hover:bg-[#6657E8] transition-colors shadow-xs cursor-pointer"
          >
            Filter
          </button>

          {(q || status) && (
            <Link
              href="/admin/orders"
              className="px-3 py-2.5 text-xs text-[#686660] hover:text-[#B42318] font-medium"
            >
              Reset
            </Link>
          )}
        </form>
      </div>

      {/* Orders Table Surface Card */}
      <div className="admin-surface w-full min-w-0">
        <div className="overflow-x-auto w-full">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Pembeli</th>
                <th>Item Produk</th>
                <th>Total</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Waktu Proses</th>
                <th>Download</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4">
                    <AdminEmptyState
                      title={q || status ? 'Pesanan Tidak Ditemukan' : 'Belum Ada Pesanan'}
                      description={
                        q || status
                          ? 'Tidak ada pesanan yang sesuai dengan kriteria filter.'
                          : 'Pesanan baru akan muncul di sini setelah pembeli checkout.'
                      }
                      action={
                        (q || status) ? (
                          <Link
                            href="/admin/orders"
                            className="px-4 py-2 bg-[#F4F1EA] text-xs font-semibold rounded-lg text-[#111111] inline-block"
                          >
                            Reset Filter
                          </Link>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                orders.map((ord: (typeof orders)[number]) => (
                  <tr key={ord.id}>
                    <td className="font-mono font-bold text-[#6657E8] whitespace-nowrap">
                      {ord.invoice}
                    </td>
                    <td>
                      <span className="admin-cell-title">
                        {ord.customerName}
                      </span>
                      <span className="text-[11px] text-[#686660]">{ord.customerEmail}</span>
                    </td>
                    <td>
                      <span className="font-medium text-[#111111] truncate block max-w-[200px]">
                        {ord.items.map((i: (typeof ord.items)[number]) => i.productName).join(', ')}
                      </span>
                      <span className="text-[10px] text-[#686660]">
                        {ord.items.length} Aset Digital
                      </span>
                    </td>
                    <td className="font-sans font-semibold tabular-nums whitespace-nowrap text-sm">
                      {formatRupiah(ord.total)}
                    </td>
                    <td className="whitespace-nowrap">
                      <AdminStatusBadge status={ord.status} />
                    </td>
                    <td className="text-[#686660] whitespace-nowrap">
                      {new Date(ord.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="whitespace-nowrap text-[10px] leading-5 text-[#686660]">
                      <span className="block">Approve: {ord.paymentApprovedAt ? new Date(ord.paymentApprovedAt).toLocaleString('id-ID') : '—'}</span>
                      <span className="block">Kirim: {ord.productSentAt ? new Date(ord.productSentAt).toLocaleString('id-ID') : '—'}</span>
                      <span className="block">Selesai: {ord.completedAt ? new Date(ord.completedAt).toLocaleString('id-ID') : '—'}</span>
                    </td>
                    <td className="whitespace-nowrap text-[11px] text-[#686660]">
                      {ord.entitlements.length > 0
                        ? `${ord.entitlements.reduce((sum, item) => sum + item.downloadCount, 0)} unduhan`
                        : 'Belum dikirim'}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="p-2 rounded-lg bg-[#F4F1EA] hover:bg-[#6657E8] hover:text-white text-[#111111] transition-colors inline-flex items-center gap-1 font-semibold text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
