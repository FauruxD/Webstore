import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REVEAL_VARIANT,
  MOBILE_REVEAL_SCALE,
  REVEAL_FAILSAFE_MS,
  REVEAL_GATE_SCRIPT,
  REVEAL_VARIANTS,
  resolveRevealVariant,
  scaleRevealVariant,
} from '@/components/storefront/scroll/reveal-config';

describe('resolveRevealVariant', () => {
  it('returns the named variant', () => {
    expect(resolveRevealVariant('heading')).toBe(REVEAL_VARIANTS.heading);
    expect(resolveRevealVariant('image')).toBe(REVEAL_VARIANTS.image);
  });

  it('falls back rather than throwing on junk, so markup typos cost only motion', () => {
    for (const value of [null, undefined, '', 'nope', 'HEADING', 'constructor', '__proto__']) {
      expect(resolveRevealVariant(value)).toBe(REVEAL_VARIANTS[DEFAULT_REVEAL_VARIANT]);
    }
  });

  it('keeps every variant to transform and opacity friendly values only', () => {
    for (const variant of Object.values(REVEAL_VARIANTS)) {
      // Travel stays small enough that a reveal can never look like a slide-in.
      expect(variant.y).toBeGreaterThanOrEqual(0);
      expect(variant.y).toBeLessThanOrEqual(30);
      // No shrinking, and no bounce past the resting size.
      expect(variant.scale).toBeGreaterThanOrEqual(1);
      expect(variant.scale).toBeLessThanOrEqual(1.1);
      expect(variant.duration).toBeGreaterThan(0);
      expect(variant.duration).toBeLessThanOrEqual(1);
      // Every ease settles rather than overshooting.
      expect(variant.ease).toMatch(/\.out$/);
    }
  });
});

describe('scaleRevealVariant', () => {
  it('leaves desktop untouched', () => {
    expect(scaleRevealVariant(REVEAL_VARIANTS.heading, false)).toBe(REVEAL_VARIANTS.heading);
  });

  it('shortens travel on mobile without touching timing', () => {
    const scaled = scaleRevealVariant(REVEAL_VARIANTS.heading, true);
    expect(scaled.y).toBe(Math.round(REVEAL_VARIANTS.heading.y * MOBILE_REVEAL_SCALE));
    expect(scaled.y).toBeLessThan(REVEAL_VARIANTS.heading.y);
    expect(scaled.duration).toBe(REVEAL_VARIANTS.heading.duration);
    expect(scaled.ease).toBe(REVEAL_VARIANTS.heading.ease);
  });

  it('softens overscale toward 1 rather than below it', () => {
    const scaled = scaleRevealVariant(REVEAL_VARIANTS.image, true);
    expect(scaled.scale).toBeGreaterThanOrEqual(1);
    expect(scaled.scale).toBeLessThan(REVEAL_VARIANTS.image.scale);
  });

  it('is a no-op on a variant that does not move', () => {
    const still = { y: 0, scale: 1, clip: false, duration: 0.5, ease: 'power2.out' };
    expect(scaleRevealVariant(still, true)).toEqual(still);
  });
});

describe('REVEAL_GATE_SCRIPT', () => {
  it('bails out under reduced motion before hiding anything', () => {
    const guardIndex = REVEAL_GATE_SCRIPT.indexOf('prefers-reduced-motion');
    const armIndex = REVEAL_GATE_SCRIPT.indexOf('setAttribute');
    expect(guardIndex).toBeGreaterThan(-1);
    expect(armIndex).toBeGreaterThan(guardIndex);
  });

  it('always unarms itself, so content can never stay invisible', () => {
    expect(REVEAL_GATE_SCRIPT).toContain('removeAttribute');
    expect(REVEAL_GATE_SCRIPT).toContain(String(REVEAL_FAILSAFE_MS));
  });

  it('swallows its own errors so it can never block the parser', () => {
    expect(REVEAL_GATE_SCRIPT).toContain('try{');
    expect(REVEAL_GATE_SCRIPT).toContain('catch(e){}');
  });

  it('is valid JavaScript', () => {
    expect(() => new Function(REVEAL_GATE_SCRIPT)).not.toThrow();
  });
});
