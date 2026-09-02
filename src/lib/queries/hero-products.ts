import { db } from '@/lib/db';

/**
 * One product layer in the homepage hero collage. Deliberately narrow: the
 * collage only needs enough to render a preview and link to the product.
 */
export interface HeroProduct {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  imageUrl: string;
  imageAlt: string;
}

/** How many layers the collage composition is designed around. */
export const HERO_PRODUCT_LIMIT = 3;

/**
 * Local previews used when the database has no published products at all, so
 * the hero still reads as a product collage instead of collapsing to an empty
 * circle. Never used when real products exist.
 */
const HERO_PRODUCT_FALLBACK: HeroProduct[] = [
  {
    id: 'fallback-ui-kit',
    name: 'Editorial UI Kit',
    slug: 'products',
    categoryName: 'UI Templates & Kits',
    imageUrl: '/images/products/ui-kit-dashboard.svg',
    imageAlt: 'Dashboard UI kit preview',
  },
  {
    id: 'fallback-mobile',
    name: 'Mobile App Screens',
    slug: 'products',
    categoryName: 'UI Templates & Kits',
    imageUrl: '/images/products/mobile-app-frame.svg',
    imageAlt: 'Mobile app screen preview',
  },
  {
    id: 'fallback-source',
    name: 'Production Boilerplate',
    slug: 'products',
    categoryName: 'Source Code & Boilerplates',
    imageUrl: '/images/products/saas-code-editor.svg',
    imageAlt: 'Source code editor preview',
  },
];

/** Shared shape of the rows this module selects, before mapping to the view. */
type HeroProductRow = {
  id: string;
  name: string;
  slug: string;
  category: { name: string };
  media: { url: string; altText: string | null }[];
};

const HERO_PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  category: { select: { name: true } },
  media: {
    where: { type: 'IMAGE' },
    orderBy: { position: 'asc' },
    take: 1,
    select: { url: true, altText: true },
  },
} as const;

function toHeroProduct(row: HeroProductRow): HeroProduct | null {
  const cover = row.media[0];
  // A layer with no cover image has nothing to show, so it is dropped rather
  // than rendered as an empty rectangle.
  if (!cover?.url) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryName: row.category.name,
    imageUrl: cover.url,
    imageAlt: cover.altText || row.name,
  };
}

/**
 * Up to three published products for the hero collage, featured first and
 * ordered by `heroOrder`.
 *
 * More than three featured products is not an error: the first three by
 * `heroOrder` win. Fewer than three is topped up with other published products
 * so the composition still has depth, and the collage itself renders correctly
 * at one, two, or three layers.
 */
export async function getHeroProducts(): Promise<HeroProduct[]> {
  try {
    const featured = await db.product.findMany({
      where: { status: 'PUBLISHED', isFeatured: true },
      orderBy: [{ heroOrder: 'asc' }, { createdAt: 'desc' }],
      take: HERO_PRODUCT_LIMIT,
      select: HERO_PRODUCT_SELECT,
    });

    const layers = featured
      .map(toHeroProduct)
      .filter((product): product is HeroProduct => product !== null);

    if (layers.length >= HERO_PRODUCT_LIMIT) return layers;

    // Top up from the rest of the catalogue, newest first.
    const filler = await db.product.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: layers.map((product) => product.id) },
      },
      orderBy: [{ heroOrder: 'asc' }, { createdAt: 'desc' }],
      take: HERO_PRODUCT_LIMIT - layers.length,
      select: HERO_PRODUCT_SELECT,
    });

    const topped = [
      ...layers,
      ...filler
        .map(toHeroProduct)
        .filter((product): product is HeroProduct => product !== null),
    ];

    return topped.length > 0 ? topped : HERO_PRODUCT_FALLBACK;
  } catch (error) {
    console.error('[hero] product collage falling back to static previews:', error);
    return HERO_PRODUCT_FALLBACK;
  }
}
