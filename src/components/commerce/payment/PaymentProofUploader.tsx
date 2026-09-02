'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { UploadCloud, FileImage, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/invoice';

interface PaymentProofUploaderProps {
  invoice: string;
  expectedAmount: number;
  onSuccess?: () => void;
}

export function PaymentProofUploader({
  invoice,
  expectedAmount,
  onSuccess,
}: PaymentProofUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [senderName, setSenderName] = useState('');
  const [amount, setAmount] = useState<string>(String(expectedAmount));
  const [note, setNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selected.type)) {
      setError('Format file harus JPG, PNG, atau WebP.');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('Ukuran file bukti maksimal 5 MB.');
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!file) {
      setError('Pilih foto bukti pembayaran terlebih dahulu.');
      return;
    }

    if (!senderName.trim()) {
      setError('Nama pengirim wajib diisi.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('invoice', invoice);
      formData.append('senderName', senderName);
      formData.append('amount', amount);
      formData.append('paidAt', new Date().toISOString());
      if (note) formData.append('note', note);
      formData.append('proofFile', file);

      const res = await fetch('/api/payment-proof/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengunggah bukti pembayaran');
      }

      setSuccessMessage(data.message);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengirim bukti pembayaran';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-[#DAD6CD] rounded-2xl p-6 shadow-sm">
      <h3 className="font-semibold text-lg text-[#111111] mb-1">Upload Bukti Pembayaran</h3>
      <p className="text-xs text-[#686660] mb-6">
        Unggah tangkapan layar / foto bukti transfer QRIS untuk diverifikasi admin.
      </p>

      {error && (
        <div className="mb-5 p-3.5 bg-[#B42318]/10 border border-[#B42318]/20 rounded-xl flex items-center gap-3 text-xs text-[#B42318]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage ? (
        <div className="p-6 bg-[#187A4A]/10 border border-[#187A4A]/20 rounded-xl text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-[#187A4A] mx-auto" />
          <h4 className="font-semibold text-base text-[#187A4A]">Bukti Pembayaran Terkirim!</h4>
          <p className="text-xs text-[#187A4A]/90">{successMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File Upload Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-2">Foto / Screenshot Bukti</label>
            {previewUrl ? (
              <div className="relative rounded-xl border border-[#DAD6CD] p-3 flex items-center gap-4 bg-[#F4F1EA]">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-white">
                  <Image src={previewUrl} alt="Preview Bukti" fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-xs text-[#111111] block truncate">
                    {file?.name}
                  </span>
                  <span className="text-[11px] text-[#686660]">
                    {((file?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg hover:bg-white text-[#B42318]"
                  title="Ganti Foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#DAD6CD] hover:border-[#6657E8] bg-[#F4F1EA]/50 hover:bg-[#E8E4FF]/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                <UploadCloud className="w-8 h-8 text-[#6657E8] mb-2" />
                <span className="text-xs font-semibold text-[#111111]">Pilih foto atau drag & drop file di sini</span>
                <span className="text-[11px] text-[#686660] mt-1">Format JPG, PNG, atau WebP (Maks 5 MB)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Form Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                Nama Pengirim di Rekening/E-Wallet
              </label>
              <input
                type="text"
                required
                placeholder="cth: Faishal R."
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                Nominal Transfer (Rp)
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl text-xs text-[#111111] font-mono focus:outline-none focus:border-[#6657E8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1.5">
              Catatan Opsional untuk Admin
            </label>
            <input
              type="text"
              placeholder="cth: Pembayaran via GoPay / Bank BCA"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading || !file}
            className="w-full py-3 bg-[#6657E8] hover:bg-[#5244d2] disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengunggah Bukti...</span>
              </>
            ) : (
              <span>Kirim Bukti Pembayaran</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
