import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { ProductCard } from '@/components/storefront/product/ProductCard';
import { HeroSection } from '@/components/storefront/hero/HeroSection';

export default async function HomePage() {
  const featuredProducts = await db.product.findMany({
    where: { status: 'PUBLISHED' },
    take: 6,
    include: {
      category: true,
      media: { take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });

  const categories = await db.category.findMany({
    take: 3,
  });

  return (
    <div className="space-y-28 pb-24 font-sans text-[#111111] bg-[#F8F6F0]">
      {/* 1. EDITORIAL HERO SECTION
          Not tagged for scroll reveal: the hero owns its own entrance through
          the intro gate and the collage timeline, and a second system on the
          same nodes would fight it. */}
      <HeroSection />

      {/* 2. FEATURED CATEGORIES SECTION */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span data-reveal="text" className="text-xs font-semibold text-[#6657E8] uppercase tracking-wider block mb-1">
              Kategori Kunci
            </span>
            <h2 data-reveal="heading" className="font-serif text-3xl md:text-4xl font-bold text-[#111111]">
              Pilih Berdasarkan Kebutuhanmu
            </h2>
          </div>
        </div>

        <div data-reveal-stagger="panel" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              data-reveal-item
              className="group p-8 rounded-3xl bg-white border border-[#E5E2D9] hover:border-[#6657E8] hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-52"
            >
              <div>
                <h3 className="font-bold text-xl text-[#111111] group-hover:text-[#6657E8] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#686660] mt-2 line-clamp-2">{cat.description}</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#111111] group-hover:text-[#6657E8]">
                <span>Lihat Koleksi</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. SELECTED PRODUCTS GRID */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span data-reveal="text" className="text-xs font-semibold text-[#6657E8] uppercase tracking-wider block mb-1">
              Katalog Kurasi
            </span>
            <h2 data-reveal="heading" className="font-serif text-3xl md:text-4xl font-bold text-[#111111]">
              Produk Digital Terpopuler
            </h2>
          </div>
          <Link
            href="/products"
            data-reveal="text"
            className="text-xs font-semibold text-[#111111] hover:text-[#6657E8] flex items-center gap-1.5 transition-colors"
          >
            <span>Semua Produk</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div data-reveal-stagger="panel" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              slug={product.slug}
              categoryName={product.category.name}
              price={product.price}
              salePrice={product.salePrice}
              license={product.license}
              imageUrl={product.media[0]?.url}
              revealItem
            />
          ))}
        </div>
      </section>
    </div>
  );
}
