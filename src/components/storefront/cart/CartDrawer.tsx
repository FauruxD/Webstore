'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatRupiah } from '@/lib/utils/invoice';
import { acquireScrollLock, releaseScrollLock } from '@/lib/scroll/scroll-lock';

export function CartDrawer() {
  const { items, removeItem, clearCart, isOpen, setIsOpen, subtotal } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // The drawer scrolls its own item list, so the page behind it must hold
  // still. Smooth scrolling reads the same registry and stops with it.
  useEffect(() => {
    if (!isOpen) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    acquireScrollLock();

    return () => {
      body.style.overflow = previousOverflow;
      releaseScrollLock();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    if (!couponCode.trim()) return;

    try {
      // Client-side quick check
      if (couponCode.toUpperCase() === 'DISKON10') {
        const disc = Math.round((subtotal * 10) / 100);
        setDiscount(disc);
        setCouponSuccess('Kode promo DISKON10 berhasil diterapkan (Diskon 10%)!');
      } else {
        setDiscount(0);
        setCouponError('Kode promo tidak valid atau telah kedaluwarsa');
      }
    } catch {
      setCouponError('Gagal memverifikasi kode promo');
    }
  };

  const finalTotal = Math.max(0, subtotal - discount);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="motion-dialog-backdrop fixed inset-0 bg-black/50 backdrop-blur-xs"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="motion-drawer-in relative z-10 flex h-full w-full max-w-md flex-col bg-[#F4F1EA] shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-white border-b border-[#DAD6CD] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-[#6657E8]" />
            <h2 className="font-semibold text-lg text-[#111111]">Keranjang Belanja</h2>
            <span className="text-xs bg-[#E8E4FF] text-[#6657E8] font-bold px-2 py-0.5 rounded-full">
              {items.length} item
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup Keranjang"
            className="rounded-lg p-1.5 text-[#686660] transition-[background-color,scale] duration-200 hover:bg-[#F4F1EA] active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ShoppingBag className="w-12 h-12 text-[#686660]/40 mx-auto" />
              <p className="font-medium text-[#111111]">Keranjang kamu masih kosong</p>
              <p className="text-xs text-[#686660]">Jelajahi katalog dan temukan produk favoritmu.</p>
              <Link
                href="/products"
                onClick={() => setIsOpen(false)}
                className="inline-block mt-4 text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#111111] text-white hover:bg-[#6657E8] transition-colors"
              >
                Lihat Katalog Produk
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const activePrice = item.salePrice ?? item.price;
              return (
                <div
                  key={item.productId}
                  className="bg-white border border-[#DAD6CD] rounded-xl p-3.5 flex gap-3.5 items-center"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#111111]/5 shrink-0">
                    <Image
                      src={
                        item.imageUrl ||
                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-[#111111] truncate">{item.name}</h4>
                    <span className="text-[11px] text-[#686660] block">{item.license}</span>
                    <span className="font-bold text-sm text-[#111111] tabular-nums mt-1 block">
                      {formatRupiah(activePrice)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="p-2 text-[#B42318] hover:bg-[#B42318]/10 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-[#DAD6CD] space-y-4">
            {/* Promo Form */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-[#686660] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Kode Promo (cth: DISKON10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F4F1EA] border border-[#DAD6CD] rounded-xl focus:outline-none focus:border-[#6657E8]"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#111111] text-white text-xs font-semibold rounded-xl hover:bg-[#6657E8] transition-colors"
              >
                Gunakan
              </button>
            </form>

            {couponError && <p className="text-[11px] text-[#B42318]">{couponError}</p>}
            {couponSuccess && <p className="text-[11px] text-[#187A4A]">{couponSuccess}</p>}

            {/* Totals */}
            <div className="space-y-1.5 text-xs text-[#686660] pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-[#111111] tabular-nums">
                  {formatRupiah(subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#187A4A]">
                  <span>Diskon Promo</span>
                  <span className="font-medium tabular-nums">-{formatRupiah(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-[#111111] pt-2 border-t border-[#DAD6CD]">
                <span>Total Bayar</span>
                <span className="text-[#6657E8] tabular-nums">{formatRupiah(finalTotal)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#6657E8] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-[background-color,scale] duration-200 hover:bg-[#5244d2] active:scale-[0.98]"
            >
              <span>Lanjut ke Guest Checkout</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
