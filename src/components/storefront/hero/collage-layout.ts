import type { HeroProduct } from '@/lib/queries/hero-products';

/**
 * Placement of one product layer inside the circular hero frame. Kept as data
 * so the composition is unit-testable and the client component stays dumb.
 */
export interface CollageSlot {
  /** Stable role for the animator, independent of which product lands here. */
  role: 'dominant' | 'support' | 'accent';
  /**
   * Size, placement, and resting tilt. Responsive rather than viewport-branched
   * in JS, so the server and client render identical markup.
   *
   * Rotation and centering use the standalone `rotate` and `translate` CSS
   * properties. GSAP owns `transform` during the entrance and parallax, and the
   * browser applies `translate` and `rotate` before `transform`, so the two
   * compose instead of one wiping the other.
   */
  className: string;
  /** Paint order. The dominant layer sits above its supports. */
  zIndex: number;
  /** Parallax weight. 0 is pinned, 1 moves the most. */
  depth: number;
  /** `sizes` hint for the layer's responsive image. */
  sizes: string;
}

/**
 * Center-dominant composition: the largest preview anchors the circle, a
 * source-code or template preview peeks from the upper right, and a small
 * square asset tucks into the lower left for depth.
 *
 * Slot shapes follow the seeded cover art rather than the other way round, so
 * `object-cover` trims edges instead of gutting the subject.
 *
 * Mobile keeps the same three roles but shrinks them, pulls them inward, and
 * halves the rotation, so nothing clips the circular mask or overflows.
 */
const SLOTS: CollageSlot[] = [
  {
    role: 'dominant',
    className: [
      'left-1/2 top-1/2 [translate:-50%_-50%]',
      'w-[80%] max-w-[240px] sm:w-[74%] sm:max-w-[300px]',
      'aspect-16/10 [rotate:-2deg] sm:[rotate:-3deg]',
    ].join(' '),
    zIndex: 20,
    depth: 0.35,
    sizes: '(max-width: 639px) 60vw, 300px',
  },
  {
    role: 'accent',
    className: [
      'right-[4%] top-[11%] sm:right-[2%] sm:top-[8%]',
      'w-[38%] max-w-[120px] sm:w-[46%] sm:max-w-[186px]',
      'aspect-16/10 [rotate:3deg] sm:[rotate:5deg]',
    ].join(' '),
    zIndex: 10,
    depth: 0.7,
    sizes: '(max-width: 639px) 34vw, 186px',
  },
  {
    role: 'support',
    className: [
      'left-[6%] bottom-[11%] sm:left-[3%] sm:bottom-[7%]',
      'w-[26%] max-w-[82px] sm:w-[31%] sm:max-w-[124px]',
      'aspect-square [rotate:-3deg] sm:[rotate:-6deg]',
    ].join(' '),
    zIndex: 30,
    depth: 1,
    sizes: '(max-width: 639px) 24vw, 124px',
  },
];

export interface CollageLayer extends CollageSlot {
  product: HeroProduct;
  /** Entrance order. The dominant layer always enters first. */
  order: number;
}

/**
 * Pairs products with slots. Fewer than three products keeps the composition
 * balanced by dropping the outer layers rather than leaving gaps: one product
 * renders centred alone, and two render as the centred dominant plus the
 * upper-right accent, which reads as deliberate instead of lopsided.
 */
export function composeCollage(products: HeroProduct[]): CollageLayer[] {
  return products.slice(0, SLOTS.length).map((product, index) => ({
    ...SLOTS[index],
    product,
    order: index,
  }));
}

/** Total slots the composition is designed around. */
export const COLLAGE_SLOT_COUNT = SLOTS.length;
