'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  CheckCircle2,
  FileArchive,
  ImagePlus,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/dialog';
import {
  DOWNLOAD_POLICIES,
  HERO_SLOT_COUNT,
  IMAGE_MIME_TYPES,
  LICENSE_OPTIONS,
  MAX_IMAGE_BYTES,
  MAX_PRODUCT_FILE_BYTES,
  ProductFormSchema,
  slugify,
  type ProductFormValues,
} from '@/lib/validation/product';

export interface ProductFormCategory {
  id: string;
  name: string;
}

/** Hero collage occupancy at the time the page rendered. */
export interface HeroSlotUsage {
  used: number;
  remaining: number;
  nextOrder: number;
}

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  categories: ProductFormCategory[];
  heroSlots: HeroSlotUsage;
}

const INPUT_CLASS =
  'w-full px-4 py-3 bg-[#F8F6F0] border border-[#E5E2D9] rounded-xl text-xs text-[#111111] transition-colors focus:outline-none focus:border-[#6657E8] disabled:opacity-60';
const LABEL_CLASS = 'block text-xs font-semibold text-[#111111] mb-1.5';
const ERROR_CLASS = 'mt-1.5 text-[11px] text-[#B42318]';

const DEFAULT_VALUES: ProductFormValues = {
  name: '',
  slug: '',
  categoryId: '',
  license: LICENSE_OPTIONS[0],
  description: '',
  price: '',
  salePrice: '',
  version: '1.0.0',
  downloadPolicy: DOWNLOAD_POLICIES[0].value,
  changelog: '',
  isFeatured: false,
  heroOrder: '',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Creates a product without leaving the products table. Submits multipart form
 * data to `/api/admin/products`, then asks the server component to re-render so
 * the new row appears without a full page load.
 */
export function ProductFormDialog({
  open,
  onClose,
  categories,
  heroSlots,
}: ProductFormDialogProps) {
  const router = useRouter();

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [pendingStatus, setPendingStatus] = useState<'DRAFT' | 'PUBLISHED' | null>(null);

  const slugTouchedRef = useRef(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
  });

  const nameValue = watch('name');
  const isFeaturedValue = watch('isFeatured');
  const heroOrderValue = watch('heroOrder');
  const isSubmitting = phase === 'uploading';

  // The collage only renders three layers. Featuring a fourth is allowed, but
  // the admin is told it will sit in reserve until an order puts it in range.
  const heroOrderNumber = heroOrderValue === '' ? heroSlots.nextOrder : Number(heroOrderValue);
  const heroSlotsFull = heroSlots.remaining === 0;
  const heroWillBeVisible = !heroSlotsFull || heroOrderNumber <= HERO_SLOT_COUNT;

  // Mirror the name into the slug until an admin edits the slug by hand.
  useEffect(() => {
    if (!slugTouchedRef.current) {
      setValue('slug', slugify(nameValue ?? ''), { shouldValidate: false });
    }
  }, [nameValue, setValue]);

  // Ticking "featured" with no order yet suggests the next free slot, so the
  // common case needs no second decision.
  useEffect(() => {
    if (isFeaturedValue && heroOrderValue === '') {
      setValue('heroOrder', String(heroSlots.nextOrder), { shouldValidate: false });
    }
  }, [isFeaturedValue, heroOrderValue, heroSlots.nextOrder, setValue]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  // Abort an in-flight upload if the dialog unmounts underneath it.
  useEffect(() => {
    return () => xhrRef.current?.abort();
  }, []);

  const resetAll = () => {
    reset(DEFAULT_VALUES);
    slugTouchedRef.current = false;
    setThumbnail(null);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    setDigitalFile(null);
    setFileError(null);
    setFormError(null);
    setProgress(0);
    setPhase('idle');
    setPendingStatus(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetAll();
    onClose();
  };

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;

    if (!IMAGE_MIME_TYPES.includes(selected.type)) {
      setFileError('Thumbnail harus JPG, PNG, WebP, atau AVIF.');
      return;
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      setFileError('Ukuran thumbnail maksimal 5 MB.');
      return;
    }

    setFileError(null);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnail(selected);
    setThumbnailPreview(URL.createObjectURL(selected));
  };

  const handleDigitalFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;

    if (selected.size > MAX_PRODUCT_FILE_BYTES) {
      setFileError('Ukuran file produk maksimal 200 MB.');
      return;
    }

    setFileError(null);
    setDigitalFile(selected);
  };

  const submitWithStatus = (status: 'DRAFT' | 'PUBLISHED') =>
    handleSubmit((values) => sendForm(values, status))();

  const sendForm = (values: ProductFormValues, status: 'DRAFT' | 'PUBLISHED') =>
    new Promise<void>((resolve) => {
      setFormError(null);

      if (!digitalFile) {
        setFileError('File produk digital wajib diunggah.');
        resolve();
        return;
      }

      const payload = new FormData();
      payload.append('name', values.name);
      payload.append('slug', values.slug);
      payload.append('categoryId', values.categoryId);
      payload.append('license', values.license);
      payload.append('description', values.description);
      payload.append('price', values.price);
      payload.append('salePrice', values.salePrice);
      payload.append('version', values.version);
      payload.append('downloadPolicy', values.downloadPolicy);
      payload.append('changelog', values.changelog);
      payload.append('status', status);
      payload.append('isFeatured', String(values.isFeatured));
      // An unset order is sent as 0, which sorts ahead of the numbered slots.
      // Only meaningful when featured, and the server ignores it otherwise.
      payload.append('heroOrder', values.isFeatured ? values.heroOrder || '0' : '0');
      payload.append('digitalFile', digitalFile);
      if (thumbnail) payload.append('thumbnail', thumbnail);

      // XHR rather than fetch: it is the only way to read real upload progress,
      // which matters when the deliverable is a large archive.
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      setPhase('uploading');
      setPendingStatus(status);
      setProgress(0);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onerror = () => {
        setPhase('idle');
        setPendingStatus(null);
        setFormError('Koneksi terputus saat mengunggah. Coba lagi.');
        resolve();
      };

      xhr.onabort = () => {
        setPhase('idle');
        setPendingStatus(null);
        resolve();
      };

      xhr.onload = () => {
        xhrRef.current = null;
        let data: {
          success?: boolean;
          error?: string;
          fieldErrors?: Record<string, string>;
        } = {};
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = {};
        }

        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          setPhase('success');
          setProgress(100);
          // Re-fetch the server component so the table shows the new row.
          router.refresh();
          window.setTimeout(() => {
            resetAll();
            onClose();
            resolve();
          }, 900);
          return;
        }

        setPhase('idle');
        setPendingStatus(null);

        if (data.fieldErrors) {
          for (const [field, message] of Object.entries(data.fieldErrors)) {
            if (field === 'thumbnail' || field === 'digitalFile') {
              setFileError(message);
            } else {
              setError(field as keyof ProductFormValues, { type: 'server', message });
            }
          }
        }
        setFormError(data.error ?? 'Gagal menyimpan produk. Coba lagi.');
        resolve();
      };

      xhr.open('POST', '/api/admin/products');
      xhr.send(payload);
    });

  const footer = (
    <div className="flex flex-col gap-3">
      {phase === 'uploading' && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-[#686660]">
            <span>Mengunggah aset produk</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E2D9]">
            <div
              className="h-full rounded-full bg-[#6657E8] transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#686660] transition-colors hover:bg-[#F4F1EA] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>

        <button
          type="button"
          onClick={() => submitWithStatus('DRAFT')}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#E5E2D9] bg-white px-4 py-2.5 text-xs font-semibold text-[#111111] transition-colors hover:border-[#6657E8] hover:text-[#6657E8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting && pendingStatus === 'DRAFT' && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <span>Simpan sebagai Draft</span>
        </button>

        <button
          type="button"
          onClick={() => submitWithStatus('PUBLISHED')}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#6657E8] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#5244D2] active:bg-[#4839BD] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting && pendingStatus === 'PUBLISHED' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          <span>Publikasikan Produk</span>
        </button>
      </div>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onClose={handleClose}
      surface="admin"
      size="lg"
      dismissible={!isSubmitting}
      title="Tambah Produk Baru"
      description="Lengkapi detail produk, unggah preview dan file digitalnya, lalu simpan sebagai draft atau langsung publikasikan."
      footer={footer}
    >
      {phase === 'success' ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-[#187A4A]" />
          <h3 className="text-base font-semibold text-[#111111]">Produk berhasil dibuat</h3>
          <p className="text-xs text-[#686660]">Tabel produk sedang diperbarui.</p>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={(event) => event.preventDefault()} noValidate>
          {formError && (
            <div className="flex items-start gap-3 rounded-2xl border border-[#B42318]/20 bg-[#B42318]/10 p-4 text-xs text-[#B42318]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <section className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#6657E8]">
              Detail Produk
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS} htmlFor="product-name">
                  Nama Produk *
                </label>
                <input
                  id="product-name"
                  type="text"
                  placeholder="cth: Lumina Design System"
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  aria-invalid={Boolean(errors.name)}
                  {...register('name')}
                />
                {errors.name && <p className={ERROR_CLASS}>{errors.name.message}</p>}
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor="product-slug">
                  Slug URL *
                </label>
                <input
                  id="product-slug"
                  type="text"
                  placeholder="lumina-design-system"
                  disabled={isSubmitting}
                  className={`${INPUT_CLASS} font-mono`}
                  aria-invalid={Boolean(errors.slug)}
                  {...register('slug', {
                    onChange: () => {
                      slugTouchedRef.current = true;
                    },
                  })}
                />
                {errors.slug && <p className={ERROR_CLASS}>{errors.slug.message}</p>}
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor="product-category">
                  Kategori *
                </label>
                <select
                  id="product-category"
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  aria-invalid={Boolean(errors.categoryId)}
                  {...register('categoryId')}
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className={ERROR_CLASS}>{errors.categoryId.message}</p>}
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor="product-license">
                  Lisensi *
                </label>
                <select
                  id="product-license"
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  {...register('license')}
                >
                  {LICENSE_OPTIONS.map((license) => (
                    <option key={license} value={license}>
                      {license}
                    </option>
                  ))}
                </select>
                {errors.license && <p className={ERROR_CLASS}>{errors.license.message}</p>}
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="product-description">
                Deskripsi *
              </label>
              <textarea
                id="product-description"
                rows={4}
                placeholder="Jelaskan isi produk, siapa penggunanya, dan apa yang didapat pembeli."
                disabled={isSubmitting}
                className={`${INPUT_CLASS} resize-y leading-relaxed`}
                aria-invalid={Boolean(errors.description)}
                {...register('description')}
              />
              {errors.description && <p className={ERROR_CLASS}>{errors.description.message}</p>}
            </div>
          </section>

          <section className="space-y-4 border-t border-[#E5E2D9] pt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#6657E8]">
              Harga
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS} htmlFor="product-price">
                  Harga Normal (Rp) *
                </label>
                <input
                  id="product-price"
                  type="text"
                  inputMode="numeric"
                  placeholder="249000"
                  disabled={isSubmitting}
                  className={`${INPUT_CLASS} tabular-nums`}
                  aria-invalid={Boolean(errors.price)}
                  {...register('price')}
                />
                {errors.price && <p className={ERROR_CLASS}>{errors.price.message}</p>}
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor="product-sale-price">
                  Harga Promo (Rp)
                </label>
                <input
                  id="product-sale-price"
                  type="text"
                  inputMode="numeric"
                  placeholder="Kosongkan jika tidak ada promo"
                  disabled={isSubmitting}
                  className={`${INPUT_CLASS} tabular-nums`}
                  aria-invalid={Boolean(errors.salePrice)}
                  {...register('salePrice')}
                />
                {errors.salePrice && <p className={ERROR_CLASS}>{errors.salePrice.message}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-[#E5E2D9] pt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#6657E8]">
              Aset Digital
            </h3>

            {fileError && (
              <div className="flex items-start gap-3 rounded-xl border border-[#B42318]/20 bg-[#B42318]/10 p-3.5 text-xs text-[#B42318]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            <div>
              <span className={LABEL_CLASS}>Thumbnail / Preview</span>
              {thumbnailPreview ? (
                <div className="flex items-center gap-4 rounded-xl border border-[#E5E2D9] bg-white p-3">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-[#F4F1EA]">
                    <Image
                      src={thumbnailPreview}
                      alt="Pratinjau thumbnail produk"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-[#111111]">
                      {thumbnail?.name}
                    </span>
                    <span className="text-[11px] text-[#686660]">
                      {formatBytes(thumbnail?.size ?? 0)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
                      setThumbnail(null);
                      setThumbnailPreview(null);
                    }}
                    disabled={isSubmitting}
                    aria-label="Hapus thumbnail"
                    className="rounded-lg p-1.5 text-[#B42318] transition-colors hover:bg-[#B42318]/10 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5E2D9] bg-[#F8F6F0]/60 p-6 text-center transition-colors hover:border-[#6657E8] hover:bg-[#6657E8]/5">
                  <ImagePlus className="mb-2 h-7 w-7 text-[#6657E8]" />
                  <span className="text-xs font-semibold text-[#111111]">
                    Pilih gambar preview produk
                  </span>
                  <span className="mt-1 text-[11px] text-[#686660]">
                    JPG, PNG, WebP, atau AVIF (maks 5 MB)
                  </span>
                  <input
                    type="file"
                    accept={IMAGE_MIME_TYPES.join(',')}
                    onChange={handleThumbnailChange}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <span className={LABEL_CLASS}>File Produk Digital *</span>
              {digitalFile ? (
                <div className="flex items-center gap-4 rounded-xl border border-[#E5E2D9] bg-white p-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#6657E8]/10">
                    <FileArchive className="h-5 w-5 text-[#6657E8]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-[#111111]">
                      {digitalFile.name}
                    </span>
                    <span className="text-[11px] text-[#686660]">
                      {formatBytes(digitalFile.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDigitalFile(null)}
                    disabled={isSubmitting}
                    aria-label="Hapus file produk"
                    className="rounded-lg p-1.5 text-[#B42318] transition-colors hover:bg-[#B42318]/10 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5E2D9] bg-[#F8F6F0]/60 p-6 text-center transition-colors hover:border-[#6657E8] hover:bg-[#6657E8]/5">
                  <UploadCloud className="mb-2 h-7 w-7 text-[#6657E8]" />
                  <span className="text-xs font-semibold text-[#111111]">
                    Pilih file yang akan diterima pembeli
                  </span>
                  <span className="mt-1 text-[11px] text-[#686660]">
                    ZIP, RAR, 7z, atau PDF (maks 200 MB)
                  </span>
                  <input
                    type="file"
                    accept=".zip,.rar,.7z,.pdf"
                    onChange={handleDigitalFileChange}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </section>

          <section className="space-y-4 border-t border-[#E5E2D9] pt-6">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#6657E8]">
                Tampilan Hero Beranda
              </h3>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#686660]">
                Beranda menampilkan {HERO_SLOT_COUNT} produk unggulan dalam kolase hero, diurutkan
                dari angka terkecil. Thumbnail di atas dipakai sebagai gambar preview-nya.
              </p>
            </div>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                isFeaturedValue
                  ? 'border-[#6657E8] bg-[#6657E8]/5'
                  : 'border-[#E5E2D9] bg-[#F8F6F0]/60 hover:border-[#6657E8]'
              }`}
            >
              <input
                type="checkbox"
                disabled={isSubmitting}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#6657E8]"
                {...register('isFeatured')}
              />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-[#111111]">
                  Jadikan produk unggulan di hero
                </span>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#686660]">
                  {heroSlotsFull
                    ? `${HERO_SLOT_COUNT} slot hero sudah terpakai. Produk ini masuk daftar cadangan sampai urutannya lebih kecil dari produk yang sedang tampil.`
                    : `${heroSlots.remaining} dari ${HERO_SLOT_COUNT} slot hero masih tersedia.`}
                </span>
              </span>
            </label>

            {isFeaturedValue && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLASS} htmlFor="product-hero-order">
                    Urutan di Hero
                  </label>
                  <input
                    id="product-hero-order"
                    type="text"
                    inputMode="numeric"
                    placeholder={String(heroSlots.nextOrder)}
                    disabled={isSubmitting}
                    className={`${INPUT_CLASS} tabular-nums`}
                    aria-invalid={Boolean(errors.heroOrder)}
                    aria-describedby="product-hero-order-help"
                    {...register('heroOrder')}
                  />
                  {errors.heroOrder ? (
                    <p className={ERROR_CLASS}>{errors.heroOrder.message}</p>
                  ) : (
                    <p id="product-hero-order-help" className="mt-1.5 text-[11px] text-[#686660]">
                      Angka lebih kecil tampil lebih dulu. 1 mengisi layer utama di tengah kolase.
                    </p>
                  )}
                </div>

                <div
                  className={`flex items-start gap-2.5 rounded-xl p-3.5 text-[11px] leading-relaxed ${
                    heroWillBeVisible
                      ? 'bg-[#187A4A]/10 text-[#187A4A]'
                      : 'bg-[#9A6000]/10 text-[#9A6000]'
                  }`}
                >
                  {heroWillBeVisible ? (
                    <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>
                    {heroWillBeVisible
                      ? 'Produk ini akan tampil di kolase hero setelah dipublikasikan.'
                      : `Urutan di luar ${HERO_SLOT_COUNT} slot pertama. Produk tetap tersimpan sebagai unggulan, tapi belum tampil di hero.`}
                  </span>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4 border-t border-[#E5E2D9] pt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#6657E8]">
              Versi &amp; Pengiriman
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS} htmlFor="product-version">
                  Versi Rilis *
                </label>
                <input
                  id="product-version"
                  type="text"
                  placeholder="1.0.0"
                  disabled={isSubmitting}
                  className={`${INPUT_CLASS} font-mono`}
                  aria-invalid={Boolean(errors.version)}
                  {...register('version')}
                />
                {errors.version && <p className={ERROR_CLASS}>{errors.version.message}</p>}
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor="product-download-policy">
                  Batas Unduhan *
                </label>
                <select
                  id="product-download-policy"
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  {...register('downloadPolicy')}
                >
                  {DOWNLOAD_POLICIES.map((policy) => (
                    <option key={policy.value} value={policy.value}>
                      {policy.label}
                    </option>
                  ))}
                </select>
                {errors.downloadPolicy && (
                  <p className={ERROR_CLASS}>{errors.downloadPolicy.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="product-changelog">
                Changelog (Opsional)
              </label>
              <textarea
                id="product-changelog"
                rows={3}
                placeholder="cth: Rilis pertama dengan 120 komponen dan panduan penggunaan."
                disabled={isSubmitting}
                className={`${INPUT_CLASS} resize-y leading-relaxed`}
                {...register('changelog')}
              />
              {errors.changelog && <p className={ERROR_CLASS}>{errors.changelog.message}</p>}
            </div>

            <p className="rounded-xl bg-[#F4F1EA] p-3.5 text-[11px] leading-relaxed text-[#686660]">
              Status publikasi ditentukan oleh tombol di bawah. Draft tidak tampil di katalog,
              produk yang dipublikasikan langsung dapat dibeli.
            </p>
          </section>
        </form>
      )}
    </ResponsiveDialog>
  );
}
