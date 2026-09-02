import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { AnimatedHeroVisual } from './AnimatedHeroVisual';
import { getActiveHero, type HeroContentView } from '@/lib/queries/hero';
import { getHeroProducts, type HeroProduct } from '@/lib/queries/hero-products';

const MICRO_FEATURES = [
  { label: 'Guest Checkout Instant' },
  { label: 'Pembayaran QRIS Statis' },
  { label: 'Private File Delivery' },
];

/**
 * Server component: reads the active hero row and the featured products for
 * the collage, then hands both down to the client-side visual. The section
 * itself stays a Server Component so the copy ships with the first HTML
 * payload, and the collage images are real catalogue covers.
 */
export async function HeroSection() {
  const [hero, products]: [HeroContentView, HeroProduct[]] = await Promise.all([
    getActiveHero(),
    getHeroProducts(),
  ]);

  return (
    <section className="relative overflow-hidden border-b border-[#E5E2D9] pb-20 pt-12 md:pt-16">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-6 md:px-12 lg:grid-cols-12 lg:gap-16">
        {/* Left Content Column (5 Cols) */}
        <div className="z-10 space-y-7 lg:col-span-6">
          {/* Eyebrow */}
          <div
            data-hero-enter
            className="inline-flex items-center gap-2 rounded-full bg-[#E8E4FF] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#6657E8]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{hero.eyebrow}</span>
          </div>

          {/* Serif Display Headline */}
          <div data-hero-enter className="space-y-2">
            <h1 className="font-serif text-5xl font-bold leading-[0.92] tracking-tight text-[#111111] sm:text-6xl md:text-7xl lg:text-7xl">
              {hero.headlineLead} <br />
              <span className="font-normal italic">{hero.headlineItalic}</span>
            </h1>
            <p className="font-serif text-xl italic text-[#6657E8] md:text-2xl">{hero.subtitle}</p>
          </div>

          {/* Supporting Copy */}
          <p data-hero-enter className="max-w-xl text-sm leading-relaxed text-[#686660] md:text-base">
            {hero.description}
          </p>

          {/* CTAs */}
          <div data-hero-enter className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={hero.primaryCtaUrl}
              className="group flex items-center gap-2.5 rounded-full bg-[#111111] px-7 py-3.5 text-xs font-semibold text-[#F8F6F0] shadow-md transition-all hover:bg-[#6657E8]"
            >
              <span>{hero.primaryCtaLabel}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href={hero.secondaryCtaUrl}
              className="rounded-full border border-[#E5E2D9] bg-white px-6 py-3.5 text-xs font-semibold text-[#111111] transition-colors hover:bg-[#E8E4FF]"
            >
              {hero.secondaryCtaLabel}
            </Link>
          </div>

          {/* Supporting Micro-Features */}
          <div data-hero-enter className="flex flex-wrap items-center gap-6 pt-4 text-xs text-[#686660]">
            {MICRO_FEATURES.map((feature) => (
              <span key={feature.label} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#187A4A]" />
                <span>{feature.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right Visual Column (6 Cols) */}
        <div className="relative flex items-center justify-center lg:col-span-6">
          {/* Background Decorative Organic Glow */}
          <div className="pointer-events-none absolute -z-10 h-[400px] w-[400px] rounded-full bg-[#E8E4FF]/60 blur-3xl" />

          <AnimatedHeroVisual hero={hero} products={products} />
        </div>
      </div>
    </section>
  );
}
