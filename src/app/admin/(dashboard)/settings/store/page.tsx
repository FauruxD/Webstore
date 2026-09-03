import React from 'react';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { StoreSettingsForm } from '@/components/admin/settings/StoreSettingsForm';
import { db } from '@/lib/db';
import { Store, CreditCard } from 'lucide-react';

export default async function AdminStoreSettingsPage() {
  const settings = await db.storeSetting.findMany({
    where: { key: { in: ['store_name', 'notification_email', 'support_whatsapp'] } },
  });
  const byKey = new Map(settings.map((setting) => [setting.key, setting.value]));

  return (
    <div className="space-y-6 max-w-4xl w-full min-w-0 font-sans">
      <AdminPageHeader
        eyebrow="PENGATURAN TOKO"
        title="Konfigurasi Toko Digital"
        description="Atur identitas webstore, email notifikasi, dan preferensi umum operasional."
      />

      <div className="flex items-center gap-4 border-b border-[#E5E2D9] pb-4">
        <Link
          href="/admin/settings/store"
          className="px-4 py-2 rounded-xl bg-[#6657E8] text-white text-xs font-semibold shadow-xs flex items-center gap-2"
        >
          <Store className="w-4 h-4" />
          <span>Pengaturan Toko</span>
        </Link>
        <Link
          href="/admin/settings/payment"
          className="px-4 py-2 rounded-xl bg-white border border-[#E5E2D9] text-[#686660] hover:text-[#111111] text-xs font-semibold flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          <span>Pengaturan QRIS & Pembayaran</span>
        </Link>
      </div>

      <div className="admin-surface space-y-6 p-5 sm:p-8">
        <StoreSettingsForm
          initialStoreName={byKey.get('store_name') || 'Digital Atelier'}
          initialNotificationEmail={byKey.get('notification_email') || 'noreply@webstore.local'}
          initialSupportWhatsapp={byKey.get('support_whatsapp') || '628123456789'}
        />
      </div>
    </div>
  );
}
