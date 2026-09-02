import React from 'react';
import '@/app/globals.css';
import type { Metadata } from 'next';
import { Manrope, Bodoni_Moda } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Digital Atelier | Webstore Produk Digital',
  description: 'Curated digital assets, UI kits, templates, and boilerplates for creators and builders.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The storefront intro gate script sets `data-intro` on <html> before
    // hydration to block a homepage flash. Suppressing keeps React from
    // reporting that deliberate pre-hydration attribute as a mismatch.
    <html
      lang="id"
      suppressHydrationWarning
      className={`${manrope.variable} ${bodoniModa.variable}`}
    >
      <body className="font-sans antialiased text-[#111111] bg-[#F8F6F0] selection:bg-[#6657E8] selection:text-white">
        {children}
      </body>
    </html>
  );
}
