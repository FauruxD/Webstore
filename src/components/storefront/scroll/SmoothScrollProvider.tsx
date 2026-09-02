'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onScrollLockChange } from '@/lib/scroll/scroll-lock';

/**
 * Restrained settings. A long duration or a low lerp is what makes smooth
 * scrolling feel slippery and detached from the wheel, so this stays close to
 * native: the motion is eased, not delayed.
 */
const LERP = 0.12;
const WHEEL_MULTIPLIER = 1;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Never smooth these, whatever mounts them. */
const NEVER_SMOOTH_PREFIXES = ['/admin'];

/**
 * Storefront smooth scrolling.
 *
 * Mounted from the storefront layout only, and additionally guarded by path so
 * the admin dashboard can never inherit it. Touch scrolling is left native,
 * which keeps mobile responsive and avoids fighting the platform. Reduced
 * motion skips Lenis entirely rather than configuring it down.
 *
 * Also the single owner of the animation loop: `gsap.ticker` drives Lenis, and
 * Lenis reports scroll to ScrollTrigger, so the reveals and the scroll position
 * can never drift apart.
 */
export function SmoothScrollProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (NEVER_SMOOTH_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) return;

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);

    // Registered even under reduced motion: the reveals need ScrollTrigger, and
    // they degrade to plain opacity rather than switching off.
    gsap.registerPlugin(ScrollTrigger);

    let lenis: Lenis | null = null;
    let unsubscribeLock: (() => void) | null = null;
    let tick: ((time: number) => void) | null = null;

    const start = () => {
      if (lenis) return;

      lenis = new Lenis({
        lerp: LERP,
        wheelMultiplier: WHEEL_MULTIPLIER,
        smoothWheel: true,
        // Native touch. Synthesising touch inertia is what makes phones feel
        // laggy, and it interferes with pull-to-refresh.
        syncTouch: false,
        // Nested scrollers (dialog bodies, the cart drawer) keep their own
        // scrolling, and reaching their end does not leak into the page.
        allowNestedScroll: true,
        overscroll: false,
        // Hash links stay smooth without hijacking history: Lenis animates to
        // the target, the browser still owns the URL.
        anchors: { offset: -96 },
        // Cancels leftover inertia when a link navigates, so the next page does
        // not start mid-glide.
        stopInertiaOnNavigate: true,
        // The GSAP ticker below drives the loop instead.
        autoRaf: false,
      });

      // ScrollTrigger reads position from Lenis, never the other way round.
      lenis.on('scroll', ScrollTrigger.update);

      tick = (time: number) => {
        // gsap.ticker reports seconds; Lenis expects milliseconds.
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tick);
      // Without this, a slow frame makes GSAP rewind time and the scroll jitters.
      gsap.ticker.lagSmoothing(0);

      // Dialogs and drawers freeze the page; Lenis has to agree, or the content
      // behind an open modal keeps gliding.
      unsubscribeLock = onScrollLockChange((locked) => {
        if (locked) lenis?.stop();
        else lenis?.start();
      });
    };

    const stop = () => {
      unsubscribeLock?.();
      unsubscribeLock = null;
      if (tick) {
        gsap.ticker.remove(tick);
        tick = null;
      }
      gsap.ticker.lagSmoothing(500, 33);
      lenis?.destroy();
      lenis = null;
      // Leaves the page on whatever scroll position it was at, in native mode.
      ScrollTrigger.refresh();
    };

    const sync = () => {
      if (reducedMotion.matches) stop();
      else start();
    };

    sync();
    reducedMotion.addEventListener('change', sync);

    return () => {
      reducedMotion.removeEventListener('change', sync);
      stop();
    };
  }, [pathname]);

  return null;
}
