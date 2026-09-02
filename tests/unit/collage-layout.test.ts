import { describe, expect, it } from 'vitest';
import {
  composeCollage,
  COLLAGE_SLOT_COUNT,
} from '@/components/storefront/hero/collage-layout';
import type { HeroProduct } from '@/lib/queries/hero-products';

function product(index: number): HeroProduct {
  return {
    id: `product-${index}`,
    name: `Product ${index}`,
    slug: `product-${index}`,
    categoryName: 'UI Templates & Kits',
    imageUrl: `/images/products/preview-${index}.svg`,
    imageAlt: `Product ${index} preview`,
  };
}

function products(count: number): HeroProduct[] {
  return Array.from({ length: count }, (_, index) => product(index));
}

describe('composeCollage', () => {
  it('returns nothing when the catalogue has no hero products', () => {
    expect(composeCollage([])).toEqual([]);
  });

  it('renders a single product as the centred dominant layer', () => {
    const layers = composeCollage(products(1));

    expect(layers).toHaveLength(1);
    expect(layers[0].role).toBe('dominant');
    // Centring rides on the standalone `translate` property so GSAP can own
    // `transform` during the entrance without wiping the offset.
    expect(layers[0].className).toContain('[translate:-50%_-50%]');
  });

  it('pairs two products as dominant plus the upper-right accent', () => {
    const layers = composeCollage(products(2));

    expect(layers.map((layer) => layer.role)).toEqual(['dominant', 'accent']);
  });

  it('fills all three slots in order, dominant first', () => {
    const layers = composeCollage(products(3));

    expect(layers).toHaveLength(COLLAGE_SLOT_COUNT);
    expect(layers.map((layer) => layer.role)).toEqual(['dominant', 'accent', 'support']);
    expect(layers.map((layer) => layer.order)).toEqual([0, 1, 2]);
    expect(layers.map((layer) => layer.product.id)).toEqual([
      'product-0',
      'product-1',
      'product-2',
    ]);
  });

  it('drops extras beyond the slot count instead of overflowing the frame', () => {
    expect(composeCollage(products(8))).toHaveLength(COLLAGE_SLOT_COUNT);
  });

  it('keeps the dominant layer under its supports so overlaps read correctly', () => {
    const layers = composeCollage(products(3));
    const [dominant, accent, support] = layers;

    expect(accent.zIndex).toBeLessThan(dominant.zIndex);
    expect(support.zIndex).toBeGreaterThan(dominant.zIndex);
  });

  it('assigns distinct parallax depths so the layers do not move as one plane', () => {
    const depths = composeCollage(products(3)).map((layer) => layer.depth);

    expect(new Set(depths).size).toBe(depths.length);
    depths.forEach((depth) => {
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThanOrEqual(1);
    });
  });

  it('never places rotation or centring in a transform utility', () => {
    // Tailwind's `rotate-*` and `-translate-*` compile to `transform`, which
    // GSAP overwrites mid-entrance. The slots must use the standalone
    // `rotate` and `translate` properties instead.
    for (const layer of composeCollage(products(3))) {
      expect(layer.className).not.toMatch(/(^|\s)-?(rotate|translate)-/);
      expect(layer.className).toMatch(/\[rotate:/);
    }
  });
});
