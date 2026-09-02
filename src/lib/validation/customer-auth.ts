import { z } from 'zod';

const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Alamat email tidak valid')
  .max(190, 'Email maksimal 190 karakter');

const PasswordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .max(72, 'Password maksimal 72 karakter')
  .regex(/[A-Za-z]/, 'Password harus memiliki huruf')
  .regex(/[0-9]/, 'Password harus memiliki angka');

export const CustomerLoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password wajib diisi').max(72),
  next: z.string().optional(),
});

export const CustomerRegisterSchema = z.object({
  displayName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: EmailSchema,
  whatsapp: z
    .string()
    .trim()
    .max(32, 'Nomor WhatsApp maksimal 32 karakter')
    .regex(/^[+0-9()\-\s]*$/, 'Nomor WhatsApp mengandung karakter yang tidak valid')
    .transform((value) => value || null),
  password: PasswordSchema,
  next: z.string().optional(),
});

export type CustomerLoginInput = z.infer<typeof CustomerLoginSchema>;
export type CustomerRegisterInput = z.infer<typeof CustomerRegisterSchema>;

export function safeLoginIntent(value: unknown, fallback = '/account'): string {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  if (!normalized.startsWith('/') || normalized.startsWith('//') || normalized.includes('\\')) return fallback;
  return normalized;
}

export function safeCustomerRedirect(value: unknown, fallback = '/account'): string {
  const normalized = safeLoginIntent(value, fallback);
  if (normalized === '/admin' || normalized.startsWith('/admin/')) return fallback;
  return normalized;
}

export function safeAdminRedirect(value: unknown, fallback = '/admin'): string {
  const normalized = safeLoginIntent(value, fallback);
  if (normalized !== '/admin' && !normalized.startsWith('/admin/')) return fallback;
  return normalized;
}
