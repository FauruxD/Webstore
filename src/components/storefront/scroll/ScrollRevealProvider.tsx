'use client';

import { useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsomorphicLayoutEffect } from '@/components/storefront/preloader/useIsomorphicLayoutEffect';
import {
  INTRO_ASSET_TIMEOUT_MS,
  INTRO_EXIT_EVENT,
  introRequestedOnLoad,
} from '@/components/storefront/preloader/intro-config';
import {
  DEFAULT_PARALLAX_STRENGTH,
  REVEAL_ATTR,
  REVEAL_ITEM_ATTR,
  REVEAL_PARALLAX_ATTR,
  REVEAL_STAGGER_ATTR,
  REVEAL_STAGGER_STEP,
  REVEAL_START,
  resolveRevealVariant,
  scaleRevealVariant,
} from './reveal-config';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const MOBILE_QUERY = '(max-width: 639px)';

/** Hidden and shown clip rectangles for the masked image reveal. */
const CLIP_HIDDEN = 'inset(14% 0% 0% 0%)';
const CLIP_SHOWN = 'inset(0% 0% 0% 0%)';

/** Reduced motion still fades, it just does not travel. */
const REDUCED_FADE_DURATION = 0.3;

function collect(root: ParentNode, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

/**
 * Storefront scroll reveals.
 *
 * Reads markers off the DOM rather than wrapping every section in a component,
 * which keeps the Server Components server-rendered: a section only needs a
 * `data-reveal` attribute to join in, and nothing has to become a client
 * boundary. Everything animates `transform`, `opacity`, and `clip-path` only.
 *
 * Runs once per element (`once: true`) and never loops, so nothing on the page
 * is in perpetual motion. Under reduced motion the travel and parallax are
 * dropped and a short opacity transition takes their place.
 *
 * ScrollTrigger is driven by Lenis from `SmoothScrollProvider`, so positions
 * cannot drift between the two.
 */
export function ScrollRevealProvider() {
  const pathname = usePathname();
  // Ref, not state: reading it must never schedule a render.
  const contextRef = useRef<gsap.Context | null>(null);

  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Tells the gate script's failsafe that a real animator is in charge, so it
    // leaves the attribute alone and lets the code below own the handover.
    window.__ATELIER_REVEAL__ = true;

    const root = document.documentElement;
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    const mobile = window.matchMedia(MOBILE_QUERY);

    const build = () => {
      contextRef.current?.revert();

      const context = gsap.context(() => {
        const isMobile = mobile.matches;

        // ---- Single elements -------------------------------------------------
        for (const element of collect(document, `[${REVEAL_ATTR}]`)) {
          const variant = scaleRevealVariant(
            resolveRevealVariant(element.getAttribute(REVEAL_ATTR)),
            isMobile,
          );

          if (reducedMotion.matches) {
            gsap.set(element, { opacity: 1, clearProps: 'transform,clipPath' });
            continue;
          }

          gsap.from(element, {
            opacity: 0,
            y: variant.y,
            scale: variant.scale,
            clipPath: variant.clip ? CLIP_HIDDEN : undefined,
            duration: variant.duration,
            ease: variant.ease,
            // Leaves the element with no inline transform once it has landed, so
            // hover states and parallax are not fighting a stale matrix.
            clearProps: 'opacity,transform,clipPath,willChange',
            scrollTrigger: { trigger: element, start: REVEAL_START, once: true },
          });
        }

        // ---- Staggered groups ------------------------------------------------
        for (const group of collect(document, `[${REVEAL_STAGGER_ATTR}]`)) {
          const items = collect(group, `:scope > [${REVEAL_ITEM_ATTR}]`);
          if (items.length === 0) continue;

          const variant = scaleRevealVariant(
            resolveRevealVariant(group.getAttribute(REVEAL_STAGGER_ATTR)),
            isMobile,
          );

          if (reducedMotion.matches) {
            gsap.set(items, { opacity: 1, clearProps: 'transform,clipPath' });
            continue;
          }

          gsap.from(items, {
            opacity: 0,
            y: variant.y,
            scale: variant.scale,
            clipPath: variant.clip ? CLIP_HIDDEN : undefined,
            duration: variant.duration,
            ease: variant.ease,
            stagger: REVEAL_STAGGER_STEP,
            clearProps: 'opacity,transform,clipPath,willChange',
            // Triggered by the group, so a wide row of cards reveals as one
            // sequence rather than each card waiting for its own scroll point.
            scrollTrigger: { trigger: group, start: REVEAL_START, once: true },
          });
        }

        // ---- Parallax --------------------------------------------------------
        // Skipped on mobile and under reduced motion: it is decoration, and on a
        // short viewport it costs more than it adds.
        if (!reducedMotion.matches && !isMobile) {
          for (const element of collect(document, `[${REVEAL_PARALLAX_ATTR}]`)) {
            const raw = Number(element.getAttribute(REVEAL_PARALLAX_ATTR));
            const strength = Number.isFinite(raw) && raw !== 0 ? raw : DEFAULT_PARALLAX_STRENGTH;

            gsap.fromTo(
              element,
              { y: strength / 2 },
              {
                y: -strength / 2,
                ease: 'none',
                scrollTrigger: {
                  trigger: element,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            );
          }
        }
      });

      contextRef.current = context;

      // The hidden state has been replaced by inline styles from the tweens
      // above, so the pre-paint CSS is no longer needed. Removing it here is
      // what guarantees content can never be left invisible.
      root.removeAttribute('data-reveal-armed');

      if (reducedMotion.matches) {
        // Content is already visible; this only softens a preference change.
        gsap.to(`[${REVEAL_ATTR}], [${REVEAL_ITEM_ATTR}]`, {
          opacity: 1,
          duration: REDUCED_FADE_DURATION,
          overwrite: 'auto',
        });
      }

      // Images and fonts settle after this effect, so measured trigger points
      // need one correction pass.
      ScrollTrigger.refresh();
    };

    build();

    /*
      Trigger positions are measured against the document height at build time,
      and two things can make that measurement wrong straight afterwards:

      - The intro preloader holds `html { overflow: hidden }`, so the page is
        exactly one viewport tall while the curtain is up. Every trigger below
        the fold lands at the same spot and then never fires.
      - Fonts and lazy images change section heights after first paint.

      Both are fixed by re-measuring rather than by delaying the build, so the
      reveals are armed from the first frame either way.
    */
    let disposed = false;
    const refresh = () => {
      // Guards the async paths: a font promise resolving after a route change
      // would otherwise measure a document this effect no longer owns.
      if (!disposed) ScrollTrigger.refresh();
    };
    const timers: number[] = [];

    if (introRequestedOnLoad()) {
      window.addEventListener(INTRO_EXIT_EVENT, refresh, { once: true });
      // Backstop for the case where the overlay dies before it can announce
      // itself: the gate script lifts the curtain on the same schedule.
      timers.push(window.setTimeout(refresh, INTRO_ASSET_TIMEOUT_MS + 2100));
    }

    void document.fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener('load', refresh);

    reducedMotion.addEventListener('change', build);
    mobile.addEventListener('change', build);

    return () => {
      disposed = true;
      for (const timer of timers) window.clearTimeout(timer);
      window.removeEventListener(INTRO_EXIT_EVENT, refresh);
      window.removeEventListener('load', refresh);
      reducedMotion.removeEventListener('change', build);
      mobile.removeEventListener('change', build);
      // revert() restores every property the context touched and kills the
      // ScrollTrigger instances it created, so a client navigation leaves
      // nothing behind.
      contextRef.current?.revert();
      contextRef.current = null;
      root.removeAttribute('data-reveal-armed');
      delete window.__ATELIER_REVEAL__;
    };
    // Rebuilt per route: a new page has new markers, and the old triggers are
    // measured against a document that no longer exists.
  }, [pathname]);

  return null;
}
