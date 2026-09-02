'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/invoice';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  license: string;
}

function CheckoutFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const singleProductId = searchParams.get('product');

  const [items, setItems] = useState<ProductItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [idempotencyKey] = useState(() => `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    if (singleProductId) {
      fetch(`/api/products/${singleProductId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.product) {
            setItems([
              {
                id: data.product.id,
                name: data.product.name,
                price: data.product.price,
                salePrice: data.product.salePrice,
                license: data.product.license,
              },
            ]);
          }
        })
        .catch(() => {
          setItems([
            {
              id: singleProductId,
              name: 'Lumina Design System & UI Kit',
              price: 249000,
              salePrice: 199000,
              license: 'Personal License',
            },
          ]);
        });
    } else {
      try {
        const savedCart = localStorage.getItem('webstore_guest_cart_v1');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (parsed.length > 0) {
            setItems(
              parsed.map((i: any) => ({
                id: i.productId,
                name: i.name,
                price: i.price,
                salePrice: i.salePrice,
                license: i.license,
              }))
            );
          }
        }
      } catch {}
    }
  }, [singleProductId]);

  const subtotal = items.reduce((sum, item) => sum + (item.salePrice ?? item.price), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Keranjang belanja kosong. Silakan pilih produk terlebih dahulu.');
      return;
    }

    if (!agreeTerms) {
      setError('Kamu harus menyetujui Syarat & Ketentuan Pembelian.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerWhatsapp,
          items: items.map((i) => ({ productId: i.id })),
          couponCode: couponCode || undefined,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses checkout');
      }

      try {
        localStorage.removeItem('webstore_guest_cart_v1');
      } catch {}

      router.push(data.paymentUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan pada server';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      {/* Left Form (7 Cols) */}
      <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-[#DAD6CD] shadow-sm space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#111111]">Informasi Pembeli</h1>
          <p className="text-xs text-[#686660] mt-1">
            Isi data berikut untuk menerima instruksi pembayaran dan link akses file digital.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-[#B42318]/10 border border-[#B42318]/20 rounded-2xl flex items-center gap-3 text-xs text-[#B42318]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1.5">
              Nama Lengkap *
            </label>
            <input
              type="text"
              required
              placeholder="cth: Faishal R."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1.5">
              Alamat Email (Untuk Pengiriman File) *
            </label>
            <input
              type="email"
              required
              placeholder="cth: faishal@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1.5">
              Nomor WhatsApp *
            </label>
            <input
              type="tel"
              required
              placeholder="cth: 08123456789"
              value={customerWhatsapp}
              onChange={(e) => setCustomerWhatsapp(e.target.value)}
              className="w-full px-4 py-3 bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1.5">
              Kode Promo (Opsional)
            </label>
            <input
              type="text"
              placeholder="cth: DISKON10"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full px-4 py-3 bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-[#686660] cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded text-[#6657E8] focus:ring-[#6657E8]"
              />
              <span>
                Saya menyetujui <a href="/terms" target="_blank" className="underline text-[#111111]">Syarat & Ketentuan</a> dan Kebijakan Lisensi Digital.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || items.length === 0}
            className="w-full py-4 bg-[#6657E8] hover:bg-[#5244d2] disabled:opacity-50 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-md mt-6 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Membuat Pesanan...</span>
              </>
            ) : (
              <>
                <span>Buat Pesanan & Bayar QRIS</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Summary (5 Cols) */}
      <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-[#DAD6CD] shadow-sm space-y-6">
        <h2 className="font-serif text-xl font-bold text-[#111111]">Ringkasan Pesanan</h2>

        <div className="space-y-3 divide-y divide-[#DAD6CD]">
          {items.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-[#111111] block">{item.name}</span>
                <span className="text-[11px] text-[#686660]">{item.license}</span>
              </div>
              <span className="font-bold text-xs text-[#111111] tabular-nums">
                {formatRupiah(item.salePrice ?? item.price)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#DAD6CD] space-y-2 text-xs text-[#686660]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium text-[#111111] tabular-nums">{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-base text-[#111111] pt-2 border-t border-[#DAD6CD]">
            <span>Total Tagihan</span>
            <span className="text-[#6657E8] tabular-nums">{formatRupiah(subtotal)}</span>
          </div>
        </div>

        <div className="p-4 bg-[#F4F1EA] rounded-2xl flex items-center gap-3 text-xs text-[#686660]">
          <ShieldCheck className="w-5 h-5 text-[#187A4A] shrink-0" />
          <span>QRIS Statis disajikan langsung di halaman berikutnya setelah order dibuat.</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#F4F1EA] py-12 px-6 md:px-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-[#DAD6CD] pb-6">
          <Link href="/" className="font-serif text-2xl font-bold text-[#111111]">
            Digital Atelier
          </Link>
          <span className="text-xs font-semibold text-[#6657E8] bg-[#E8E4FF] px-3 py-1 rounded-full">
            Guest Checkout Aman
          </span>
        </div>

        <Suspense fallback={<div className="p-12 text-center text-xs text-[#686660]">Loading checkout form...</div>}>
          <CheckoutFormContent />
        </Suspense>
      </div>
    </div>
  );
}
