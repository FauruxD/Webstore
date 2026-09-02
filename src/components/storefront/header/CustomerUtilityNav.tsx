'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, LogIn, LogOut, MessageCircle, ShoppingBag, UserRound } from 'lucide-react';

interface CustomerSummary {
  displayName: string;
  email: string;
  isRegistered: boolean;
}

function CountBadge({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="motion-badge-pop absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B42318] px-1 text-[9px] font-bold text-white shadow-sm">
      {value > 99 ? '99+' : value}
    </span>
  );
}

export function CustomerUtilityNav() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [counts, setCounts] = useState({ messages: 0, notifications: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setMenuOpen(false);

    const load = async () => {
      try {
        const sessionResponse = await fetch('/api/customer/auth/session', { cache: 'no-store' });
        if (!sessionResponse.ok) return;
        const sessionData = (await sessionResponse.json()) as { customer: CustomerSummary | null };
        if (!active) return;
        setCustomer(sessionData.customer);

        if (!sessionData.customer) {
          setCounts({ messages: 0, notifications: 0 });
          return;
        }

        const badgeResponse = await fetch('/api/customer/badges', { cache: 'no-store' });
        if (!badgeResponse.ok || !active) return;
        setCounts(await badgeResponse.json());
      } catch {
        if (active) setCustomer(null);
      }
    };

    void load();
    const timer = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const itemClass = 'relative rounded-full border border-[#E5E2D9] bg-white p-2.5 text-[#111111] transition-[background-color,border-color,transform] hover:border-[#CFC8F5] hover:bg-[#E8E4FF] active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]';

  return (
    <>
      {customer && (
        <>
          <Link href="/messages" className={itemClass} aria-label="Buka pesan pelanggan">
            <MessageCircle className="h-4 w-4" />
            <CountBadge value={counts.messages} />
          </Link>
          <Link href="/notifications" className={itemClass} aria-label="Buka notifikasi pelanggan">
            <Bell className="h-4 w-4" />
            <CountBadge value={counts.notifications} />
          </Link>
        </>
      )}

      {customer?.isRegistered ? (
        <div ref={menuRef} className="relative">
          <button type="button" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-controls="customer-account-menu" className="inline-flex items-center gap-2 rounded-full border border-[#E5E2D9] bg-white p-2.5 text-[#111111] transition-colors hover:border-[#CFC8F5] hover:bg-[#E8E4FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8] xl:px-3.5">
            <UserRound className="h-4 w-4" />
            <span className="hidden max-w-28 truncate text-xs font-semibold xl:block">{customer.displayName}</span>
            <ChevronDown className={`hidden h-3.5 w-3.5 transition-transform xl:block ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div id="customer-account-menu" className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-[#DAD6CD] bg-white shadow-[0_24px_60px_-32px_rgba(17,17,17,0.55)]">
              <div className="border-b border-[#E5E2D9] px-4 py-3.5"><p className="truncate text-xs font-semibold text-[#111111]">{customer.displayName}</p><p className="mt-1 truncate font-mono text-[10px] text-[#686660]">{customer.email}</p></div>
              <div className="p-2">
                <Link href="/account" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#111111] hover:bg-[#F3F0FF]"><UserRound className="h-4 w-4 text-[#6657E8]" /> Akun Saya</Link>
                <Link href="/orders" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#111111] hover:bg-[#F3F0FF]"><ShoppingBag className="h-4 w-4 text-[#6657E8]" /> Pesanan Saya</Link>
                <form action="/api/customer/auth/logout" method="POST">
                  <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#B42318] hover:bg-[#B42318]/8"><LogOut className="h-4 w-4" /> Keluar</button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-[#111111] bg-[#111111] p-2.5 text-white transition-[background-color,transform] hover:bg-[#6657E8] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8] xl:px-4" aria-label="Masuk ke akun pelanggan">
          <LogIn className="h-4 w-4" />
          <span className="hidden text-xs font-semibold xl:inline">Masuk</span>
        </Link>
      )}
    </>
  );
}
