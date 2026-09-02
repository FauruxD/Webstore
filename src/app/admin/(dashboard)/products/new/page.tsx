import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getHeroSlotUsage } from '@/lib/services/product';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { ProductNewFallback } from '@/components/admin/products/ProductNewFallback';
import { ArrowLeft } from 'lucide-react';

/**
 * Fallback route kept for deep links and bookmarks. Normal admin usage creates
 * products from the dialog on `/admin/products`; this page opens that same
 * dialog so both paths share one form and one create endpoint.
 */
export default async function AdminNewProductPage() {
  const [categories, heroSlots] = await Promise.all([
    db.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    getHeroSlotUsage(),
  ]);

  return (
    <div className="space-y-6 max-w-4xl w-full min-w-0 font-sans">
      <Link
        href="/admin/products"
        className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E2D9] text-xs font-semibold text-[#686660] hover:text-[#111111] inline-flex items-center gap-1.5 shadow-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Produk</span>
      </Link>

      <AdminPageHeader
        eyebrow="KATALOG"
        title="Tambah Produk Digital Baru"
        description="Form produk terbuka otomatis. Tutup dialog untuk kembali ke daftar produk."
      />

      <ProductNewFallback categories={categories} heroSlots={heroSlots} />
    </div>
  );
}
