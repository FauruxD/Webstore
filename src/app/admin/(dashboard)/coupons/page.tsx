import React from 'react';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { CouponManager } from '@/components/admin/coupons/CouponManager';

export default async function AdminCouponsPage() {
  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { usages: true } } },
  });

  return (
    <div className="w-full min-w-0 space-y-6 font-sans">
      <AdminPageHeader
        eyebrow="PROMOSI & DISKON"
        title="Kode Promo & Kupon"
        description="Kelola diskon nominal atau persentase untuk kampanye pemasaran."
      />

      <CouponManager coupons={coupons.map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        type: coupon.type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        value: coupon.value,
        minPurchase: coupon.minPurchase,
        maxUsage: coupon.maxUsage,
        currentUsage: coupon.currentUsage,
        perEmailLimit: coupon.perEmailLimit,
        startsAt: coupon.startsAt.toISOString(),
        endsAt: coupon.endsAt.toISOString(),
        isActive: coupon.isActive,
        usageCount: coupon._count.usages,
      }))} />
    </div>
  );
}
