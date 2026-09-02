'use client';

import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { useIsomorphicLayoutEffect } from '@/components/storefront/preloader/useIsomorphicLayoutEffect';
import {
  INTRO_ASSET_TIMEOUT_MS,
  INTRO_EXIT_EVENT,
  introRequestedOnLoad,
} from '@/components/storefront/preloader/intro-config';
import { HeroProductLayer } from './HeroProductLayer';
import { composeCollage } from './collage-layout';
import type { HeroProduct } from '@/lib/queries/hero-products';

/** Restrained editorial entrance: opacity, a short lift, a hint of rotation. */
const ENTRANCE_DURATION = 0.8;
const ENTRANCE_STAGGER = 0.1;
const ENTRANCE_Y = 18;
const ENTRANCE_SCALE = 0.94;
const ENTRANCE_ROTATION = 2.5;

/** Below this width parallax and pointer depth are skipped entirely. */
const MOBILE_QUERY = '(max-width: 639px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

/** Travel in px at depth 1. Scaled down per layer by its depth weight. */
const PARALLAX_TRAVEL = 24;
const POINTER_TRAVEL = 4;

/**
 * Announced once the collage has settled, so the floating cards orbit over a
 * finished composition instead of racing it.
 */
export const HERO_COLLAGE_SETTLED_EVENT = 'atelier:hero-collage-settled';

/**
 * Layered product collage inside the circular hero frame. The products arrive
 * as props from the Server Component, so this stays a pure animator.
 *
 * The dominant layer enters first and the supports follow on a short stagger.
 * Once settled, desktop layers drift against the scroll at depth-weighted
 * speeds and take a few pixels of pointer nudge. Reduced motion keeps the
 * server-rendered layout untouched, and mobile keeps the entrance but skips
 * both parallax effects.
 */
export function HeroProductCollage({ products }: { products: HeroProduct[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const layers = gsap.utils.toArray<HTMLElement>('[data-hero-collage-layer]', root);
    if (layers.length === 0) return;

    // Reduced motion keeps the settled layout exactly as the server rendered
    // it, and still releases the cards so the orbit code does not wait.
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
      window.dispatchEvent(new Event(HERO_COLLAGE_SETTLED_EVENT));
      return;
    }

    // Claimed before first paint so the layers never flash at full opacity.
    gsap.set(layers, { opacity: 0 });

    const cleanups: Array<() => void> = [];
    let timeline: gsap.core.Timeline | null = null;

    /**
     * Scroll drift plus pointer nudge, started only after the entrance has
     * cleared its own transforms so the two never write the same property at
     * the same time.
     */
    const startParallax = () => {
      if (window.matchMedia(MOBILE_QUERY).matches) return;

      const depths = layers.map((layer) => {
        const parsed = Number(layer.getAttribute('data-hero-collage-depth'));
        return Number.isFinite(parsed) ? parsed : 0;
      });

      let pointerX = 0;
      let pointerY = 0;
      let frame = 0;

      const render = () => {
        frame = 0;
        const rect = root.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        // -1 above the fold centre, +1 below it.
        const progress = (rect.top + rect.height / 2 - viewportCenter) / viewportCenter;
        layers.forEach((layer, index) => {
          const depth = depths[index];
          gsap.to(layer, {
            x: pointerX * POINTER_TRAVEL * depth,
            y: progress * PARALLAX_TRAVEL * depth + pointerY * POINTER_TRAVEL * depth,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        });
      };

      // Both inputs share one rAF so a scroll and a pointer move in the same
      // frame produce one write instead of two competing tweens.
      const schedule = () => {
        if (frame) return;
        frame = window.requestAnimationFrame(render);
      };

      const onScroll = () => schedule();
      const onPointerMove = (event: PointerEvent) => {
        pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
        pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
        schedule();
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });

      const finePointer = window.matchMedia(FINE_POINTER_QUERY);
      if (finePointer.matches) {
        window.addEventListener('pointermove', onPointerMove, { passive: true });
      }

      schedule();

      cleanups.push(() => {
        if (frame) window.cancelAnimationFrame(frame);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        window.removeEventListener('pointermove', onPointerMove);
        gsap.killTweensOf(layers);
        gsap.set(layers, { clearProps: 'transform,willChange' });
      });
    };

    const play = () => {
      if (playedRef.current) return;
      playedRef.current = true;

      timeline = gsap.timeline({
        defaults: { ease: 'power2.out', duration: ENTRANCE_DURATION },
        onComplete: () => {
          // The cards orbit over a finished composition, not a moving one.
          window.dispatchEvent(new Event(HERO_COLLAGE_SETTLED_EVENT));
          startParallax();
        },
      });

      // GSAP `rotation` and `y` land in `transform`, while the resting tilt and
      // centring live in the standalone `rotate` and `translate` properties, so
      // the entrance composes on top of the layout instead of replacing it.
      const [dominant, ...supports] = layers;

      timeline.to(dominant, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        startAt: { y: ENTRANCE_Y, scale: ENTRANCE_SCALE, rotation: -ENTRANCE_ROTATION },
        clearProps: 'opacity,transform,willChange',
      });

      if (supports.length > 0) {
        timeline.to(
          supports,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotation: 0,
            stagger: ENTRANCE_STAGGER,
            startAt: { y: ENTRANCE_Y, scale: ENTRANCE_SCALE, rotation: ENTRANCE_ROTATION },
            clearProps: 'opacity,transform,willChange',
          },
          // Overlaps the dominant layer's tail: the group reads as one move.
          '<0.15',
        );
      }
    };

    if (introRequestedOnLoad()) {
      // The intro overlay owns the screen until it splits; the collage is the
      // first thing revealed behind it.
      window.addEventListener(INTRO_EXIT_EVENT, play);
      const failsafe = window.setTimeout(play, INTRO_ASSET_TIMEOUT_MS + 2000);
      cleanups.push(() => {
        window.removeEventListener(INTRO_EXIT_EVENT, play);
        window.clearTimeout(failsafe);
      });
    } else {
      play();
    }

    return () => {
      cleanups.forEach((fn) => fn());
      timeline?.kill();
      gsap.killTweensOf(layers);
      gsap.set(layers, { clearProps: 'opacity,transform,willChange' });
      // StrictMode remounts this effect. Without the reset the second pass
      // would re-hide the layers and then bail on the guard.
      playedRef.current = false;
    };
  }, []);

  const layers = composeCollage(products);

  return (
    <div ref={rootRef} className="absolute inset-0">
      {layers.map((layer, index) => (
        <HeroProductLayer
          key={layer.product.id}
          product={layer.product}
          className={layer.className}
          zIndex={layer.zIndex}
          depth={layer.depth}
          order={layer.order}
          priority={index === 0}
          sizes={layer.sizes}
        />
      ))}
    </div>
  );
}
