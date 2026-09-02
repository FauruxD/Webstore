import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { DOWNLOAD_POLICIES } from '@/lib/validation/product';
import {
  BadgeCheck,
  CheckCircle2,
  Download,
  FileArchive,
  Mail,
  MonitorSmartphone,
  QrCode,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { ProductCard } from '@/components/storefront/product/ProductCard';
import { ProductDetailHero } from '@/components/storefront/product/ProductDetailHero';
import { ProductFaq } from '@/components/storefront/product/ProductFaq';
import type { ProductSpecRow } from '@/components/storefront/product/ProductPurchasePanel';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

const DEFAULT_QRIS_URL = '/images/qris-demo.svg';
const DEFAULT_MERCHANT_NAME = 'FA RUX DIGITAL STORE';

/** Human label for `Product.downloadPolicy`, falling back to the raw value. */
function downloadPolicyLabel(policy: string): string {
  return DOWNLOAD_POLICIES.find((item) => item.value === policy)?.label ?? policy;
}

/** File extension of the shipped archive, derived from its real stored name. */
function fileFormatLabel(originalName?: string): string | null {
  if (!originalName) return null;
  const dot = originalName.lastIndexOf('.');
  if (dot < 0 || dot === originalName.length - 1) return null;
  return originalName.slice(dot + 1).toUpperCase();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(date);
}

/** First paragraph of the description, used as the hero summary. */
function leadParagraph(description: string): string {
  const first = description.split(/\n\s*\n/)[0]?.trim() ?? '';
  return first.length > 260 ? `${first.slice(0, 257).trimEnd()}...` : first;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  const product = await db.product.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      category: true,
      media: true,
      versions: {
        orderBy: { publishedAt: 'desc' },
        include: { fileAsset: true },
      },
    },
  });

  if (!product) notFound();

  const [relatedProducts, qrisSetting, merchantSetting] = await Promise.all([
    db.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'PUBLISHED',
      },
      take: 3,
      include: { category: true, media: { take: 1 } },
    }),
    db.storeSetting.findUnique({ where: { key: 'qris_image_url' } }),
    db.storeSetting.findUnique({ where: { key: 'merchant_name' } }),
  ]);

  const latestVersion = product.versions[0];
  const fileFormat = fileFormatLabel(latestVersion?.fileAsset?.originalName);
  const policyLabel = downloadPolicyLabel(product.downloadPolicy);

  const orderedMedia = [...product.media].sort((a, b) => a.position - b.position);

  const specs: ProductSpecRow[] = [
    { label: 'Lisensi', value: product.license },
    { label: 'Aturan unduhan', value: policyLabel },
    ...(latestVersion ? [{ label: 'Versi terbaru', value: latestVersion.version }] : []),
    ...(fileFormat ? [{ label: 'Format berkas', value: fileFormat }] : []),
    ...(latestVersion?.fileAsset
      ? [{ label: 'Ukuran berkas', value: formatBytes(latestVersion.fileAsset.size) }]
      : []),
    { label: 'Pengiriman', value: 'Akses privat di halaman pesanan', tone: 'success' as const },
  ];

  const included = [
    latestVersion?.fileAsset
      ? {
          icon: FileArchive,
          title: `Berkas utama${fileFormat ? ` (${fileFormat})` : ''}`,
          body: `${latestVersion.fileAsset.originalName}, ${formatBytes(latestVersion.fileAsset.size)}, versi ${latestVersion.version}.`,
        }
      : {
          icon: FileArchive,
          title: 'Berkas utama produk',
          body: 'Paket unduhan dikirim setelah pembayaran diverifikasi admin.',
        },
    {
      icon: BadgeCheck,
      title: product.license,
      body: 'Hak pakai sesuai lisensi yang tertera, berlaku sejak pesanan diverifikasi.',
    },
    {
      icon: Download,
      title: 'Akses unduhan terkendali',
      body: `Kuota dan masa berlaku mengikuti kebijakan ${policyLabel}.`,
    },
    {
      icon: Mail,
      title: 'Pengiriman privat di aplikasi',
      body: 'Akses unduhan aman muncul di halaman pesanan dan percakapan setelah admin mengirim produk.',
    },
  ];

  const compatibility = [
    {
      icon: MonitorSmartphone,
      title: 'Perangkat',
      body: 'Berkas diunduh lewat browser desktop maupun mobile. Untuk arsip besar, koneksi stabil disarankan.',
    },
    {
      icon: FileArchive,
      title: 'Format',
      body: fileFormat
        ? `Paket dikirim dalam format ${fileFormat}. Siapkan aplikasi pembuka yang sesuai sebelum mengunduh.`
        : 'Format paket ditentukan saat rilis versi terbaru diterbitkan admin.',
    },
    {
      icon: QrCode,
      title: 'Pembayaran',
      body: 'QRIS statis dari GoPay, OVO, ShopeePay, Dana, BCA, dan Mandiri. Verifikasi bukti bayar dilakukan manual oleh admin.',
    },
  ];

  const faqEntries = [
    {
      question: 'Berapa lama pesanan saya diverifikasi?',
      answer:
        'Pembayaran QRIS diverifikasi manual oleh admin setelah bukti transfer diunggah. Status terbaru selalu bisa dipantau lewat halaman lacak pesanan memakai nomor invoice.',
    },
    {
      question: 'Berapa lama tautan unduhan berlaku?',
      answer: `Akses mengikuti kebijakan ${policyLabel}. Setelah kuota atau masa berlaku habis, hubungi admin untuk penerbitan ulang token.`,
    },
    {
      question: 'Apakah saya dapat pembaruan versi berikutnya?',
      answer: latestVersion
        ? `Pembelian ini terikat pada versi ${latestVersion.version}. Pembaruan minor diumumkan lewat catatan rilis pada halaman ini.`
        : 'Catatan rilis akan tampil di halaman ini begitu versi pertama diterbitkan.',
    },
    {
      question: 'Bagaimana jika saya kehilangan akses pesanan?',
      answer:
        'Gunakan halaman Lacak Pesanan dengan invoice dan email checkout untuk membuat ulang sesi pelanggan yang aman.',
    },
    {
      question: 'Apakah pembayaran bisa dibatalkan?',
      answer:
        'Pesanan yang belum dibayar kedaluwarsa otomatis dalam 24 jam. Untuk pesanan yang sudah dibayar, pengembalian dana mengikuti kebijakan pada halaman Syarat dan Ketentuan.',
    },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-20 px-6 py-12 md:px-12">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#686660]">
        <Link href="/" className="transition-colors hover:text-[#111111]">
          Beranda
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/products" className="transition-colors hover:text-[#111111]">
          Katalog
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-[#111111]">{product.name}</span>
      </nav>

      <ProductDetailHero
        productId={product.id}
        name={product.name}
        categoryName={product.category.name}
        summary={leadParagraph(product.description)}
        price={product.price}
        salePrice={product.salePrice}
        license={product.license}
        media={orderedMedia.map((item) => ({
          id: item.id,
          type: item.type,
          url: item.url,
          altText: item.altText,
        }))}
        specs={specs}
        qrisUrl={qrisSetting?.value || DEFAULT_QRIS_URL}
        merchantName={merchantSetting?.value || DEFAULT_MERCHANT_NAME}
      />

      <section aria-labelledby="overview-heading" className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="overview-heading" data-reveal="heading" className="font-display text-3xl text-[#111111]">
            Tentang produk ini
          </h2>
          <p data-reveal="text" className="mt-3 text-xs uppercase tracking-[0.14em] text-[#686660]">
            {product.category.name}
          </p>
        </div>
        <div className="lg:col-span-8">
          <p data-reveal="text" className="max-w-[68ch] whitespace-pre-line text-sm leading-relaxed text-[#686660]">
            {product.description}
          </p>
        </div>
      </section>

      <section aria-labelledby="included-heading" className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="included-heading" data-reveal="heading" className="font-display text-3xl text-[#111111]">
            Yang kamu dapatkan
          </h2>
          <p data-reveal="text" className="mt-3 max-w-[34ch] text-sm leading-relaxed text-[#686660]">
            Rincian isi paket, hak pakai, dan cara berkas sampai ke tanganmu.
          </p>
        </div>
        <div
          data-reveal-stagger="text"
          className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8"
        >
          {included.map((item) => (
            <div key={item.title} data-reveal-item className="flex gap-4 border-t border-[#DAD6CD] pt-5">
              <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#6657E8]" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-[#111111]">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#686660]">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="compatibility-heading"
        className="grid grid-cols-1 gap-10 lg:grid-cols-12"
      >
        <div className="lg:col-span-4">
          <h2 id="compatibility-heading" data-reveal="heading" className="font-display text-3xl text-[#111111]">
            Kompatibilitas dan kebutuhan
          </h2>
        </div>
        <div
          data-reveal-stagger="text"
          className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-3 lg:col-span-8"
        >
          {compatibility.map((item) => (
            <div key={item.title} data-reveal-item className="border-t border-[#DAD6CD] pt-5">
              <item.icon className="h-5 w-5 text-[#6657E8]" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold text-[#111111]">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#686660]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="license-heading" className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="license-heading" data-reveal="heading" className="font-display text-3xl text-[#111111]">
            Informasi lisensi
          </h2>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#DAD6CD] px-3 py-1 text-[11px] font-semibold text-[#111111]">
            <ScrollText className="h-3.5 w-3.5 text-[#6657E8]" aria-hidden="true" />
            <span>{product.license}</span>
          </p>
        </div>
        <div className="space-y-4 lg:col-span-8">
          <ul className="max-w-[68ch] space-y-3 text-sm leading-relaxed text-[#686660]">
            <li className="flex gap-3">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-[#187A4A]"
                aria-hidden="true"
              />
              <span>
                Hak pakai berlaku untuk pembeli yang tercatat pada pesanan, sesuai cakupan{' '}
                {product.license}.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-[#187A4A]"
                aria-hidden="true"
              />
              <span>
                Akses unduhan dibatasi kebijakan {policyLabel} dan diamankan token pribadi per
                pesanan.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-[#187A4A]"
                aria-hidden="true"
              />
              <span>
                Redistribusi ulang, penjualan kembali, atau pembagian token unduhan tidak
                diperkenankan.
              </span>
            </li>
          </ul>
          <Link
            href="/terms"
            className="inline-flex text-xs font-semibold text-[#6657E8] underline underline-offset-4 transition-colors hover:text-[#111111]"
          >
            Baca Syarat dan Ketentuan lengkap
          </Link>
        </div>
      </section>

      {product.versions.length > 0 && (
        <section aria-labelledby="version-heading" className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="version-heading" data-reveal="heading" className="font-display text-3xl text-[#111111]">
              Versi dan catatan rilis
            </h2>
            <p data-reveal="text" className="mt-3 max-w-[34ch] text-sm leading-relaxed text-[#686660]">
              Riwayat rilis yang diterbitkan admin untuk produk ini.
            </p>
          </div>
          <ol
            data-reveal-stagger="text"
            className="divide-y divide-[#DAD6CD] border-t border-[#DAD6CD] lg:col-span-8"
          >
            {product.versions.map((version, index) => (
              <li key={version.id} data-reveal-item className="flex flex-col gap-2 py-5 sm:flex-row sm:gap-8">
                <div className="flex shrink-0 items-center gap-2 sm:w-40">
                  <span className="font-mono text-sm font-bold text-[#111111]">
                    {version.version}
                  </span>
                  {index === 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8E4FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6657E8]">
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      Terbaru
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#686660]">{formatDate(version.publishedAt)}</p>
                  <p className="mt-1 max-w-[62ch] whitespace-pre-line text-sm leading-relaxed text-[#111111]">
                    {version.changelog || 'Rilis publik stabil.'}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="faq-heading" className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="faq-heading" data-reveal="heading" className="font-display text-3xl text-[#111111]">
            Pertanyaan umum
          </h2>
        </div>
        <div data-reveal="panel" className="lg:col-span-8">
          <ProductFaq entries={faqEntries} />
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section aria-labelledby="related-heading" className="space-y-8 border-t border-[#DAD6CD] pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="related-heading" data-reveal="heading" className="font-display text-3xl text-[#111111]">
              Produk terkait
            </h2>
            <Link
              href="/products"
              data-reveal="text"
              className="text-xs font-semibold text-[#6657E8] underline underline-offset-4 transition-colors hover:text-[#111111]"
            >
              Lihat seluruh katalog
            </Link>
          </div>
          <div data-reveal-stagger="panel" className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {relatedProducts.map((related) => (
              <ProductCard
                key={related.id}
                id={related.id}
                name={related.name}
                slug={related.slug}
                categoryName={related.category.name}
                price={related.price}
                salePrice={related.salePrice}
                license={related.license}
                imageUrl={related.media[0]?.url}
                revealItem
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
