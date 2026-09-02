'use client';

import React from 'react';
import { ArrowRight, Loader2, PlayCircle, ShieldCheck } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/invoice';
import { cn } from '@/lib/utils/cn';

export interface ProductSpecRow {
  label: string;
  value: string;
  tone?: 'default' | 'success';
}

export interface ProductPurchasePanelProps {
  categoryName: string;
  name: string;
  summary: string;
  price: number;
  salePrice?: number | null;
  license: string;
  specs: ProductSpecRow[];
  /** Only rendered when the gallery actually holds a video. */
  onPreview?: () => void;
  buyPhase: 'idle' | 'loading' | 'open';
  onBuy: () => void;
}

/**
 * Sticky buying column of the product hero. Every figure here comes from the
 * product row itself, so nothing is padded out with placeholder ratings or
 * invented social proof.
 */
export function ProductPurchasePanel({
  categoryName,
  name,
  summary,
  price,
  salePrice,
  license,
  specs,
  onPreview,
  buyPhase,
  onBuy,
}: ProductPurchasePanelProps) {
  const hasDiscount = salePrice != null && salePrice < price;
  const activePrice = salePrice ?? price;
  const discountPercent = hasDiscount ? Math.round(((price - salePrice) / price) * 100) : 0;
  const isBusy = buyPhase !== 'idle';

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#E8E4FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6657E8]">
            {categoryName}
          </span>
          <span className="rounded-full border border-[#DAD6CD] px-3 py-1 text-[11px] font-medium text-[#686660]">
            {license}
          </span>
        </div>

        <h1 className="font-display text-4xl leading-[1.1] text-[#111111] md:text-5xl">
          {name}
        </h1>

        {summary && (
          <p className="max-w-[46ch] text-sm leading-relaxed text-[#686660]">{summary}</p>
        )}
      </header>

      <div className="border-y border-[#DAD6CD] py-6">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#686660]">
          Harga lisensi
        </span>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <span className="font-display text-4xl tabular-nums text-[#111111]">
            {formatRupiah(activePrice)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-sm tabular-nums text-[#686660] line-through">
                {formatRupiah(price)}
              </span>
              <span className="rounded-full bg-[#187A4A]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#187A4A]">
                Hemat {discountPercent}%
              </span>
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-[#686660]">
          Pembayaran sekali bayar. Tidak ada biaya langganan lanjutan.
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onBuy}
          disabled={isBusy}
          aria-busy={buyPhase === 'loading'}
          className={cn(
            'group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#111111] px-6 py-4',
            'text-sm font-semibold tracking-[0.01em] text-[#F4F1EA] shadow-[0_10px_28px_-14px_rgba(17,17,17,0.75)]',
            'transition-[background-color,transform,box-shadow] duration-200',
            'hover:bg-[#6657E8] hover:shadow-[0_14px_32px_-14px_rgba(102,87,232,0.8)]',
            'active:translate-y-px active:bg-[#5244d2] active:shadow-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F6F0]',
            'disabled:cursor-not-allowed disabled:bg-[#686660] disabled:shadow-none disabled:hover:bg-[#686660]',
          )}
        >
          {buyPhase === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
              <span>Menyiapkan checkout</span>
            </>
          ) : (
            <>
              <span>Beli Sekarang</span>
              <ArrowRight
                className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                aria-hidden="true"
              />
            </>
          )}
        </button>

        {onPreview && (
          <button
            type="button"
            onClick={onPreview}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-2xl border border-[#DAD6CD] bg-white px-6 py-3.5',
              'text-xs font-semibold text-[#111111] transition-colors duration-200',
              'hover:border-[#111111] active:translate-y-px',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F6F0]',
            )}
          >
            <PlayCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Lihat Pratinjau Demo</span>
          </button>
        )}

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#686660]">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#187A4A]" aria-hidden="true" />
          <span>Checkout QRIS aman dengan verifikasi manual admin</span>
        </p>
      </div>

      <dl className="divide-y divide-[#DAD6CD] border-t border-[#DAD6CD] text-xs">
        {specs.map((spec) => (
          <div key={spec.label} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-[#686660]">{spec.label}</dt>
            <dd
              className={cn(
                'text-right font-semibold',
                spec.tone === 'success' ? 'text-[#187A4A]' : 'text-[#111111]',
              )}
            >
              {spec.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
