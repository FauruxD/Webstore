import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { formatRupiah } from '@/lib/utils/invoice';
import { OrderTimeline } from '@/components/commerce/order/OrderTimeline';
import { Download, AlertCircle, RefreshCw, FileCheck, ShieldCheck, MessageCircle, Bell } from 'lucide-react';
import { getCustomerSession } from '@/lib/customer-auth';

interface OrderTrackingPageProps {
  params: Promise<{ invoice: string }>;
}

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const { invoice } = await params;
  const customerSession = await getCustomerSession();
  if (!customerSession) notFound();

  const order = await db.order.findFirst({
    where: { invoice, customerAccessId: customerSession.id },
    include: {
      items: {
        include: {
          entitlement: { include: { fileAsset: true } },
        },
      },
      proofs: { orderBy: { createdAt: 'desc' } },
      conversation: { select: { id: true } },
    },
  });

  if (!order) notFound();
  const isDelivered = order.status === 'PRODUCT_SENT' || order.status === 'COMPLETED';
  const isRejected = order.status === 'PAYMENT_REJECTED';

  return (
    <div className="min-h-screen bg-[#F4F1EA] py-12 px-6 md:px-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#DAD6CD] pb-6 gap-4">
          <div>
            <span className="text-xs text-[#686660] block">Detail Status Pesanan</span>
            <h1 className="font-mono text-2xl font-bold text-[#111111]">{order.invoice}</h1>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {order.conversation && (
              <Link href={`/messages?conversation=${order.conversation.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-[#DAD6CD] bg-white px-3 py-2 font-semibold text-[#111111] hover:border-[#6657E8]">
                <MessageCircle className="h-3.5 w-3.5" />Hubungi Penjual
              </Link>
            )}
            <Link href="/notifications" aria-label="Buka notifikasi" className="rounded-xl border border-[#DAD6CD] bg-white p-2 text-[#686660] hover:text-[#6657E8]"><Bell className="h-4 w-4" /></Link>
            <span className="text-[#686660]">Tanggal: {new Date(order.createdAt).toLocaleDateString('id-ID')}</span>
            <span className="font-bold text-[#6657E8] bg-[#E8E4FF] px-3 py-1 rounded-full">
              {order.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Rejection Notice Banner */}
        {isRejected && (
          <div className="p-6 bg-[#B42318]/10 border border-[#B42318]/20 rounded-3xl space-y-3">
            <div className="flex items-center gap-3 text-[#B42318] font-semibold text-base">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Pembayaran Ditolak Admin</span>
            </div>
            <p className="text-xs text-[#B42318]/90">
              <strong>Alasan:</strong> {order.rejectionReason || 'Bukti transfer tidak sesuai dengan mutasi merchant.'}
            </p>
            <div className="pt-2">
              <Link
                href={`/payment/${order.invoice}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B42318] text-white text-xs font-semibold rounded-xl hover:bg-[#961c13] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload Ulang Bukti Pembayaran</span>
              </Link>
            </div>
          </div>
        )}

        {/* Order Status Timeline */}
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

        {order.proofs.some((proof) => proof.rejectionReason) && (
          <div className="rounded-2xl border border-[#DAD6CD] bg-white p-6">
            <h3 className="text-sm font-semibold text-[#111111]">Riwayat Pemeriksaan Bukti</h3>
            <div className="mt-4 space-y-3">
              {order.proofs.filter((proof) => proof.rejectionReason).map((proof) => (
                <div key={proof.id} className="rounded-xl bg-[#B42318]/5 p-4 text-xs">
                  <p className="font-semibold text-[#B42318]">Bukti ditolak · {new Date(proof.reviewedAt || proof.createdAt).toLocaleString('id-ID')}</p>
                  <p className="mt-1 text-[#686660]">{proof.rejectionReason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Delivery / Entitlements Download Section */}
        {isDelivered && (
          <div id="downloads" className="bg-white border border-[#DAD6CD] rounded-3xl p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#DAD6CD] pb-4">
              <FileCheck className="w-6 h-6 text-[#187A4A]" />
              <div>
                <h3 className="font-semibold text-lg text-[#111111]">Akses Unduhan Produk Digital</h3>
                <p className="text-xs text-[#686660]">
                  Klik tombol unduh di bawah untuk mengunduh file asli kamu secara aman.
                </p>
              </div>
            </div>

            {order.deliveryNote && (
              <div className="rounded-2xl border border-[#CFC8F5] bg-[#F3F0FF] p-4 text-xs">
                <p className="font-semibold text-[#3F349E]">Catatan dari penjual</p>
                <p className="mt-1 whitespace-pre-wrap leading-5 text-[#686660]">{order.deliveryNote}</p>
              </div>
            )}

            <div className="space-y-4">
              {order.items.map((item) => {
                const entitlement = item.entitlement;
                const downloadUrl = entitlement ? `/api/customer/downloads/${entitlement.id}` : '#';

                return (
                  <div
                    key={item.id}
                    className="p-5 bg-[#F4F1EA] rounded-2xl border border-[#DAD6CD] flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-semibold text-base text-[#111111]">{item.productName}</h4>
                      <span className="text-xs text-[#686660] block mt-0.5">Lisensi: {item.license}</span>
                      {entitlement?.fileAsset && (
                        <span className="mt-1 block text-[11px] text-[#686660]">
                          File: {entitlement.fileAsset.originalName}
                        </span>
                      )}
                      {entitlement && (
                        <div className="text-[11px] text-[#686660] mt-2 space-x-3">
                          <span>Sisa Kuota Unduhan: <strong>{entitlement.maxDownloads - entitlement.downloadCount} / {entitlement.maxDownloads}</strong></span>
                          <span>•</span>
                          <span>Berlaku hingga: <strong>{new Date(entitlement.expiresAt).toLocaleDateString('id-ID')}</strong></span>
                        </div>
                      )}
                    </div>

                    {entitlement ? (
                      <a
                        href={downloadUrl}
                        download
                        className="px-5 py-3 bg-[#6657E8] hover:bg-[#5244d2] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh File Produk</span>
                      </a>
                    ) : (
                      <span className="text-xs text-[#686660]">Membuat entitlement...</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Customer & Line Item Summary */}
        <div className="bg-white border border-[#DAD6CD] rounded-3xl p-8 space-y-6">
          <h3 className="font-semibold text-base text-[#111111]">Rincian Transaksi</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#686660] border-b border-[#DAD6CD] pb-6">
            <div>
              <span className="block font-semibold text-[#111111] mb-1">Data Pembeli</span>
              <p>Nama: {order.customerName}</p>
              <p>Email: {order.customerEmail}</p>
              <p>WhatsApp: {order.customerWhatsapp}</p>
            </div>
            <div>
              <span className="block font-semibold text-[#111111] mb-1">Rincian Harga</span>
              <p>Subtotal: {formatRupiah(order.subtotal)}</p>
              {order.discount > 0 && <p className="text-[#187A4A]">Diskon Promo: -{formatRupiah(order.discount)}</p>}
              <p className="font-bold text-sm text-[#111111] mt-1">Total: {formatRupiah(order.total)}</p>
            </div>
          </div>

          <div className="p-4 bg-[#F4F1EA] rounded-2xl flex items-center gap-3 text-xs text-[#686660]">
            <ShieldCheck className="w-5 h-5 text-[#187A4A] shrink-0" />
            <span>Akses halaman dan file dilindungi oleh sesi pelanggan privat. Jangan membagikan perangkat atau sesi browser kepada orang lain.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
