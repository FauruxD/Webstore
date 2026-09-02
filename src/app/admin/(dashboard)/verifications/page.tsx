import React from 'react';
import { db } from '@/lib/db';
import { VerificationQueueClient } from '@/components/admin/verification/VerificationQueueClient';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderIdFilter } = await searchParams;

  const pendingOrders = await db.order.findMany({
    where: {
      status: 'WAITING_VERIFICATION',
      ...(orderIdFilter ? { id: orderIdFilter } : {}),
    },
    include: {
      items: true,
      proofs: {
        where: { status: 'ACTIVE' },
        include: { fileAsset: true },
      },
    },
    orderBy: { updatedAt: 'asc' },
  });

  return (
    <div className="space-y-6 w-full min-w-0 font-sans">
      <AdminPageHeader
        eyebrow="VERIFIKASI MANUAL"
        title="Antrean Verifikasi Pembayaran"
        description="Bandingkan bukti transaksi QRIS pembeli dengan nominal order secara cermat untuk mengaktifkan akses produk digital."
      />

      <VerificationQueueClient initialOrders={pendingOrders} />
    </div>
  );
}
