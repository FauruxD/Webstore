import { db } from '@/lib/db';

export interface ValidateCouponOptions {
  code: string;
  subtotal: number;
  customerEmail?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  discountAmount: number;
  reason?: string;
  coupon?: {
    id: string;
    code: string;
    type: string;
    value: number;
  };
}

export async function validateCoupon({
  code,
  subtotal,
  customerEmail,
}: ValidateCouponOptions): Promise<CouponValidationResult> {
  if (!code || !code.trim()) {
    return { valid: false, discountAmount: 0, reason: 'Kode promo tidak boleh kosong' };
  }

  const normalizedCode = code.trim().toUpperCase();
  const coupon = await db.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon || !coupon.isActive) {
    return { valid: false, discountAmount: 0, reason: 'Kode promo tidak ditemukan atau sudah tidak aktif' };
  }

  const now = new Date();
  if (now < coupon.startsAt || now > coupon.endsAt) {
    return { valid: false, discountAmount: 0, reason: 'Kode promo telah kedaluwarsa' };
  }

  if (coupon.currentUsage >= coupon.maxUsage) {
    return { valid: false, discountAmount: 0, reason: 'Batas penggunaan kupon ini telah habis' };
  }

  if (subtotal < coupon.minPurchase) {
    return {
      valid: false,
      discountAmount: 0,
      reason: `Minimal transaksi untuk kode ini adalah Rp ${coupon.minPurchase.toLocaleString('id-ID')}`,
    };
  }

  if (customerEmail && coupon.perEmailLimit > 0) {
    const userUsages = await db.couponUsage.count({
      where: {
        couponId: coupon.id,
        customerEmail,
      },
    });

    if (userUsages >= coupon.perEmailLimit) {
      return {
        valid: false,
        discountAmount: 0,
        reason: 'Kamu telah mencapai batas penggunaan kupon ini',
      };
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.type === 'PERCENTAGE') {
    discountAmount = Math.round((subtotal * coupon.value) / 100);
  } else if (coupon.type === 'FIXED') {
    discountAmount = Math.min(coupon.value, subtotal);
  }

  return {
    valid: true,
    discountAmount,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    },
  };
}
