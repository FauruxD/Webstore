import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateCoupon } from '@/lib/services/coupon';

const PreviewSchema = z.object({
  code: z.string().min(1, 'Kode promo tidak boleh kosong'),
  subtotal: z.number().int().min(0),
  customerEmail: z.string().email().optional().or(z.literal('')),
});

/**
 * Read-only preview of a promo code so the checkout dialog can show the real
 * discount before the order exists. The authoritative application still happens
 * inside `createOrder`, which re-runs the same `validateCoupon` service.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, subtotal, customerEmail } = PreviewSchema.parse(body);

    const result = await validateCoupon({
      code,
      subtotal,
      customerEmail: customerEmail || undefined,
    });

    return NextResponse.json({
      success: true,
      valid: result.valid,
      discountAmount: result.discountAmount,
      reason: result.reason,
      code: result.coupon?.code,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memeriksa kode promo';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
