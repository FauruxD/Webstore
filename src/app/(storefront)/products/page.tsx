import React from 'react';
import { db } from '@/lib/db';
import { ProductCard } from '@/components/storefront/product/ProductCard';
import { Search } from 'lucide-react';

interface CatalogPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { q, category, sort } = await searchParams;

  const whereCondition: any = {
    status: 'PUBLISHED',
  };

  if (q && q.trim()) {
    whereCondition.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
    ];
  }

  if (category && category.trim()) {
    whereCondition.category = {
      slug: category,
    };
  }

  let orderByCondition: any = { createdAt: 'desc' };
  if (sort === 'price_asc') orderByCondition = { price: 'asc' };
  if (sort === 'price_desc') orderByCondition = { price: 'desc' };

  const products = await db.product.findMany({
    where: whereCondition,
    include: {
      category: true,
      media: { take: 1 },
    },
    orderBy: orderByCondition,
  });

  const categories = await db.category.findMany();

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12 space-y-8">
      {/* Header. The filter bar below is deliberately not revealed: search and
          the selects must be usable the instant the page paints. */}
      <div className="space-y-2">
        <h1 data-reveal="heading" className="font-serif text-4xl md:text-5xl font-bold text-[#111111]">
          Katalog Produk Digital
        </h1>
        <p data-reveal="text" className="text-sm text-[#686660]">
          Temukan template UI, source code boilerplate, dan preset 3D berkualitas tinggi.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <form method="GET" action="/products" className="bg-white p-4 rounded-2xl border border-[#DAD6CD] flex flex-wrap gap-4 items-center justify-between shadow-xs">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-[#686660] absolute left-3.5 top-3.5" />
          <input
            type="text"
            name="q"
            defaultValue={q || ''}
            placeholder="Cari nama produk atau kata kunci..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            name="category"
            defaultValue={category || ''}
            className="px-3.5 py-2.5 bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            name="sort"
            defaultValue={sort || 'newest'}
            className="px-3.5 py-2.5 bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
          >
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
          </select>

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#111111] hover:bg-[#6657E8] text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="bg-white border border-[#DAD6CD] rounded-2xl p-16 text-center space-y-3">
          <Search className="w-12 h-12 text-[#686660]/40 mx-auto" />
          <h3 className="font-semibold text-lg text-[#111111]">Produk Tidak Ditemukan</h3>
          <p className="text-xs text-[#686660]">
            Coba ubah kata kunci pencarian atau reset filter kategori.
          </p>
        </div>
      ) : (
        <div data-reveal-stagger="panel" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              categoryName={p.category.name}
              price={p.price}
              salePrice={p.salePrice}
              license={p.license}
              imageUrl={p.media[0]?.url}
              revealItem
            />
          ))}
        </div>
      )}
    </div>
  );
}
