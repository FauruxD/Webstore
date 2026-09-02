import React from 'react';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { CategoryManager } from '@/components/admin/categories/CategoryManager';

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 w-full min-w-0 font-sans">
      <AdminPageHeader
        eyebrow="STRUKTUR KATALOG"
        title="Kategori Produk"
        description="Pengelompokan kategori aset digital untuk memudahkan eksplorasi pembeli."
      />

      <CategoryManager categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        productCount: category._count.products,
      }))} />
    </div>
  );
}
