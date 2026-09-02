import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import type { HeroProduct } from '@/lib/queries/hero-products';

export interface HeroProductLayerProps {
  product: HeroProduct;
  /** Size, placement, resting tilt, and centering for this layer's slot. */
  className: string;
  zIndex: number;
  /** Parallax weight, read by the collage animator. */
  depth: number;
  /** Entrance order, read by the collage animator. */
  order: number;
  /** Only the dominant layer preloads: the rest are decorative depth. */
  priority?: boolean;
  sizes: string;
}

/**
 * One product preview in the hero collage. A link, not decoration, so the
 * collage doubles as navigation into the catalogue.
 *
 * Resting rotation and centering arrive through `className` as the standalone
 * `rotate` and `translate` CSS properties, never as transform utilities. GSAP
 * owns `transform` during the entrance and parallax, so packing both into one
 * property would make the animator wipe the tilt and the centering offset.
 */
export function HeroProductLayer({
  product,
  className,
  zIndex,
  depth,
  order,
  priority = false,
  sizes,
}: HeroProductLayerProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      data-hero-collage-layer={order}
      data-hero-collage-depth={depth}
      style={{ zIndex }}
      className={cn(
        'group/layer absolute block overflow-hidden rounded-xl border border-[#E5E2D9] bg-white shadow-xl sm:rounded-2xl',
        'transition-shadow duration-300 hover:shadow-2xl',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2',
        className,
      )}
      aria-label={`${product.name}, ${product.categoryName}`}
    >
      <Image
        src={product.imageUrl}
        alt={product.imageAlt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover object-top transition-transform duration-500 ease-out group-hover/layer:scale-[1.04]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-[#111111]/5 sm:rounded-2xl"
      />
    </Link>
  );
}
