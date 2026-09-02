'use client';

import React from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ProductGalleryItem {
  id: string;
  /** Mirrors `ProductMedia.type`: IMAGE or VIDEO. */
  type: string;
  url: string;
  altText?: string | null;
}

export interface ProductGalleryProps {
  items: ProductGalleryItem[];
  productName: string;
  categoryName: string;
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** First letters of the product name, used by the composed empty state. */
function monogram(name: string): string {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word.charAt(0).toUpperCase()).join('') || 'DA';
}

/**
 * Large primary preview plus a thumbnail strip. Images and videos share one
 * index so the purchase panel can jump straight to a demo clip.
 */
export function ProductGallery({
  items,
  productName,
  categoryName,
  activeIndex,
  onSelect,
}: ProductGalleryProps) {
  const active = items[activeIndex] ?? items[0];

  if (!active) {
    return (
      <div className="relative flex aspect-16/10 flex-col justify-between overflow-hidden rounded-3xl border border-[#DAD6CD] bg-[#111111] p-8">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F4F1EA]/60">
          {categoryName}
        </span>
        <span className="font-display text-6xl leading-none text-[#F4F1EA] md:text-7xl">
          {monogram(productName)}
        </span>
        <span className="text-xs text-[#F4F1EA]/50">
          Pratinjau visual belum diunggah untuk produk ini.
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-4 rounded-2xl border border-[#F4F1EA]/12"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <figure className="group relative aspect-16/10 overflow-hidden rounded-3xl border border-[#DAD6CD] bg-[#111111]">
        {active.type === 'VIDEO' ? (
          <video
            key={active.id}
            src={active.url}
            controls
            playsInline
            preload="metadata"
            aria-label={active.altText || `Pratinjau video ${productName}`}
            className="motion-media-swap h-full w-full object-cover"
          />
        ) : (
          <Image
            key={active.id}
            src={active.url}
            alt={active.altText || productName}
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="motion-media-swap object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-[#111111]/10"
        />
      </figure>

      {items.length > 1 && (
        <div
          role="tablist"
          aria-label={`Galeri pratinjau ${productName}`}
          className="grid grid-cols-4 gap-3 sm:grid-cols-5"
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={item.altText || `Pratinjau ${index + 1}`}
                onClick={() => onSelect(index)}
                className={cn(
                  'relative aspect-4/3 overflow-hidden rounded-xl border bg-[#111111]',
                  // Standalone `scale`, so it composes with the image transform
                  // inside rather than replacing it.
                  'transition-[opacity,border-color,scale] duration-200 ease-out active:scale-[0.96]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F6F0]',
                  'motion-reduce:transition-none',
                  isActive
                    ? 'border-[#111111] opacity-100'
                    : 'border-[#DAD6CD] opacity-70 hover:border-[#CFCABE] hover:opacity-100',
                )}
              >
                {item.type === 'VIDEO' ? (
                  <span className="flex h-full w-full items-center justify-center text-[#F4F1EA]">
                    <Play className="h-4 w-4" />
                  </span>
                ) : (
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    sizes="140px"
                    className="object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
