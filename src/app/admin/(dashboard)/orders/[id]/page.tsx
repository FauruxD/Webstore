import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { formatRupiah } from '@/lib/utils/invoice';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { ArrowLeft, User, Mail, Phone } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { OrderTimeline } from '@/components/commerce/order/OrderTimeline';
import { OrderActions } from '@/components/admin/orders/OrderActions';
import { PaymentProofHistory } from '@/components/admin/orders/PaymentProofHistory';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      proofs: { orderBy: { createdAt: 'desc' }, include: { fileAsset: true } },
      entitlements: { include: { orderItem: true, downloads: true, fileAsset: true } },
      conversation: { select: { id: true } },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6 w-full min-w-0 font-sans">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/orders"
          className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E2D9] text-xs font-semibold text-[#686660] hover:text-[#111111] flex items-center gap-1.5 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Orders</span>
        </Link>
      </div>

      <AdminPageHeader
        eyebrow="DETAIL PESANAN"
        title={`Invoice ${order.invoice}`}
        description={`Dibuat pada ${new Date(order.createdAt).toLocaleString('id-ID')}`}
        actions={<AdminStatusBadge status={order.status} />}
      />

      <OrderTimeline
        status={order.status}
        createdAt={order.createdAt}
        proofSubmittedAt={order.paymentProofSubmittedAt}
        approvedAt={order.paymentApprovedAt}
        rejectedAt={order.paymentRejectedAt}
        productSentAt={order.productSentAt}
        completedAt={order.completedAt}
        rejectionReason={order.rejectionReason}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start w-full min-w-0">
        {/* Left Column (8 Cols) - Items & Proofs */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          {/* Order Items Card */}
          <div className="admin-surface p-6 space-y-4">
            <h3 className="font-semibold text-sm text-[#111111]">Item Produk Digital</h3>
            <div className="divide-y divide-[#E5E2D9]">
              {order.items.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#111111] block">{item.productName}</span>
                    <span className="text-[11px] text-[#686660]">{item.license}</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#111111] tabular-nums">
                    {formatRupiah(item.unitPrice)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#E5E2D9] space-y-2 text-xs text-[#686660]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-[#111111]">{formatRupiah(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#187A4A]">
                  <span>Diskon Kupon ({order.couponCode})</span>
                  <span className="font-mono">-{formatRupiah(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-[#111111] pt-2 border-t border-[#E5E2D9]">
                <span>Total Nominal</span>
                <span className="font-mono text-[#6657E8]">{formatRupiah(order.total)}</span>
              </div>
            </div>
          </div>

          {(order.status === 'PRODUCT_SENT' || order.status === 'COMPLETED') && (
            <div className="admin-surface p-6 space-y-4">
              <h3 className="font-semibold text-sm text-[#111111]">Status Pengiriman &amp; Unduhan</h3>
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-xl bg-[#F8F6F0] p-4"><span className="block text-[#686660]">Pembayaran disetujui</span><strong className="mt-1 block text-[#111111]">{order.paymentApprovedAt ? new Date(order.paymentApprovedAt).toLocaleString('id-ID') : '—'}</strong></div>
                <div className="rounded-xl bg-[#F8F6F0] p-4"><span className="block text-[#686660]">Produk dikirim</span><strong className="mt-1 block text-[#111111]">{order.productSentAt ? new Date(order.productSentAt).toLocaleString('id-ID') : '—'}</strong></div>
                <div className="rounded-xl bg-[#F8F6F0] p-4"><span className="block text-[#686660]">Pesanan selesai</span><strong className="mt-1 block text-[#111111]">{order.completedAt ? new Date(order.completedAt).toLocaleString('id-ID') : 'Belum selesai'}</strong></div>
              </div>
              <div className="divide-y divide-[#E5E2D9] rounded-xl border border-[#E5E2D9]">
                {order.entitlements.map((entitlement) => (
                  <div key={entitlement.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs">
                    <div className="min-w-0">
                      <span className="block font-semibold text-[#111111]">{entitlement.orderItem.productName}</span>
                      {entitlement.fileAsset && (
                        <span className="mt-0.5 block truncate text-[10px] text-[#686660]">
                          File: {entitlement.fileAsset.originalName}
                        </span>
                      )}
                    </div>
                    <span className="text-[#686660]">Unduhan: {entitlement.downloadCount}/{entitlement.maxDownloads} · {entitlement.downloads.length} event</span>
                  </div>
                ))}
              </div>
              {order.deliveryNote && (
                <div className="rounded-xl border border-[#E5E2D9] bg-[#FCFBF7] p-4 text-xs">
                  <span className="font-semibold text-[#111111]">Catatan pengiriman</span>
                  <p className="mt-1 whitespace-pre-wrap leading-5 text-[#686660]">{order.deliveryNote}</p>
                </div>
              )}
            </div>
          )}

          {/* Payment Proof Card */}
          <div className="admin-surface p-6 space-y-4">
            <h3 className="font-semibold text-sm text-[#111111]">Riwayat Bukti Pembayaran</h3>

            <PaymentProofHistory
              order={{
                id: order.id,
                invoice: order.invoice,
                status: order.status,
                total: order.total,
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                customerWhatsapp: order.customerWhatsapp,
                items: order.items.map((item) => ({
                  id: item.id,
                  productName: item.productName,
                  unitPrice: item.unitPrice,
                  quantity: item.quantity,
                })),
              }}
              proofs={order.proofs.map((proof) => ({
                id: proof.id,
                fileId: proof.fileId,
                originalName: proof.fileAsset.originalName,
                senderName: proof.senderName,
                amount: proof.amount,
                paidAt: proof.paidAt.toISOString(),
                note: proof.note,
                status: proof.status,
                rejectionReason: proof.rejectionReason,
                reviewedAt: proof.reviewedAt?.toISOString() || null,
                createdAt: proof.createdAt.toISOString(),
              }))}
            />
          </div>
        </div>

        {/* Right Column (4 Cols) - Customer Info */}
        <div className="xl:col-span-4 space-y-6 min-w-0">
          <div className="admin-surface p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-sm text-[#111111]">Informasi Pembeli</h3>
            {order.conversation && <Link href={`/admin/messages?conversation=${order.conversation.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8E4FF] px-2.5 py-1.5 text-[10px] font-semibold text-[#6657E8]"><MessageCircle className="h-3.5 w-3.5" />Pesan</Link>}
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 text-[#686660]">
              <User className="w-4 h-4 shrink-0 text-[#6657E8]" />
              <span className="font-medium text-[#111111]">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-3 text-[#686660]">
              <Mail className="w-4 h-4 shrink-0 text-[#6657E8]" />
              <span className="font-medium text-[#111111]">{order.customerEmail}</span>
            </div>
            <div className="flex items-center gap-3 text-[#686660]">
              <Phone className="w-4 h-4 shrink-0 text-[#6657E8]" />
              <span className="font-medium text-[#111111]">{order.customerWhatsapp}</span>
            </div>
          </div>
          </div>
          <OrderActions orderId={order.id} status={order.status} />
        </div>
      </div>
    </div>
  );
}
