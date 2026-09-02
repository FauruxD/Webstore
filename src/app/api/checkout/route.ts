import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/services/checkout';
import { z } from 'zod';
import { getCustomerSession, setCustomerSessionCookie } from '@/lib/customer-auth';

const CheckoutSchema = z.object({
  customerName: z.string().min(2, 'Nama harus diisi'),
  customerEmail: z.string().email('Format email tidak valid'),
  customerWhatsapp: z.string().min(8, 'Nomor WhatsApp tidak valid'),
  items: z.array(z.object({ productId: z.string() })).min(1, 'Pilih minimal satu produk'),
  couponCode: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = CheckoutSchema.parse(body);

    const currentSession = await getCustomerSession();
    const normalizedCheckoutEmail = validated.customerEmail.trim().toLowerCase();
    if (currentSession?.isRegistered && currentSession.emailNormalized !== normalizedCheckoutEmail) {
      return NextResponse.json(
        { success: false, error: 'Gunakan email akun yang sedang masuk atau keluar dari akun sebelum checkout.' },
        { status: 403 },
      );
    }
    const reusableAccessId =
      currentSession?.emailNormalized === normalizedCheckoutEmail
        ? currentSession.id
        : undefined;
    const result = await createOrder({ ...validated, customerAccessId: reusableAccessId });

    const response = NextResponse.json({
      success: true,
      invoice: result.order.invoice,
      paymentUrl: `/payment/${result.order.invoice}`,
      orderUrl: `/order/${result.order.invoice}`,
      // Server-authoritative figures so the checkout dialog can show the payment
      // step in place instead of redirecting to read them from the page.
      order: {
        subtotal: result.order.subtotal,
        discount: result.order.discount,
        total: result.order.total,
        couponCode: result.order.couponCode,
        expiresAt: result.order.expiresAt.toISOString(),
        status: result.order.status,
      },
    });
    setCustomerSessionCookie(response, result.customerAccessId);
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses checkout';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
