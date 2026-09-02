import React from 'react';
import { db } from '@/lib/db';
import { formatRupiah } from '@/lib/utils/invoice';
import { getHeroSlotUsage } from '@/lib/services/product';
import { HERO_SLOT_COUNT } from '@/lib/validation/product';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import {
  ProductCreateProvider,
  ProductCreateTrigger,
} from '@/components/admin/products/ProductCreateProvider';
import { Edit, Sparkles } from 'lucide-react';

export default async function AdminProductsPage() {
  const [products, categories, heroSlots] = await Promise.all([
    db.product.findMany({
      include: {
        category: true,
        versions: { orderBy: { publishedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    getHeroSlotUsage(),
  ]);

  // Mirrors the storefront rule: the first three published featured products by
  // hero order are the ones that actually render in the collage.
  const heroVisibleIds = new Set(
    products
      .filter((product) => product.status === 'PUBLISHED' && product.isFeatured)
      .sort((a, b) => a.heroOrder - b.heroOrder)
      .slice(0, HERO_SLOT_COUNT)
      .map((product) => product.id),
  );

  return (
    <ProductCreateProvider categories={categories} heroSlots={heroSlots}>
      <div className="space-y-6 w-full min-w-0 font-sans">
        <AdminPageHeader
          eyebrow="MANAJEMEN KATALOG"
          title="Daftar Produk Digital"
          description="Kelola aset UI kit, template, versi file digital, dan lisensi produk."
          actions={<ProductCreateTrigger />}
        />

      <div className="admin-surface w-full min-w-0">
        <div className="overflow-x-auto w-full">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Versi Terakhir</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4">
                    <AdminEmptyState
                      title="Belum Ada Produk Digital"
                      description="Buat produk digital pertama kamu untuk mulai berjualan."
                      action={
                        <ProductCreateTrigger
                          variant="compact"
                          label="Tambah Produk Sekarang"
                        />
                      }
                    />
                  </td>
                </tr>
              ) : (
                products.map((prod: (typeof products)[number]) => (
                  <tr key={prod.id}>
                    <td>
                      <span className="admin-cell-title">
                        {prod.name}
                      </span>
                      <span className="admin-cell-sub">{prod.license}</span>
                    </td>
                    <td className="font-medium text-[#686660]">
                      {prod.category.name}
                    </td>
                    <td className="font-sans font-semibold tabular-nums text-sm">
                      {formatRupiah(prod.salePrice ?? prod.price)}
                    </td>
                    <td className="font-mono text-[#686660]">
                      v{prod.versions[0]?.version || '1.0.0'}
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AdminStatusBadge status={prod.status} />
                        {prod.isFeatured && (
                          <span
                            title={
                              heroVisibleIds.has(prod.id)
                                ? `Tampil di kolase hero pada urutan ${prod.heroOrder}`
                                : `Ditandai unggulan pada urutan ${prod.heroOrder}, di luar ${HERO_SLOT_COUNT} slot hero`
                            }
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              heroVisibleIds.has(prod.id)
                                ? 'bg-[#6657E8]/10 text-[#6657E8]'
                                : 'bg-[#F4F1EA] text-[#686660]'
                            }`}
                          >
                            <Sparkles className="h-3 w-3" />
                            <span className="tabular-nums">Hero {prod.heroOrder}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <button
                        disabled
                        className="p-2 rounded-lg bg-[#F4F1EA] text-[#686660] cursor-not-allowed text-xs font-medium inline-flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </ProductCreateProvider>
  );
}
