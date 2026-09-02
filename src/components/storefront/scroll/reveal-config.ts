/**
 * Shared contract between the blocking reveal gate script and the client-side
 * reveal provider.
 *
 * Scroll reveals need their hidden state to exist before the first paint, or the
 * content shows at full opacity and then jumps away when JavaScript arms it. The
 * gate script sets `html[data-reveal-armed]` ahead of the body, CSS hides the
 * marked elements while that attribute is present, and the provider takes over
 * with inline styles the moment it mounts.
 */

/** Marks an element to reveal on scroll. Value picks the motion variant. */
export const REVEAL_ATTR = 'data-reveal';

/** Marks a container whose `[data-reveal-item]` children reveal in sequence. */
export const REVEAL_STAGGER_ATTR = 'data-reveal-stagger';
export const REVEAL_ITEM_ATTR = 'data-reveal-item';

/** Marks an element that drifts slightly against the scroll. */
export const REVEAL_PARALLAX_ATTR = 'data-reveal-parallax';

/**
 * Failsafe window. If the provider never mounts, because of a chunk error or
 * disabled JavaScript, the gate unarms itself so the page can never be left
 * with permanently invisible content.
 */
export const REVEAL_FAILSAFE_MS = 2500;

/** Where in the viewport a reveal fires. Early enough to never feel late. */
export const REVEAL_START = 'top 88%';

/** Gap between staggered siblings. Short on purpose: a queue, not a parade. */
export const REVEAL_STAGGER_STEP = 0.08;

/** Total travel of a parallax element across its own scroll range, in px. */
export const DEFAULT_PARALLAX_STRENGTH = 40;

/** Mobile shortens every distance rather than running a separate system. */
export const MOBILE_REVEAL_SCALE = 0.55;

export interface RevealVariant {
  /** Upward travel in px. */
  y: number;
  /** Starting scale. 1 means no scaling. */
  scale: number;
  /** Reveals from the bottom edge with a clip mask instead of moving. */
  clip: boolean;
  duration: number;
  ease: string;
}

/**
 * The whole reveal vocabulary. Four entries, deliberately: the brief asks for
 * restraint, and a long list is how a page ends up animating everything.
 */
export const REVEAL_VARIANTS = {
  /** Section headings. The most travel of the set, still under 30px. */
  heading: { y: 26, scale: 1, clip: false, duration: 0.75, ease: 'power3.out' },
  /** Eyebrows, supporting copy, links. Quick, so a paragraph never lags. */
  text: { y: 14, scale: 1, clip: false, duration: 0.55, ease: 'power2.out' },
  /** Cards, panels, list rows. */
  panel: { y: 20, scale: 1, clip: false, duration: 0.7, ease: 'power3.out' },
  /** Imagery. Unmasks upward while a slight overscale settles. */
  image: { y: 0, scale: 1.04, clip: true, duration: 0.9, ease: 'power3.out' },
} as const satisfies Record<string, RevealVariant>;

export type RevealVariantName = keyof typeof REVEAL_VARIANTS;

export const DEFAULT_REVEAL_VARIANT: RevealVariantName = 'panel';

/**
 * Reads a variant name off an attribute. An empty, missing, or unknown value
 * falls back rather than throwing, so a typo in markup costs a nicer animation
 * and never the content itself.
 */
export function resolveRevealVariant(value: string | null | undefined): RevealVariant {
  // hasOwn, not `in`: `in` walks the prototype chain, so a stray
  // `data-reveal="constructor"` would otherwise hand GSAP a function.
  if (value && Object.hasOwn(REVEAL_VARIANTS, value)) {
    return REVEAL_VARIANTS[value as RevealVariantName];
  }
  return REVEAL_VARIANTS[DEFAULT_REVEAL_VARIANT];
}

/** Shortens travel for small screens. Duration and easing stay as authored. */
export function scaleRevealVariant(variant: RevealVariant, mobile: boolean): RevealVariant {
  if (!mobile) return variant;
  return {
    ...variant,
    y: Math.round(variant.y * MOBILE_REVEAL_SCALE),
    scale: 1 + (variant.scale - 1) * MOBILE_REVEAL_SCALE,
  };
}

declare global {
  interface Window {
    /**
     * Claimed by the provider as soon as it mounts, which tells the failsafe
     * that a real animator is in charge.
     */
    __ATELIER_REVEAL__?: boolean;
  }
}

/**
 * Runs before the storefront body paints. Deliberately tiny, and wrapped so a
 * throw can never block rendering.
 *
 * Skipped entirely under reduced motion: those visitors get the plain document,
 * never a hidden one.
 */
export const REVEAL_GATE_SCRIPT = `(function(){try{
if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var r=document.documentElement;
r.setAttribute('data-reveal-armed','');
setTimeout(function(){if(!window.__ATELIER_REVEAL__)r.removeAttribute('data-reveal-armed');},${REVEAL_FAILSAFE_MS});
}catch(e){}})();`;
