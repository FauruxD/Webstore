'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Loader2, Save, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QrisImageSettingsProps {
  initialFileName: string | null;
  initialImageUrl: string;
}

const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const MAX_QRIS_IMAGE_BYTES = 2 * 1024 * 1024;

export function QrisImageSettings({ initialFileName, initialImageUrl }: QrisImageSettingsProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState(initialImageUrl);
  const [previewUrl, setPreviewUrl] = useState(initialImageUrl);
  const [savedFileName, setSavedFileName] = useState(initialFileName);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setActiveImageUrl(initialImageUrl);
  }, [initialImageUrl]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(activeImageUrl);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, activeImageUrl]);

  const chooseFile = (selected: File | undefined) => {
    setFeedback(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.has(selected.type)) {
      setFile(null);
      setFeedback({ tone: 'error', message: 'Gunakan file PNG, JPG, WebP, atau SVG.' });
      return;
    }
    if (selected.size > MAX_QRIS_IMAGE_BYTES) {
      setFile(null);
      setFeedback({ tone: 'error', message: 'Ukuran gambar QRIS maksimal 2 MB.' });
      return;
    }
    setFile(selected);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || busy) return;

    setBusy(true);
    setFeedback(null);
    try {
      const body = new FormData();
      body.set('file', file);
      const response = await fetch('/api/admin/settings/payment', { method: 'POST', body });
      const result = (await response.json()) as {
        success?: boolean;
        imageUrl?: string;
        fileName?: string;
        message?: string;
        error?: string;
      };
      if (!response.ok || !result.success || !result.imageUrl) {
        throw new Error(result.error || 'Gagal menyimpan gambar QRIS.');
      }

      setActiveImageUrl(result.imageUrl);
      setPreviewUrl(result.imageUrl);
      setSavedFileName(result.fileName || file.name);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setFeedback({ tone: 'success', message: result.message || 'Gambar QRIS berhasil disimpan.' });
      router.refresh();
    } catch (cause: unknown) {
      setFeedback({
        tone: 'error',
        message: cause instanceof Error ? cause.message : 'Gagal menyimpan gambar QRIS.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#111111]">Pratinjau Kode QRIS Aktif</h2>
            <p className="mt-1 text-xs leading-5 text-[#686660]">
              Pembeli akan melihat gambar ini pada checkout dan halaman pembayaran.
            </p>
          </div>
          {savedFileName && (
            <span className="max-w-full truncate rounded-lg bg-[#F4F1EA] px-3 py-1.5 text-[11px] text-[#686660]">
              Aktif: {savedFileName}
            </span>
          )}
        </div>

        <div className="inline-block rounded-2xl border border-[#E5E2D9] bg-[#F8F6F0] p-5 sm:p-6">
          <div className="relative h-[220px] w-[220px] overflow-hidden rounded-xl bg-white p-3 shadow-xs sm:h-[260px] sm:w-[260px]">
            <Image
              src={previewUrl}
              alt="Pratinjau kode QRIS merchant"
              fill
              unoptimized
              className="object-contain p-3"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-[#E5E2D9] pt-6">
        <div>
          <label htmlFor="qris-image" className="block text-xs font-semibold text-[#111111]">
            Ganti gambar QRIS
          </label>
          <p id="qris-image-help" className="mt-1 text-[11px] leading-5 text-[#686660]">
            PNG, JPG, WebP, atau SVG aman. Maksimal 2 MB.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label
            htmlFor="qris-image"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#DAD6CD] bg-white px-4 py-2.5 text-xs font-semibold text-[#111111] transition-colors hover:border-[#6657E8] hover:text-[#6657E8] focus-within:ring-2 focus-within:ring-[#6657E8] focus-within:ring-offset-2"
          >
            <ImagePlus className="h-4 w-4" />
            Pilih Gambar QRIS
          </label>
          <input
            ref={inputRef}
            id="qris-image"
            name="file"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            aria-describedby="qris-image-help qris-image-selection"
            onChange={(event) => chooseFile(event.target.files?.[0])}
            disabled={busy}
          />
          <span id="qris-image-selection" className="min-w-0 truncate text-xs text-[#686660]">
            {file?.name || 'Belum ada file baru dipilih'}
          </span>
        </div>

        {feedback && (
          <div
            role={feedback.tone === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
              feedback.tone === 'success'
                ? 'border-[#187A4A]/20 bg-[#187A4A]/8 text-[#187A4A]'
                : 'border-[#B42318]/20 bg-[#B42318]/8 text-[#B42318]'
            }`}
          >
            {feedback.tone === 'success'
              ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-[#E5E2D9] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] leading-5 text-[#686660]">
          Perubahan berlaku langsung pada checkout setelah disimpan.
        </p>
        <button
          type="submit"
          disabled={!file || busy}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#6657E8] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#5244D2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#B8B3DF]"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Save className="h-4 w-4" />}
          {busy ? 'Menyimpan...' : 'Simpan Gambar QRIS'}
        </button>
      </div>
    </form>
  );
}
