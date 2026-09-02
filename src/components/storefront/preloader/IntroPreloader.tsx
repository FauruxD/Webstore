'use client';

import React, { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { acquireScrollLock, releaseScrollLock } from '@/lib/scroll/scroll-lock';
import {
  INTRO_ASSET_TIMEOUT_MS,
  INTRO_EXIT_EVENT,
  INTRO_SESSION_KEY,
  introRequestedOnLoad,
} from './intro-config';

const WORDMARK = 'DIGITAL ATELIER';

/** Floor on the intro so a warm cache still reads as a deliberate moment. */
const MIN_HOLD_MS = 1500;

/** Thin 1px strokes with off-circular radii so the orbit feels drawn, not printed. */
const RINGS = [
  {
    size: 'clamp(124px, 36vw, 168px)',
    radius: '52% 48% 45% 55% / 50% 55% 45% 50%',
    color: 'rgba(17, 17, 17, 0.28)',
    spin: 16,
  },
  {
    size: 'clamp(178px, 48vw, 232px)',
    radius: '46% 54% 52% 48% / 55% 46% 54% 45%',
    color: 'rgba(102, 87, 232, 0.34)',
    spin: 23,
  },
  {
    size: 'clamp(228px, 60vw, 296px)',
    radius: '54% 46% 48% 52% / 45% 54% 46% 55%',
    color: 'rgba(17, 17, 17, 0.13)',
    spin: 31,
  },
];

const STAGE_SIZE = RINGS[RINGS.length - 1].size;

/**
 * Read from the window flag the gate script set, not from the `data-intro`
 * attribute, which React owns once it hydrates `<html>`.
 */
const INTRO_REQUESTED = introRequestedOnLoad();

/** Set only when a run completes, so a later remount cannot replay it. */
let introPlayed = false;

/** Fonts plus the hero image, capped so a slow network cannot stall the intro. */
function waitForAssets(): Promise<void> {
  const jobs: Promise<unknown>[] = [];

  if ('fonts' in document) {
    jobs.push(document.fonts.ready);
  }

  const hero = document.querySelector<HTMLImageElement>('main img');
  if (hero && !hero.complete) {
    jobs.push(
      new Promise<void>((resolve) => {
        hero.addEventListener('load', () => resolve(), { once: true });
        hero.addEventListener('error', () => resolve(), { once: true });
      }),
    );
  }

  const cap = new Promise<void>((resolve) => {
    window.setTimeout(resolve, INTRO_ASSET_TIMEOUT_MS);
  });

  return Promise.race([Promise.all(jobs).then(() => undefined), cap]);
}

export function IntroPreloader() {
  const [active, setActive] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevOverflowRef = useRef('');
  const holdsLockRef = useRef(false);
  const finishedRef = useRef(false);

  /**
   * Hands page scrolling back. Idempotent, because the exit timeline and the
   * unmount cleanup can both reach it and the lock registry counts holders.
   */
  const releasePageScroll = () => {
    if (!holdsLockRef.current) return;
    holdsLockRef.current = false;
    document.body.style.overflow = prevOverflowRef.current;
    releaseScrollLock();
  };

  // Decide whether this load gets an intro, then lock the page for it.
  useIsomorphicLayoutEffect(() => {
    if (!INTRO_REQUESTED || introPlayed) return;

    const root = document.documentElement;

    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, '1');
    } catch {
      // Storage blocked (private mode). Intro degrades to once per load.
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      introPlayed = true;
      root.removeAttribute('data-intro');
      window.dispatchEvent(new Event(INTRO_EXIT_EVENT));
      return;
    }

    root.dataset.intro = 'running';
    prevOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // `body { overflow: hidden }` alone does not stop smooth scrolling, which
    // listens for wheel and touch on the window. Without this the page scrolls
    // silently behind the curtain and the intro lifts on a random offset.
    holdsLockRef.current = true;
    acquireScrollLock();
    setActive(true);

    return () => {
      root.removeAttribute('data-intro');
      releasePageScroll();
    };
  }, []);

  // Entrance, asset gate, then the center split that hands over to the page.
  useIsomorphicLayoutEffect(() => {
    if (!active) return;

    let cancelled = false;
    let holdTimer = 0;

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      introPlayed = true;
      releasePageScroll();
      setActive(false);
    };

    const ctx = gsap.context(() => {
      const rings = gsap.utils.toArray<HTMLElement>('[data-intro-ring]');
      const letters = gsap.utils.toArray<HTMLElement>('[data-intro-letter]');

      gsap.set(rings, { opacity: 0, scale: 0.88 });
      gsap.set(logoRef.current, { opacity: 0, scale: 0.84 });
      gsap.set(letters, { yPercent: 115 });
      gsap.set(taglineRef.current, { opacity: 0, y: 8 });

      // Continuous orbit, independent of the entrance timeline.
      rings.forEach((ring, index) => {
        gsap.to(ring, {
          rotation: index % 2 === 0 ? 360 : -360,
          duration: RINGS[index].spin,
          ease: 'none',
          repeat: -1,
        });
      });

      const intro = gsap.timeline();
      intro
        .to(logoRef.current, {
          opacity: 1,
          scale: 1,
          duration: 0.62,
          ease: 'power3.out',
        })
        .to(
          rings,
          {
            opacity: 1,
            scale: 1,
            duration: 0.72,
            ease: 'power2.out',
            stagger: 0.09,
          },
          '-=0.42',
        )
        .to(
          letters,
          {
            yPercent: 0,
            duration: 0.68,
            ease: 'power3.out',
            stagger: 0.028,
          },
          '-=0.34',
        )
        .to(
          taglineRef.current,
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
          '-=0.36',
        );

      const minHold = new Promise<void>((resolve) => {
        holdTimer = window.setTimeout(resolve, MIN_HOLD_MS);
      });

      void Promise.all([waitForAssets(), minHold]).then(() => {
        if (cancelled) return;

        gsap
          .timeline({ onComplete: finish })
          .to(contentRef.current, {
            opacity: 0,
            scale: 0.97,
            y: -10,
            duration: 0.4,
            ease: 'power2.in',
          })
          .addLabel('split')
          .call(() => {
            // Drop the pre-paint curtain and cue the hero exactly as the
            // panels part, so the page is already moving when it is revealed.
            document.documentElement.removeAttribute('data-intro');
            window.dispatchEvent(new Event(INTRO_EXIT_EVENT));
          })
          .to(
            topRef.current,
            { yPercent: -101, duration: 0.86, ease: 'power3.inOut' },
            'split',
          )
          .to(
            bottomRef.current,
            { yPercent: 101, duration: 0.86, ease: 'power3.inOut' },
            'split',
          );
      });
    }, rootRef);

    return () => {
      cancelled = true;
      window.clearTimeout(holdTimer);
      ctx.revert();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div ref={rootRef} data-intro-overlay className="fixed inset-0 z-[9999]">
      <div
        ref={topRef}
        className="absolute inset-x-0 top-0 h-[50.5%] bg-[#F8F6F0] will-change-transform"
      />
      <div
        ref={bottomRef}
        className="absolute inset-x-0 bottom-0 h-[50.5%] bg-[#F8F6F0] will-change-transform"
      />

      <div
        ref={contentRef}
        role="status"
        aria-label="Memuat Digital Atelier"
        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 px-6 will-change-transform"
      >
        <div
          ref={stageRef}
          aria-hidden="true"
          className="relative flex items-center justify-center"
          style={{ width: STAGE_SIZE, height: STAGE_SIZE }}
        >
          {RINGS.map((ring) => (
            <span
              key={ring.size}
              data-intro-ring
              className="absolute border border-solid will-change-transform"
              style={{
                width: ring.size,
                height: ring.size,
                borderRadius: ring.radius,
                borderColor: ring.color,
              }}
            />
          ))}

          <div
            ref={logoRef}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#111111] font-serif text-2xl font-bold text-[#F8F6F0] will-change-transform"
          >
            A
          </div>
        </div>

        <div aria-hidden="true" className="flex flex-col items-center gap-4">
          <div
            data-intro-wordmark
            className="flex items-end justify-center font-serif text-[clamp(21px,6.2vw,40px)] font-semibold leading-[1.12] tracking-[0.16em] text-[#111111]"
          >
            {WORDMARK.split('').map((char, index) =>
              char === ' ' ? (
                <span key={`gap-${index}`} className="inline-block w-[0.34em]" />
              ) : (
                <span
                  key={`${char}-${index}`}
                  className="block overflow-hidden pb-[0.08em]"
                >
                  <span data-intro-letter className="block will-change-transform">
                    {char}
                  </span>
                </span>
              ),
            )}
          </div>

          <p
            ref={taglineRef}
            className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#686660] will-change-transform"
          >
            Curated Digital Goods
          </p>
        </div>
      </div>
    </div>
  );
}
