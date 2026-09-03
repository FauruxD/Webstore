import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { QrisImageSettings } from '@/components/admin/settings/QrisImageSettings';
import { Store, CreditCard } from 'lucide-react';

export default async function AdminPaymentSettingsPage() {
  const settings = await db.storeSetting.findMany({
    where: { key: { in: ['qris_image_url', 'qris_image_filename', 'qris_image_version'] } },
    select: { key: true, value: true },
  });
  const values = new Map(settings.map((setting) => [setting.key, setting.value]));
  const baseImageUrl = values.get('qris_image_url') || '/images/qris-demo.svg';
  const version = values.get('qris_image_version');
  const imageUrl = version && baseImageUrl.startsWith('/api/qris-image')
    ? `${baseImageUrl}?v=${encodeURIComponent(version)}`
    : baseImageUrl;

  return (
    <div className="space-y-6 max-w-4xl w-full min-w-0 font-sans">
      <AdminPageHeader
        eyebrow="PEMBAYARAN QRIS"
        title="Pengaturan QRIS Statis"
        description="Kelola gambar QRIS statis merchant yang ditampilkan pada instruksi pembayaran pembeli."
      />

      <div className="flex items-center gap-4 border-b border-[#E5E2D9] pb-4">
        <Link
          href="/admin/settings/store"
          className="px-4 py-2 rounded-xl bg-white border border-[#E5E2D9] text-[#686660] hover:text-[#111111] text-xs font-semibold flex items-center gap-2"
        >
          <Store className="w-4 h-4" />
          <span>Pengaturan Toko</span>
        </Link>
        <Link
          href="/admin/settings/payment"
          className="px-4 py-2 rounded-xl bg-[#6657E8] text-white text-xs font-semibold shadow-xs flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          <span>Pengaturan QRIS & Pembayaran</span>
        </Link>
      </div>

      <div className="admin-surface space-y-6 p-5 sm:p-8">
        <QrisImageSettings
          initialImageUrl={imageUrl}
          initialFileName={values.get('qris_image_filename') || null}
        />
      </div>
    </div>
  );
}
