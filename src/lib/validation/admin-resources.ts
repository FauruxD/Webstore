import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .max(2048, 'URL maksimal 2048 karakter')
  .refine((value) => value === '' || value.startsWith('/') || /^https?:\/\//i.test(value), {
    message: 'Gunakan URL http(s) atau path lokal yang diawali /',
  })
  .transform((value) => value || null);

export const CategoryPayloadSchema = z.object({
  name: z.string().trim().min(2, 'Nama kategori minimal 2 karakter').max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Slug minimal 2 karakter')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung'),
  description: z.string().trim().max(1000, 'Deskripsi maksimal 1000 karakter').transform((value) => value || null),
  imageUrl: optionalUrl,
});

export const CustomerPayloadSchema = z.object({
  displayName: z.string().trim().min(2, 'Nama pelanggan minimal 2 karakter').max(100),
  emailNormalized: z.string().trim().toLowerCase().email('Alamat email tidak valid').max(190),
  whatsapp: z
    .string()
    .trim()
    .max(32, 'Nomor WhatsApp maksimal 32 karakter')
    .regex(/^[+0-9()\-\s]*$/, 'Nomor WhatsApp mengandung karakter yang tidak valid')
    .transform((value) => value || null),
});

export const CouponPayloadSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, 'Kode kupon minimal 3 karakter')
      .max(32)
      .regex(/^[A-Z0-9_-]+$/, 'Kode hanya boleh berisi huruf, angka, garis bawah, dan tanda hubung'),
    type: z.enum(['PERCENTAGE', 'FIXED']),
    value: z.coerce.number().int().positive('Nilai diskon harus lebih dari 0'),
    minPurchase: z.coerce.number().int().min(0, 'Minimal pembelian tidak boleh negatif'),
    maxUsage: z.coerce.number().int().min(1, 'Batas penggunaan minimal 1'),
    perEmailLimit: z.coerce.number().int().min(1, 'Batas per email minimal 1'),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.type === 'PERCENTAGE' && value.value > 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'Diskon persentase maksimal 100%',
      });
    }

    if (value.endsAt <= value.startsAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'Waktu berakhir harus setelah waktu mulai',
      });
    }

    if (value.perEmailLimit > value.maxUsage) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['perEmailLimit'],
        message: 'Batas per email tidak boleh melebihi total penggunaan',
      });
    }
  });

export type CategoryPayload = z.infer<typeof CategoryPayloadSchema>;
export type CustomerPayload = z.infer<typeof CustomerPayloadSchema>;
export type CouponPayload = z.infer<typeof CouponPayloadSchema>;

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'form';
    if (!result[field]) result[field] = issue.message;
  }
  return result;
}
