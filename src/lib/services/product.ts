import { db } from '@/lib/db';
import { saveFileToStorage } from '@/lib/storage';
import { HERO_SLOT_COUNT, slugify, type ProductInput } from '@/lib/validation/product';

export interface ProductAssetInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface CreateProductInput extends ProductInput {
  /** Public preview image. Stored as `ProductMedia` and shown on the storefront. */
  thumbnail?: ProductAssetInput | null;
  /** The deliverable. Stored privately and attached to a `ProductVersion`. */
  digitalFile: ProductAssetInput;
}

/**
 * Appends `-2`, `-3`, ... until the slug is free. Cheap here because a create is
 * rare and the slug column is unique-indexed.
 */
export async function resolveUniqueSlug(desired: string): Promise<string> {
  const base = slugify(desired) || 'produk';
  let candidate = base;
  let suffix = 2;

  // Bounded so a pathological data set cannot spin forever.
  while (suffix < 200) {
    const clash = await db.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!clash) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return `${base}-${Date.now()}`;
}

/**
 * How many published products are already claiming a hero slot, and the next
 * free `heroOrder` after them.
 *
 * The storefront only ever renders `HERO_SLOT_COUNT` layers, so featuring more
 * is harmless but silently invisible. The admin form uses this to say so up
 * front instead of letting an admin wonder why their product never appears.
 */
export async function getHeroSlotUsage(): Promise<{
  used: number;
  remaining: number;
  nextOrder: number;
}> {
  const featured = await db.product.findMany({
    where: { status: 'PUBLISHED', isFeatured: true },
    orderBy: { heroOrder: 'asc' },
    select: { heroOrder: true },
  });

  const highest = featured.reduce((max, row) => Math.max(max, row.heroOrder), 0);

  return {
    used: featured.length,
    remaining: Math.max(0, HERO_SLOT_COUNT - featured.length),
    nextOrder: featured.length === 0 ? 1 : highest + 1,
  };
}

/**
 * Creates a product with its preview media and first downloadable version.
 * Files land in storage before the transaction so a write failure cannot leave a
 * half-created product behind.
 */
export async function createProduct(input: CreateProductInput) {
  const slug = await resolveUniqueSlug(input.slug);

  const savedFile = await saveFileToStorage({
    buffer: input.digitalFile.buffer,
    originalName: input.digitalFile.originalName,
    mimeType: input.digitalFile.mimeType,
  });

  let thumbnailUrl: string | null = null;
  if (input.thumbnail) {
    const savedThumb = await saveFileToStorage({
      buffer: input.thumbnail.buffer,
      originalName: input.thumbnail.originalName,
      mimeType: input.thumbnail.mimeType,
      isPrivate: false,
    });
    await db.fileAsset.create({
      data: {
        originalName: input.thumbnail.originalName,
        storageKey: savedThumb.storageKey,
        mimeType: input.thumbnail.mimeType,
        size: savedThumb.size,
        hash: savedThumb.hash,
        isPrivate: false,
      },
    });
    thumbnailUrl = `/api/product-media/${savedThumb.storageKey}`;
  }

  return db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: input.name,
        slug,
        status: input.status,
        description: input.description,
        price: input.price,
        salePrice: input.salePrice ?? null,
        license: input.license,
        downloadPolicy: input.downloadPolicy,
        isFeatured: input.isFeatured,
        // Only meaningful while featured, but kept either way so unfeaturing
        // and refeaturing a product restores its old slot.
        heroOrder: input.heroOrder,
        categoryId: input.categoryId,
      },
    });

    const fileAsset = await tx.fileAsset.create({
      data: {
        originalName: input.digitalFile.originalName,
        storageKey: savedFile.storageKey,
        mimeType: input.digitalFile.mimeType,
        size: savedFile.size,
        hash: savedFile.hash,
        isPrivate: true,
      },
    });

    await tx.productVersion.create({
      data: {
        productId: product.id,
        version: input.version,
        fileId: fileAsset.id,
        changelog: input.changelog?.trim() ? input.changelog.trim() : null,
      },
    });

    if (thumbnailUrl) {
      await tx.productMedia.create({
        data: {
          productId: product.id,
          type: 'IMAGE',
          url: thumbnailUrl,
          altText: input.name,
          position: 0,
        },
      });
    }

    return product;
  });
}
