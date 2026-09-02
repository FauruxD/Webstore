'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowRight, Eye } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/invoice';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils/cn';

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  categoryName?: string;
  price: number;
  salePrice?: number | null;
  license: string;
  imageUrl?: string;
  /**
   * Joins the parent `[data-reveal-stagger]` sequence. Off by default so a card
   * dropped outside a tagged grid is never left hidden by the reveal CSS.
   */
  revealItem?: boolean;
}

export function ProductCard({
  id,
  name,
  slug,
  categoryName = 'Digital Asset',
  price,
  salePrice,
  license,
  imageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  revealItem = false,
}: ProductCardProps) {
  const { addItem } = useCart();
  const hasDiscount = salePrice && salePrice < price;
  const activePrice = salePrice ?? price;
  const discountPercent = hasDiscount ? Math.round(((price - salePrice!) / price) * 100) : 0;

  return (
    <div
      {...(revealItem ? { 'data-reveal-item': '' } : {})}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-[#DAD6CD] bg-[#FFFFFF]',
        // Lift and shadow only. Standalone `translate` rather than a transform
        // utility, so a reveal tween writing `transform` cannot cancel it.
        'transition-[translate,box-shadow,border-color] duration-300 ease-out',
        'hover:[translate:0_-3px] hover:border-[#CFCABE] hover:shadow-[0_18px_40px_-24px_rgba(17,17,17,0.35)]',
        // Keyboard users get the same affordance when a child link is focused.
        'focus-within:[translate:0_-3px] focus-within:shadow-[0_18px_40px_-24px_rgba(17,17,17,0.35)]',
        'motion-reduce:transition-none motion-reduce:hover:[translate:0_0]',
      )}
    >
      {/* Media Cover */}
      <Link
        href={`/products/${slug}`}
        className="relative block aspect-16/10 overflow-hidden bg-[#111111]/5 outline-none"
      >
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />

        {/*
          Quick view. Pointer devices only, and never interactive: the footer
          buttons stay the real controls, so a touch visitor loses nothing.
        */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 hidden items-end justify-start bg-gradient-to-t from-[#111111]/55 to-transparent p-4',
            'opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100',
            '[@media(hover:hover)_and_(pointer:fine)]:flex',
          )}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#111111] shadow-sm">
            <Eye className="h-3.5 w-3.5" />
            Lihat Detail
          </span>
        </span>

        {hasDiscount && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-[#6657E8] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
            Hemat {discountPercent}%
          </span>
        )}
        <span className="absolute bottom-3 right-3 z-10 rounded-full bg-[#111111]/80 px-2.5 py-1 text-[10px] font-medium text-[#F4F1EA] backdrop-blur-xs">
          {license}
        </span>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686660]">
            {categoryName}
          </span>
          <Link href={`/products/${slug}`} className="mt-1 block">
            <h3 className="text-lg font-semibold leading-snug text-[#111111] line-clamp-2 transition-colors group-hover:text-[#6657E8]">
              {name}
            </h3>
          </Link>
        </div>

        {/* Pricing & CTA Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[#DAD6CD]/50 pt-3">
          <div>
            <div className="text-xs text-[#686660]">Harga</div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tabular-nums text-[#111111]">
                {formatRupiah(activePrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs tabular-nums text-[#686660] line-through">
                  {formatRupiah(price)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                addItem({
                  productId: id,
                  name,
                  slug,
                  price,
                  salePrice,
                  license,
                  imageUrl,
                })
              }
              className={cn(
                'rounded-xl bg-[#F4F1EA] p-2.5 text-[#111111]',
                'transition-[background-color,color,scale] duration-200',
                'hover:bg-[#E8E4FF] hover:text-[#6657E8] active:scale-[0.94]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]',
              )}
              title="Tambah ke Keranjang"
              aria-label="Tambah ke Keranjang"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>

            <Link
              href={`/products/${slug}`}
              className={cn(
                'group/cta flex items-center justify-center rounded-xl bg-[#111111] p-2.5 text-[#F4F1EA]',
                'transition-[background-color,scale] duration-200 hover:bg-[#6657E8] active:scale-[0.94]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]',
              )}
              title="Detail Produk"
              aria-label={`Detail produk ${name}`}
            >
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
