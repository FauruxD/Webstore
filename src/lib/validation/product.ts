import { z } from 'zod';

export const PRODUCT_STATUSES = ['DRAFT', 'PUBLISHED'] as const;

/** Mirrors `Product.downloadPolicy`, which the schema stores as a string. */
export const DOWNLOAD_POLICIES = [
  { value: '7_DAYS_5_DOWNLOADS', label: '7 hari / 5 unduhan', maxDownloads: 5 },
  { value: '14_DAYS_10_DOWNLOADS', label: '14 hari / 10 unduhan', maxDownloads: 10 },
  { value: '30_DAYS_UNLIMITED', label: '30 hari / tanpa batas', maxDownloads: 0 },
] as const;

export const LICENSE_OPTIONS = [
  'Personal License',
  'Commercial License',
  'Extended Commercial License',
] as const;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER_PATTERN = /^\d+\.\d+(\.\d+)?$/;

/**
 * Slots in the homepage hero collage. The storefront renders the first three
 * published featured products by `heroOrder`, so this is a presentation cap
 * rather than a hard database limit.
 */
export const HERO_SLOT_COUNT = 3;
export const MAX_HERO_ORDER = 99;

/**
 * Shared by the dialog form and the create route, so client and server agree on
 * every message the buyer-facing admin sees.
 */
export const ProductInputSchema = z.object({
  name: z.string().trim().min(3, 'Nama produk minimal 3 karakter').max(140, 'Nama produk terlalu panjang'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Slug minimal 3 karakter')
    .max(140, 'Slug terlalu panjang')
    .regex(SLUG_PATTERN, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  license: z.string().trim().min(3, 'Lisensi wajib diisi'),
  description: z.string().trim().min(20, 'Deskripsi minimal 20 karakter'),
  price: z.coerce.number().int('Harga harus bilangan bulat').min(0, 'Harga tidak boleh negatif'),
  // FormData sends an untouched number field as '', which must mean "no promo"
  // rather than coercing to 0.
  salePrice: z.preprocess(
    (value) => (value === '' || value == null ? null : value),
    z.coerce
      .number()
      .int('Harga promo harus bilangan bulat')
      .min(0, 'Harga promo tidak boleh negatif')
      .nullable(),
  ),
  version: z
    .string()
    .trim()
    .regex(SEMVER_PATTERN, 'Format versi harus seperti 1.0.0'),
  downloadPolicy: z.string().min(1, 'Kebijakan unduhan wajib dipilih'),
  changelog: z.string().trim().max(2000, 'Changelog terlalu panjang').optional().or(z.literal('')),
  status: z.enum(PRODUCT_STATUSES, { message: 'Status publikasi tidak valid' }),
  // `z.coerce.boolean()` would read the string 'false' as true, and FormData
  // only ever carries strings.
  isFeatured: z.preprocess(
    (value) => (typeof value === 'string' ? value === 'true' || value === 'on' : Boolean(value)),
    z.boolean(),
  ),
  // Position in the hero collage. An empty field means "unset", which sorts
  // last among featured products rather than jumping to slot 0.
  heroOrder: z.preprocess(
    (value) => (value === '' || value == null ? 0 : value),
    z.coerce
      .number()
      .int('Urutan hero harus bilangan bulat')
      .min(0, 'Urutan hero tidak boleh negatif')
      .max(MAX_HERO_ORDER, `Urutan hero maksimal ${MAX_HERO_ORDER}`),
  ),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;

/** Promo price must undercut the normal price to be a real discount. */
export const ProductPayloadSchema = ProductInputSchema.refine(
  (data) => data.salePrice == null || data.salePrice < data.price,
  { path: ['salePrice'], message: 'Harga promo harus lebih kecil dari harga normal' },
);

/**
 * Form-facing twin of the payload schema. Every field is a string or a plain
 * boolean so the react-hook-form input type matches its output type and the
 * values can go straight into `FormData`. The server still re-validates with
 * `ProductPayloadSchema`, which owns the real coercion.
 */
export const ProductFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Nama produk minimal 3 karakter')
      .max(140, 'Nama produk terlalu panjang'),
    slug: z
      .string()
      .trim()
      .min(3, 'Slug minimal 3 karakter')
      .max(140, 'Slug terlalu panjang')
      .regex(SLUG_PATTERN, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
    categoryId: z.string().min(1, 'Kategori wajib dipilih'),
    license: z.string().trim().min(3, 'Lisensi wajib diisi'),
    description: z.string().trim().min(20, 'Deskripsi minimal 20 karakter'),
    price: z
      .string()
      .min(1, 'Harga normal wajib diisi')
      .regex(/^\d+$/, 'Harga hanya boleh berisi angka'),
    salePrice: z.string().regex(/^\d*$/, 'Harga promo hanya boleh berisi angka'),
    version: z.string().trim().regex(SEMVER_PATTERN, 'Format versi harus seperti 1.0.0'),
    downloadPolicy: z.string().min(1, 'Kebijakan unduhan wajib dipilih'),
    changelog: z.string().max(2000, 'Changelog terlalu panjang'),
    isFeatured: z.boolean(),
    heroOrder: z
      .string()
      .regex(/^\d*$/, 'Urutan hero hanya boleh berisi angka')
      .refine(
        (value) => value === '' || Number(value) <= MAX_HERO_ORDER,
        `Urutan hero maksimal ${MAX_HERO_ORDER}`,
      ),
  })
  .refine(
    (data) => data.salePrice === '' || Number(data.salePrice) < Number(data.price),
    { path: ['salePrice'], message: 'Harga promo harus lebih kecil dari harga normal' },
  );

export type ProductFormValues = z.infer<typeof ProductFormSchema>;

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_FILE_BYTES = 200 * 1024 * 1024;

export const DIGITAL_FILE_MIME_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/pdf',
  'application/octet-stream',
];

/** Turns a product name into a URL-safe slug candidate. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}
