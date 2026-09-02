import React from 'react';
import { Header } from '@/components/storefront/header/Header';
import { CartDrawer } from '@/components/storefront/cart/CartDrawer';
import { CartProvider } from '@/context/CartContext';
import { IntroPreloader } from '@/components/storefront/preloader/IntroPreloader';
import { HeroIntroEntrance } from '@/components/storefront/preloader/HeroIntroEntrance';
import { SmoothScrollProvider } from '@/components/storefront/scroll/SmoothScrollProvider';
import { ScrollRevealProvider } from '@/components/storefront/scroll/ScrollRevealProvider';
import { INTRO_GATE_SCRIPT } from '@/components/storefront/preloader/intro-config';
import { REVEAL_GATE_SCRIPT } from '@/components/storefront/scroll/reveal-config';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/*
        Inline and parser-blocking on purpose. Raises the ivory curtain before
        the storefront markup paints, so the homepage never flashes ahead of the
        intro overlay. Only ever arms itself on `/`, which keeps admin,
        checkout, payment, and order tracking untouched.
      */}
      <script
        id="atelier-intro-gate"
        dangerouslySetInnerHTML={{ __html: INTRO_GATE_SCRIPT }}
      />

      {/*
        Same idea for the scroll reveals: marks the document before paint so a
        section cannot flash at full opacity and then jump. Skips itself under
        reduced motion, and unarms after a failsafe if no provider claims it.
      */}
      <script
        id="atelier-reveal-gate"
        dangerouslySetInnerHTML={{ __html: REVEAL_GATE_SCRIPT }}
      />

      <CartProvider>
        <div className="min-h-screen flex flex-col bg-[#F4F1EA] text-[#111111]">
          {/*
            Storefront only. Never mounted under `/admin`, and the provider
            re-checks the path itself so a future shared layout cannot leak it.
          */}
          <SmoothScrollProvider />
          <ScrollRevealProvider />

          {/* Mounted ahead of the overlay so it claims the hero resting state first. */}
          <HeroIntroEntrance />
          <IntroPreloader />

          <Header />
          <main className="flex-1">{children}</main>
          <CartDrawer />
        
        {/* Footer */}
        <footer className="bg-[#111111] text-[#F4F1EA] pt-16 pb-12 border-t border-[#DAD6CD]/20">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-bold">Digital Atelier</h3>
              <p className="text-xs text-[#686660] leading-relaxed">
                Platform kurasi produk digital premium dengan transaksi QRIS cepat dan pengiriman file terenkripsi yang aman.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4">Navigasi</h4>
              <ul className="space-y-2 text-xs text-[#686660]">
                <li><a href="/products" className="hover:text-white transition-colors">Katalog Produk</a></li>
                <li><a href="/orders" className="hover:text-white transition-colors">Pesanan Saya</a></li>
                <li><a href="/track-order" className="hover:text-white transition-colors">Lacak Pesanan</a></li>
                <li><a href="/faq" className="hover:text-white transition-colors">Pertanyaan Umum (FAQ)</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-xs text-[#686660]">
                <li><a href="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
                <li><a href="/refund-policy" className="hover:text-white transition-colors">Kebijakan Pengembalian</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4">Bantuan & Kontak</h4>
              <p className="text-xs text-[#686660]">
                Jam Operasional Verifikasi:<br />
                <span className="text-white font-medium">08:00 - 22:00 WIB</span>
              </p>
            </div>
          </div>

          <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-12 mt-12 border-t border-white/10 text-center text-xs text-[#686660]">
            © {new Date().getFullYear()} Digital Atelier - FaRu Store. All rights reserved.
          </div>
        </footer>
        </div>
      </CartProvider>
    </>
  );
}
