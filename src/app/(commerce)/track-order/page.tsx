'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, AlertCircle } from 'lucide-react';

export default function TrackOrderPage() {
  const router = useRouter();
  const [invoice, setInvoice] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!invoice.trim() || !email.trim()) {
      setError('Invoice dan Email wajib diisi');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/track-order?invoice=${encodeURIComponent(invoice)}&email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Data pesanan tidak ditemukan atau email tidak sesuai');
      }

      router.push(data.orderUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Pesanan tidak ditemukan';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] py-16 px-6">
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-[#DAD6CD] shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Search className="w-10 h-10 text-[#6657E8] mx-auto" />
          <h1 className="font-serif text-2xl font-bold text-[#111111]">Lacak Pesanan Kamu</h1>
          <p className="text-xs text-[#686660]">
            Masukkan nomor invoice dan email yang digunakan saat checkout untuk mengakses halaman status & unduhan.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-[#B42318]/10 border border-[#B42318]/20 rounded-xl flex items-center gap-3 text-xs text-[#B42318]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">Nomor Invoice</label>
            <input
              type="text"
              required
              placeholder="cth: INV-20260801-XXXX"
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              className="w-full px-4 py-3 bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl text-xs font-mono text-[#111111] focus:outline-none focus:border-[#6657E8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">Email Pembeli</label>
            <input
              type="email"
              required
              placeholder="cth: email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#111111] hover:bg-[#6657E8] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Cari Pesanan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
