import React from 'react';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { Store, CreditCard } from 'lucide-react';

export default function AdminStoreSettingsPage() {
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

      <div className="admin-surface p-8 space-y-6">
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1.5">Nama Webstore *</label>
            <input
              type="text"
              defaultValue="Digital Atelier"
              className="w-full px-4 py-3 bg-[#F8F6F0] border border-[#E5E2D9] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1.5">Email Pengirim Notifikasi *</label>
            <input
              type="email"
              defaultValue="noreply@webstore.local"
              className="w-full px-4 py-3 bg-[#F8F6F0] border border-[#E5E2D9] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1.5">WhatsApp Dukungan Pembeli</label>
            <input
              type="text"
              defaultValue="628123456789"
              className="w-full px-4 py-3 bg-[#F8F6F0] border border-[#E5E2D9] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
            />
          </div>

          <button
            type="button"
            className="px-6 py-3 bg-[#6657E8] text-white text-xs font-semibold rounded-xl hover:bg-[#5244D2] transition-colors"
          >
            Simpan Pengaturan
          </button>
        </form>
      </div>
    </div>
  );
}
