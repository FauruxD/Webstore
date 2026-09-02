'use client';

import React, { useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  FileArchive,
  FileQuestion,
  Loader2,
  Send,
  UploadCloud,
  X,
} from 'lucide-react';

const MAX_DELIVERY_FILE_SIZE = 100 * 1024 * 1024;
const DELIVERY_ACCEPT = '.zip,.rar,.7z,.pdf,.fig,.sketch,.psd,.ai,.xd,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp4,.mov';

function fileSizeLabel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');

  const run = async (action: 'complete' | 'request-proof') => {
    let payload: Record<string, string> | undefined;
    if (action === 'request-proof') {
      const reason = window.prompt('Jelaskan bukti pembayaran baru yang diperlukan:');
      if (!reason) return;
      payload = { reason };
    }
    setBusy(action);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/${action}`, {
        method: 'POST',
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.error || 'Aksi gagal diproses');
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Aksi gagal diproses');
    } finally {
      setBusy(null);
    }
  };

  const selectDeliveryFile = (file: File | null) => {
    setError(null);
    if (file && file.size > MAX_DELIVERY_FILE_SIZE) {
      setDeliveryFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setError('Ukuran file produk maksimal 100 MB');
      return;
    }
    setDeliveryFile(file);
  };

  const clearDeliveryFile = () => {
    setDeliveryFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendProduct = async () => {
    if (!deliveryFile) {
      setError('Pilih file produk yang akan dikirim');
      return;
    }
    setBusy('send-product');
    setError(null);
    try {
      const formData = new FormData();
      formData.set('deliveryFile', deliveryFile);
      formData.set('deliveryNote', deliveryNote);
      const response = await fetch(`/api/admin/orders/${orderId}/send-product`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.error || 'Produk gagal dikirim');
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Produk gagal dikirim');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="admin-surface p-5">
      <h3 className="text-sm font-semibold text-[#111111]">Aksi Pesanan</h3>
      <p className="mt-1 text-[11px] leading-5 text-[#686660]">
        Transisi divalidasi kembali di server dan aman dipanggil ulang.
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-[#B42318]/10 p-2.5 text-[11px] text-[#B42318]">
          {error}
        </p>
      )}
      <div className="mt-4 space-y-3">
        {status === 'WAITING_VERIFICATION' && (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void run('request-proof')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DAD6CD] bg-white px-4 py-3 text-xs font-semibold text-[#111111] transition-colors hover:border-[#9A6000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] disabled:opacity-50"
          >
            {busy === 'request-proof' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileQuestion className="h-4 w-4" />}
            Minta Bukti Pembayaran Baru
          </button>
        )}

        {status === 'PAYMENT_APPROVED' && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={inputId} className="text-[11px] font-semibold text-[#111111]">File produk</label>
                <span className="text-[10px] text-[#8F8B80]">Wajib · maks. 100 MB</span>
              </div>
              {deliveryFile ? (
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#CFC8F5] bg-[#F3F0FF] p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#6657E8]">
                    <FileArchive className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-[#111111]">{deliveryFile.name}</p>
                    <p className="mt-0.5 text-[10px] text-[#686660]">{fileSizeLabel(deliveryFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearDeliveryFile}
                    aria-label="Hapus file produk terpilih"
                    className="rounded-lg p-2 text-[#686660] hover:bg-white hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative min-h-24">
                  <input
                    ref={fileInputRef}
                    id={inputId}
                    type="file"
                    accept={DELIVERY_ACCEPT}
                    onChange={(event) => selectDeliveryFile(event.target.files?.[0] || null)}
                    className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    aria-label="Pilih file produk yang akan dikirim"
                    aria-describedby={`${inputId}-hint`}
                  />
                  <div className="pointer-events-none flex min-h-24 flex-col items-center justify-center rounded-xl border border-dashed border-[#C9C4B7] bg-[#FCFBF7] px-4 py-4 text-center transition-colors peer-hover:border-[#6657E8] peer-hover:bg-[#F8F6F0] peer-focus-visible:ring-2 peer-focus-visible:ring-[#6657E8] peer-focus-visible:ring-offset-2">
                    <UploadCloud className="h-5 w-5 text-[#6657E8]" />
                    <span className="mt-2 text-[11px] font-semibold text-[#111111]">Pilih file yang akan dikirim</span>
                    <span id={`${inputId}-hint`} className="mt-1 text-[10px] leading-4 text-[#8F8B80]">ZIP, RAR, 7Z, PDF, file desain, gambar, dokumen, atau video</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor={`${inputId}-note`} className="text-[11px] font-semibold text-[#111111]">Catatan untuk pembeli</label>
              <textarea
                id={`${inputId}-note`}
                value={deliveryNote}
                onChange={(event) => setDeliveryNote(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Contoh: File berisi source, dokumentasi, dan lisensi penggunaan."
                className="w-full resize-y rounded-xl border border-[#DAD6CD] bg-white px-3.5 py-3 text-[11px] leading-5 text-[#111111] outline-none transition-colors placeholder:text-[#A39F96] focus:border-[#6657E8] focus:ring-2 focus:ring-[#6657E8]/15"
              />
              <p className="text-right text-[9px] tabular-nums text-[#A39F96]">{deliveryNote.length}/1000</p>
            </div>

            <button
              type="button"
              disabled={Boolean(busy) || !deliveryFile}
              onClick={() => void sendProduct()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6657E8] px-4 py-3 text-xs font-semibold text-white transition-[background-color,transform] hover:bg-[#5244D2] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy === 'send-product' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Kirim Produk
            </button>
          </>
        )}

        {status === 'PRODUCT_SENT' && (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void run('complete')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#187A4A] px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#11653C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#187A4A] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {busy === 'complete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Tandai Pesanan Selesai
          </button>
        )}

        {!['WAITING_VERIFICATION', 'PAYMENT_APPROVED', 'PRODUCT_SENT'].includes(status) && (
          <p className="rounded-xl bg-[#F8F6F0] p-3 text-center text-[11px] text-[#686660]">
            Tidak ada aksi status yang tersedia saat ini.
          </p>
        )}
      </div>
    </div>
  );
}
