'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, ShieldAlert } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/invoice';
import { CopyButton } from '@/components/commerce/payment/CopyButton';
import { PaymentProofUploader } from '@/components/commerce/payment/PaymentProofUploader';

export interface OrderPaymentStepProps {
  invoice: string;
  total: number;
  /** ISO string from the checkout response. */
  expiresAt: string;
  qrisUrl: string;
  merchantName: string;
  trackingUrl: string;
}

function formatDeadline(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function remainingLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Waktu pembayaran telah habis';

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `Sisa waktu ${hours} jam ${minutes} menit`;
}

/**
 * Second step of the checkout dialog. The order already exists at this point,
 * so this only presents the QRIS instructions and reuses the same proof
 * uploader the standalone payment page uses.
 */
export function OrderPaymentStep({
  invoice,
  total,
  expiresAt,
  qrisUrl,
  merchantName,
  trackingUrl,
}: OrderPaymentStepProps) {
  // Rendered client-side only so server and client markup cannot disagree.
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    setCountdown(remainingLabel(expiresAt));
    const timer = window.setInterval(() => setCountdown(remainingLabel(expiresAt)), 30_000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#187A4A]/20 bg-[#187A4A]/10 p-4 text-xs text-[#187A4A]">
        Pesanan berhasil dibuat. Selesaikan pembayaran QRIS di bawah, lalu unggah bukti transfer.
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-5 lg:col-span-5">
          <div className="space-y-5 rounded-3xl border border-[#DAD6CD] bg-white p-6 text-center">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.09em] text-[#686660]">
                Nomor Invoice
              </span>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="font-mono text-sm font-bold text-[#111111]">{invoice}</span>
                <CopyButton text={invoice} label="Salin Invoice" />
              </div>
            </div>

            <div className="border-t border-[#DAD6CD] pt-4">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.09em] text-[#686660]">
                Total Pembayaran
              </span>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="font-mono text-2xl font-bold tabular-nums text-[#6657E8]">
                  {formatRupiah(total)}
                </span>
                <CopyButton text={String(total)} label="Salin Total" />
              </div>
              <p className="mt-1 text-[11px] text-[#686660]">
                Bayar tepat sesuai nominal agar verifikasi cepat.
              </p>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-[240px] rounded-2xl border-2 border-[#DAD6CD] bg-white p-4">
              <Image src={qrisUrl} alt="Kode QRIS pembayaran" fill className="object-contain p-2" />
            </div>

            <div>
              <span className="block text-xs font-bold text-[#111111]">{merchantName}</span>
              <span className="text-[11px] text-[#686660]">
                Mendukung GoPay, OVO, ShopeePay, Dana, BCA, dan Mandiri QRIS
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#9A6000]/20 bg-[#9A6000]/10 p-4 text-xs text-[#9A6000]">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Batas pembayaran {formatDeadline(expiresAt)}</p>
                {countdown && <p className="mt-0.5 text-[11px]">{countdown}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-2xl bg-[#F4F1EA] p-4 text-[11px] text-[#686660]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#9A6000]" />
            <span>
              QRIS ini statis. Masukkan nominal secara manual di aplikasi pembayaranmu, lalu
              tunggu verifikasi manual oleh admin.
            </span>
          </div>

          <Link
            href={trackingUrl}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#DAD6CD] bg-white px-4 py-3 text-xs font-semibold text-[#6657E8] transition-colors hover:border-[#6657E8]"
          >
            <span>Buka Halaman Lacak Pesanan</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="lg:col-span-7">
          <PaymentProofUploader invoice={invoice} expectedAmount={total} />
        </div>
      </div>
    </div>
  );
}
