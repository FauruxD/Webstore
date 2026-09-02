'use client';

import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { Layers, Code, Shield } from 'lucide-react';
import { useIsomorphicLayoutEffect } from '@/components/storefront/preloader/useIsomorphicLayoutEffect';
import {
  INTRO_EXIT_EVENT,
  INTRO_ASSET_TIMEOUT_MS,
  introRequestedOnLoad,
} from '@/components/storefront/preloader/intro-config';
import { HeroFloatingCard } from './HeroFloatingCard';
import { HeroProductCollage, HERO_COLLAGE_SETTLED_EVENT } from './HeroProductCollage';
import type { HeroContentView } from '@/lib/queries/hero';
import type { HeroProduct } from '@/lib/queries/hero-products';

/** One orbit plus a per-card lead-in, so the three never travel in lockstep. */
const ORBIT_TURN = Math.PI * 2;
const CARD_LEAD_IN = [0, 0.6, 1.2];
const ORBIT_DURATION = 1.75;
const CARD_STAGGER = 0.12;

/** Below this width the orbit is replaced by a lift, so nothing can clip. */
const MOBILE_QUERY = '(max-width: 639px)';

/**
 * How long the cards wait on the collage before orbiting anyway. Covers a
 * collage with no layers to animate, or one whose images never resolve.
 */
const COLLAGE_WAIT_MS = 1400;

export interface AnimatedHeroVisualProps {
  hero: HeroContentView;
  /** Up to three published products, already ordered for the collage. */
  products: HeroProduct[];
}

export function AnimatedHeroVisual({ hero, products }: AnimatedHeroVisualProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cards = gsap.utils.toArray<HTMLElement>('[data-hero-orbit-card]', root);
    if (cards.length === 0) return;

    // Reduced motion keeps the settled layout exactly as the server rendered it.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const simplified = window.matchMedia(MOBILE_QUERY).matches;
    const center = root.querySelector<HTMLElement>('[data-hero-orbit-center]');
    if (!center) return;

    // Resting state claimed before first paint so the cards never flash in place.
    gsap.set(cards, { opacity: 0 });

    let tween: gsap.core.Timeline | gsap.core.Tween | null = null;

    const play = () => {
      if (playedRef.current) return;
      playedRef.current = true;

      if (simplified) {
        // Mobile: transform-only lift, no travel, so nothing leaves the box.
        tween = gsap.to(cards, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: 'power2.out',
          stagger: CARD_STAGGER,
          startAt: { y: 14, scale: 0.94 },
          clearProps: 'opacity,transform,willChange',
        });
        return;
      }

      const centerBox = center.getBoundingClientRect();
      const centerX = centerBox.left + centerBox.width / 2;
      const centerY = centerBox.top + centerBox.height / 2;

      const timeline = gsap.timeline();
      tween = timeline;

      cards.forEach((card, index) => {
        const box = card.getBoundingClientRect();
        const restX = box.left + box.width / 2 - centerX;
        const restY = box.top + box.height / 2 - centerY;
        const radius = Math.hypot(restX, restY);
        const restAngle = Math.atan2(restY, restX);
        const startAngle = restAngle - (ORBIT_TURN + CARD_LEAD_IN[index % CARD_LEAD_IN.length]);

        // Tweening the angle, then converting to an offset from the settled
        // spot, keeps this a pure transform: the layout position never moves.
        const state = { angle: startAngle, scale: 0.82 };

        const applyState = () => {
          gsap.set(card, {
            x: Math.cos(state.angle) * radius - restX,
            y: Math.sin(state.angle) * radius - restY,
            scale: state.scale,
            force3D: true,
          });
        };

        applyState();

        timeline.to(
          state,
          {
            angle: restAngle,
            scale: 1,
            duration: ORBIT_DURATION,
            ease: 'power2.inOut',
            onUpdate: applyState,
            onComplete: () => {
              gsap.set(card, { clearProps: 'transform,willChange' });
            },
          },
          index * CARD_STAGGER,
        );

        timeline.to(
          card,
          {
            opacity: 1,
            duration: 0.45,
            ease: 'power1.out',
            clearProps: 'opacity',
          },
          index * CARD_STAGGER,
        );
      });
    };

    // The cards always follow the collage: it settles, then they orbit over it.
    // With the intro overlay up the collage itself waits for the split, so the
    // failsafe has to cover that wait too.
    const failsafeDelay = introRequestedOnLoad()
      ? INTRO_ASSET_TIMEOUT_MS + 2000 + COLLAGE_WAIT_MS
      : COLLAGE_WAIT_MS;

    window.addEventListener(HERO_COLLAGE_SETTLED_EVENT, play, { once: true });
    const failsafe = window.setTimeout(play, failsafeDelay);

    return () => {
      window.removeEventListener(HERO_COLLAGE_SETTLED_EVENT, play);
      window.clearTimeout(failsafe);
      gsap.killTweensOf(cards);
      tween?.kill();
      gsap.set(cards, { clearProps: 'opacity,transform,willChange' });
      // StrictMode remounts this effect. Without the reset the second pass
      // would re-hide the cards and then bail on the guard.
      playedRef.current = false;
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-hero-enter
      className="relative flex aspect-square w-full max-w-[500px] items-center justify-center"
    >
      {/* Circular organic mask holding the product collage */}
      <div
        data-hero-orbit-center
        className="relative h-[340px] w-[340px] overflow-hidden rounded-full border-4 border-white bg-[#F4F1EA] shadow-2xl sm:h-[400px] sm:w-[400px]"
      >
        <HeroProductCollage products={products} />
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-[#111111]/10" />
      </div>

      <HeroFloatingCard
        orbitIndex={0}
        label={hero.collectionLabel}
        value={hero.collectionValue}
        icon={Layers}
        iconClassName="bg-[#6657E8]/10 text-[#6657E8]"
        positionClassName="-top-2 right-0 sm:right-2"
      />

      <HeroFloatingCard
        orbitIndex={1}
        label={hero.formatLabel}
        value={hero.formatValue}
        icon={Code}
        iconClassName="bg-[#187A4A]/10 text-[#187A4A]"
        positionClassName="bottom-4 left-0 sm:left-2"
      />

      <HeroFloatingCard
        orbitIndex={2}
        label={hero.licenseLabel}
        value={hero.licenseValue}
        icon={Shield}
        iconClassName="bg-[#9A6000]/10 text-[#9A6000]"
        positionClassName="-bottom-4 right-4 sm:right-8"
      />
    </div>
  );
}
