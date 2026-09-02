import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { Store, CreditCard, Upload } from 'lucide-react';

export default async function AdminPaymentSettingsPage() {
  const qrisAsset = await db.fileAsset.findFirst({
    where: { isPrivate: false },
  });

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

      <div className="admin-surface p-8 space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-[#111111]">Pratinjau Kode QRIS Aktif</h3>
          
          <div className="p-6 bg-[#F8F6F0] rounded-2xl border border-[#E5E2D9] inline-block">
            <Image
              src="/images/qris-demo.svg"
              alt="Merchant Static QRIS Code"
              width={200}
              height={200}
              className="bg-white p-3 rounded-xl shadow-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#111111]">Ganti Gambar QRIS (SVG / PNG)</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="text-xs text-[#686660] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#E8E4FF] file:text-[#6657E8] hover:file:bg-[#6657E8] hover:file:text-white transition-colors cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
