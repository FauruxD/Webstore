import type { HeroContent } from '@prisma/client';
import { db } from '@/lib/db';

/**
 * Shape the hero UI consumes. Narrower than the Prisma row on purpose: the
 * timestamps and the id never reach the client components.
 */
export type HeroContentView = Omit<HeroContent, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>;

/**
 * Ships with the build so the homepage still renders its real copy when the
 * database is unreachable or has not been seeded yet. Must stay in sync with
 * the hero row in `prisma/seed.ts`.
 */
export const HERO_FALLBACK: HeroContentView = {
  eyebrow: 'Curated Digital Goods · For Creators & Builders',
  headlineLead: 'Aset Digital',
  headlineItalic: 'untuk Karya yang Lebih Baik',
  subtitle: 'Dirancang untuk Membantu Ide Tumbuh.',
  description:
    'Temukan UI kit, template, source code, dan aset kreatif yang dikurasi untuk mempercepat workflow pembuatan produk digital tanpa mengorbankan kualitas.',
  primaryCtaLabel: 'Jelajahi Koleksi',
  primaryCtaUrl: '/products',
  secondaryCtaLabel: 'Lacak Pesanan',
  secondaryCtaUrl: '/track-order',
  imageUrl:
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
  imageAlt: 'Curated UI Kit Asset Showcase',
  collectionLabel: 'Collection',
  collectionValue: '50+ Premium Assets',
  formatLabel: 'Format',
  formatValue: 'Figma · Next.js · React',
  licenseLabel: 'License',
  licenseValue: 'Personal & Commercial',
};

/**
 * Newest active hero row, or the built-in fallback. Never throws: a hero that
 * fails to load must not take the whole homepage down with it.
 */
export async function getActiveHero(): Promise<HeroContentView> {
  try {
    const hero = await db.heroContent.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!hero) return HERO_FALLBACK;

    return {
      eyebrow: hero.eyebrow,
      headlineLead: hero.headlineLead,
      headlineItalic: hero.headlineItalic,
      subtitle: hero.subtitle,
      description: hero.description,
      primaryCtaLabel: hero.primaryCtaLabel,
      primaryCtaUrl: hero.primaryCtaUrl,
      secondaryCtaLabel: hero.secondaryCtaLabel,
      secondaryCtaUrl: hero.secondaryCtaUrl,
      imageUrl: hero.imageUrl,
      imageAlt: hero.imageAlt,
      collectionLabel: hero.collectionLabel,
      collectionValue: hero.collectionValue,
      formatLabel: hero.formatLabel,
      formatValue: hero.formatValue,
      licenseLabel: hero.licenseLabel,
      licenseValue: hero.licenseValue,
    };
  } catch (error) {
    console.error('[hero] falling back to static content:', error);
    return HERO_FALLBACK;
  }
}
