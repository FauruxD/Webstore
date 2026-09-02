import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { formatRupiah } from '@/lib/utils/invoice';
import { PaymentProofUploader } from '@/components/commerce/payment/PaymentProofUploader';
import { CopyButton } from '@/components/commerce/payment/CopyButton';
import { Clock, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { getCustomerSession } from '@/lib/customer-auth';

interface PaymentPageProps {
  params: Promise<{ invoice: string }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { invoice } = await params;
  const customerSession = await getCustomerSession();
  if (!customerSession) notFound();

  const order = await db.order.findFirst({
    where: { invoice, customerAccessId: customerSession.id },
    include: {
      items: true,
      proofs: { where: { status: 'ACTIVE' }, take: 1 },
    },
  });

  if (!order) notFound();

  const qrisSetting = await db.storeSetting.findUnique({ where: { key: 'qris_image_url' } });
  const merchantSetting = await db.storeSetting.findUnique({ where: { key: 'merchant_name' } });

  const qrisUrl = qrisSetting?.value || '/images/qris-demo.svg';
  const merchantName = merchantSetting?.value || 'FA RUX DIGITAL STORE';

  const trackingUrl = `/order/${order.invoice}`;

  return (
    <div className="min-h-screen bg-[#F4F1EA] py-12 px-6 md:px-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-[#DAD6CD] pb-6">
          <div>
            <span className="text-xs text-[#686660] block">Nomor Invoice</span>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-bold text-[#111111]">{order.invoice}</h1>
              <CopyButton text={order.invoice} label="Salin Invoice" />
            </div>
          </div>

          <Link
            href={trackingUrl}
            className="text-xs font-semibold text-[#6657E8] hover:underline flex items-center gap-1"
          >
            <span>Halaman Tracking Status</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Status Banner */}
        {order.status === 'PENDING_PAYMENT' && (
          <div className="p-4 bg-[#9A6000]/10 border border-[#9A6000]/20 rounded-2xl flex items-center justify-between text-xs text-[#9A6000]">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 shrink-0" />
              <span>
                Selesaikan pembayaran dalam <strong>24 jam</strong> sebelum pesanan otomatis kedaluwarsa.
              </span>
            </div>
          </div>
        )}

        {order.status === 'WAITING_VERIFICATION' && (
          <div className="p-4 bg-[#6657E8]/10 border border-[#6657E8]/20 rounded-2xl flex items-center justify-between text-xs text-[#6657E8]">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 shrink-0" />
              <span>
                Bukti pembayaran telah dikirim dan sedang dalam <strong>Antrean Verifikasi Admin</strong>.
              </span>
            </div>
            <Link href={trackingUrl} className="font-bold underline">
              Cek Status Order
            </Link>
          </div>
        )}

        {/* Main Grid: QRIS Card & Upload Panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* QRIS Display (5 Cols) */}
          <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-[#DAD6CD] shadow-sm space-y-6 text-center">
            <div>
              <span className="text-xs font-semibold text-[#686660] uppercase tracking-wider block">
                Total Pembayaran
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="font-mono text-3xl font-bold text-[#6657E8] tabular-nums">
                  {formatRupiah(order.total)}
                </span>
                <CopyButton text={String(order.total)} label="Salin Total" />
              </div>
              <p className="text-[11px] text-[#686660] mt-1">
                Bayar tepat sesuai nominal agar verifikasi cepat.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="relative aspect-square w-full max-w-[260px] mx-auto bg-white p-4 rounded-2xl border-2 border-[#DAD6CD] shadow-inner">
              <Image
                src={qrisUrl}
                alt="QRIS Merchant Payment"
                fill
                className="object-contain p-2"
              />
            </div>

            <div>
              <span className="text-xs font-bold text-[#111111] block">{merchantName}</span>
              <span className="text-[11px] text-[#686660]">Mendukung GoPay, OVO, ShopeePay, Dana, BCA, Mandiri QRIS</span>
            </div>
          </div>

          {/* Payment Steps & Proof Uploader (7 Cols) */}
          <div className="md:col-span-7 space-y-6">
            {/* Step Instructions */}
            <div className="bg-white p-6 rounded-3xl border border-[#DAD6CD] shadow-sm space-y-4">
              <h3 className="font-semibold text-base text-[#111111]">Langkah Pembayaran</h3>
              <ol className="space-y-2.5 text-xs text-[#686660] list-decimal list-inside">
                <li>Buka aplikasi m-Banking atau E-Wallet yang mendukung QRIS.</li>
                <li>Pindai QR Code statis di samping.</li>
                <li>Masukkan nominal transfer tepat sebesar <strong className="text-[#111111]">{formatRupiah(order.total)}</strong>.</li>
                <li>Selesaikan transaksi, lalu simpan screenshot bukti pembayaran.</li>
                <li>Unggah foto/screenshot bukti pada form di bawah.</li>
              </ol>

              <div className="p-3 bg-[#F4F1EA] rounded-xl text-[11px] text-[#686660] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#9A6000] shrink-0" />
                <span>QRIS ini statis. Pastikan memasukkan nominal secara manual di aplikasi pembayaranmu.</span>
              </div>
            </div>

            {/* Payment Proof Uploader Form */}
            {order.status === 'PENDING_PAYMENT' || order.status === 'PAYMENT_REJECTED' ? (
              <PaymentProofUploader
                invoice={order.invoice}
                expectedAmount={order.total}
              />
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-[#DAD6CD] text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-[#187A4A] mx-auto" />
                <h3 className="font-semibold text-lg text-[#111111]">Bukti Pembayaran Sudah Diunggah</h3>
                <p className="text-xs text-[#686660]">
                  Pesananmu sedang diproses oleh admin. Kamu dapat memantau status secara berkala melalui link tracking di bawah.
                </p>
                <Link
                  href={trackingUrl}
                  className="inline-block py-3 px-6 bg-[#6657E8] text-white font-semibold text-xs rounded-xl hover:bg-[#5244d2] transition-colors"
                >
                  Buka Halaman Tracking Status Pesanan
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
