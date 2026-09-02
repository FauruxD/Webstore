'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import {
  INTRO_ASSET_TIMEOUT_MS,
  INTRO_EXIT_EVENT,
  introRequestedOnLoad,
} from './intro-config';

/**
 * Holds the homepage hero back while the intro overlay is up, then lifts it in
 * a staggered rise the moment the center split starts. Renders nothing.
 *
 * Must be mounted BEFORE IntroPreloader in the tree so its layout effect claims
 * the resting state before the overlay can clear the `data-intro` curtain.
 */
export function HeroIntroEntrance() {
  const playedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    // No intro on this load means the hero is already in its normal state.
    if (!introRequestedOnLoad()) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = gsap.utils.toArray<HTMLElement>('[data-hero-enter]');
    if (targets.length === 0) return;

    gsap.set(targets, { opacity: 0, y: 24 });

    const play = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.92,
        ease: 'power3.out',
        stagger: 0.085,
        clearProps: 'opacity,transform,willChange',
      });
    };

    window.addEventListener(INTRO_EXIT_EVENT, play);
    const failsafe = window.setTimeout(play, INTRO_ASSET_TIMEOUT_MS + 2000);

    return () => {
      window.removeEventListener(INTRO_EXIT_EVENT, play);
      window.clearTimeout(failsafe);
      gsap.killTweensOf(targets);
      gsap.set(targets, { clearProps: 'opacity,transform,willChange' });
    };
  }, []);

  return null;
}
