'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils/cn';
import { CustomerUtilityNav } from './CustomerUtilityNav';

/** How far down the page the header switches to its condensed treatment. */
const SCROLLED_THRESHOLD = 24;

export function Header() {
  const { totalItems, setIsOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const frameRef = useRef<number | null>(null);

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/products', label: 'Katalog' },
    { href: '/orders', label: 'Pesanan Saya' },
    { href: '/track-order', label: 'Lacak Pesanan' },
    { href: '/faq', label: 'FAQ' },
  ];

  // Only the background, border, and shadow change, never the height, so the
  // page content below never shifts. Lenis moves the real scroll position, so
  // the native listener stays correct with smooth scrolling on.
  useEffect(() => {
    const read = () => {
      frameRef.current = null;
      setScrolled(window.scrollY > SCROLLED_THRESHOLD);
    };

    const onScroll = () => {
      // One state write per frame at most, whatever the wheel is doing.
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // A route change while the sheet is open would otherwise leave it covering
  // the new page.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      data-scrolled={scrolled ? '' : undefined}
      className={cn(
        'sticky top-0 z-40 font-sans',
        'border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out',
        scrolled
          ? 'border-[#DAD6CD] bg-[#F8F6F0]/85 shadow-[0_1px_24px_-16px_rgba(17,17,17,0.5)] backdrop-blur-xl'
          : 'border-transparent bg-[#F8F6F0]/95 backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 md:px-12">
        {/* Left: Brand Identity */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111111] font-serif text-xl font-bold text-[#F8F6F0] transition-[background-color,scale] duration-300 group-hover:bg-[#6657E8] group-active:scale-95">
            A
          </div>
          <span className="hidden font-serif text-2xl font-bold tracking-tight text-[#111111] sm:inline">
            Digital Atelier
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden items-center gap-5 text-xs font-semibold tracking-wide text-[#686660] lg:flex xl:gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group/nav relative py-1 transition-colors',
                  isActive ? 'font-bold text-[#111111]' : 'hover:text-[#111111]',
                )}
              >
                {link.label}
                {/*
                  One rule for both states: the active link keeps the bar, hover
                  wipes it in from the left. Scaling a span costs no layout, so
                  the nav never nudges its neighbours.
                */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute bottom-0 left-0 right-0 h-0.5 origin-left rounded-full bg-[#6657E8]',
                    'transition-transform duration-300 ease-out motion-reduce:transition-none',
                    isActive ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100',
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right: Search & Cart Utility */}
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className={cn(
              'group/search hidden items-center gap-2 rounded-full border border-[#E5E2D9] px-4 py-2 text-xs font-semibold text-[#111111] sm:flex',
              'transition-[background-color,border-color,scale] duration-200',
              'hover:border-[#DAD6CD] hover:bg-white active:scale-[0.97]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]',
            )}
          >
            <Search className="h-3.5 w-3.5 text-[#686660] transition-colors group-hover/search:text-[#6657E8]" />
            <span className="hidden sm:inline">Cari</span>
          </Link>

          <CustomerUtilityNav />

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={cn(
              'relative cursor-pointer rounded-full border border-[#E5E2D9] bg-white p-2.5 text-[#111111]',
              'transition-[background-color,border-color,scale] duration-200',
              'hover:border-[#CFC8F5] hover:bg-[#E8E4FF] active:scale-[0.94]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]',
            )}
            aria-label="Buka Keranjang"
          >
            <ShoppingBag className="h-4 w-4 text-[#111111]" />
            {totalItems > 0 && (
              <span
                // Keyed on the count so a change replays the pop instead of
                // silently swapping the number.
                key={totalItems}
                className="motion-badge-pop absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#6657E8] text-[10px] font-bold text-white shadow-xs"
              >
                {totalItems}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-[#111111] transition-[background-color,scale] duration-200 active:scale-90 lg:hidden"
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="storefront-mobile-nav"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="storefront-mobile-nav"
          className="motion-fade-down space-y-4 border-b border-[#E5E2D9] bg-[#F8F6F0] px-6 py-6 lg:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-[#111111] transition-colors active:text-[#6657E8]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
