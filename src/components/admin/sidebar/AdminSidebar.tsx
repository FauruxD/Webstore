'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  CheckCircle2,
  Package,
  FolderTree,
  Users,
  Ticket,
  FileArchive,
  BarChart3,
  Activity,
  Settings,
  Store,
  QrCode,
  PanelLeftClose,
  PanelLeft,
  X,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type SidebarMode = 'expanded' | 'collapsed';

interface NavChild {
  id: string;
  label: string;
  href: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number | string;
  /** Real sub-routes, drawn indented against a vertical guide rail. */
  children?: NavChild[];
  external?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/** Groups above the flexible gap. These scroll when the viewport is short. */
const NAV_SECTIONS: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { id: 'orders', label: 'Pesanan', href: '/admin/orders', icon: ShoppingBag },
      { id: 'messages', label: 'Pesan', href: '/admin/messages', icon: MessageSquare },
      { id: 'products', label: 'Produk', href: '/admin/products', icon: Package },
      { id: 'categories', label: 'Kategori', href: '/admin/categories', icon: FolderTree },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      {
        id: 'verifications',
        label: 'Verifikasi',
        href: '/admin/verifications',
        icon: CheckCircle2,
        badge: 'Perlu Aksi',
      },
      { id: 'customers', label: 'Pelanggan', href: '/admin/customers', icon: Users },
      { id: 'coupons', label: 'Kupon', href: '/admin/coupons', icon: Ticket },
      { id: 'files', label: 'Berkas', href: '/admin/files', icon: FileArchive },
      { id: 'reports', label: 'Laporan', href: '/admin/reports', icon: BarChart3 },
      { id: 'activity', label: 'Audit Log', href: '/admin/activity', icon: Activity },
    ],
  },
];

/** Pinned to the bottom of the rail, after the flexible gap. */
const SETTINGS_SECTION: NavSection = {
  title: 'SETTINGS',
  items: [
    {
      id: 'settings',
      label: 'Pengaturan',
      href: '/admin/settings/store',
      icon: Settings,
      children: [
        { id: 'settings-store', label: 'Profil Toko', href: '/admin/settings/store' },
        { id: 'settings-payment', label: 'Pembayaran QRIS', href: '/admin/settings/payment' },
      ],
    },
    {
      id: 'storefront',
      label: 'Lihat Storefront',
      href: '/',
      icon: ExternalLink,
      external: true,
    },
  ],
};

const ALL_SECTIONS = [...NAV_SECTIONS, SETTINGS_SECTION];

/** Active row: white card on the near-white rail, held by a hairline and a low shadow. */
const ACTIVE_ITEM =
  'bg-white border-[#E5E2D9] text-[#111111] shadow-[0_1px_1px_rgba(17,17,17,0.03),0_6px_16px_-10px_rgba(17,17,17,0.22)]';
const IDLE_ITEM = 'border-transparent text-[#686660] hover:bg-[#F1EDE3] hover:text-[#111111]';
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FCFBF7]';

interface AdminSidebarProps {
  initialMode?: SidebarMode;
  pendingVerificationsCount?: number;
  initialUnreadMessagesCount?: number;
}

export function AdminSidebar({
  initialMode = 'expanded',
  pendingVerificationsCount = 0,
  initialUnreadMessagesCount = 0,
}: AdminSidebarProps) {
  const [mode, setMode] = useState<SidebarMode>(initialMode);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(initialUnreadMessagesCount);

  const toggleMode = useCallback(() => {
    setMode((current) => {
      const next: SidebarMode = current === 'expanded' ? 'collapsed' : 'expanded';
      document.cookie = `admin_sidebar_mode=${next}; path=/; max-age=31536000`;
      try {
        localStorage.setItem('admin_sidebar_mode', next);
      } catch {}
      document.documentElement.style.setProperty(
        '--sidebar-width',
        next === 'expanded' ? '264px' : '76px',
      );
      return next;
    });
  }, []);

  // Ctrl/Cmd + B toggles the rail, except while the caret is in a field.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'b') return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target?.isContentEditable) return;
      event.preventDefault();
      toggleMode();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMode]);

  // The drawer covers the page, so the page behind it must not scroll.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    let active = true;
    const loadUnread = async () => {
      try {
        const response = await fetch('/api/admin/conversations/unread-count', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (active) setUnreadMessagesCount(data.unreadCount || 0);
      } catch {}
    };
    const timer = window.setInterval(loadUnread, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const isCollapsed = mode === 'collapsed';

  const isItemActive = (item: NavItem): boolean => {
    if (item.external) return false;
    if (item.href === '/admin') return pathname === '/admin';
    if (pathname === item.href) return true;
    if (pathname?.startsWith(`${item.href}/`)) return true;
    return Boolean(item.children?.some((child) => pathname === child.href));
  };

  /** Live pending count wins over the static label once there is work waiting. */
  const badgeFor = (item: NavItem): number | string | undefined => {
    if (item.id === 'messages') return unreadMessagesCount > 0 ? unreadMessagesCount : undefined;
    if (item.id !== 'verifications') return item.badge;
    return pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined;
  };

  const renderItem = (item: NavItem, options: { compact?: boolean } = {}) => {
    const Icon = item.icon;
    const compact = Boolean(options.compact);
    const railCollapsed = isCollapsed && !compact;
    const active = isItemActive(item);
    const badgeValue = badgeFor(item);

    return (
      <div key={item.id} className="space-y-0.5">
        <Link
          href={item.href}
          {...(item.external ? { target: '_blank', rel: 'noreferrer' } : {})}
          onClick={compact ? () => setMobileOpen(false) : undefined}
          title={railCollapsed ? item.label : undefined}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'group relative flex items-center gap-3 rounded-xl border px-3 py-2.5',
            'text-[13px] font-medium tracking-[-0.005em] transition-colors duration-150',
            FOCUS_RING,
            active ? ACTIVE_ITEM : IDLE_ITEM,
            railCollapsed && 'justify-center px-0',
          )}
        >
          <Icon
            strokeWidth={1.6}
            className={cn(
              'h-[18px] w-[18px] shrink-0 transition-colors',
              active ? 'text-[#6657E8]' : 'text-[#8F8B80] group-hover:text-[#111111]',
            )}
          />

          {!railCollapsed && (
            <>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>

              {badgeValue !== undefined && (
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    typeof badgeValue === 'number'
                      ? 'bg-[#B42318] tabular-nums text-white'
                      : 'bg-[#E8E4FF] text-[#6657E8]',
                  )}
                >
                  {badgeValue}
                </span>
              )}
            </>
          )}

          {railCollapsed && (
            <span
              role="tooltip"
              className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-[#111111] px-2.5 py-1.5 text-[11px] font-medium text-[#F4F1EA] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
            >
              {item.label}
            </span>
          )}
        </Link>

        {!railCollapsed && item.children && item.children.length > 0 && (
          // Guide rail: one hairline down the group, one tick per child.
          <div className="relative ml-[22px] space-y-0.5 border-l border-[#E1DDD2] pl-4 pt-0.5">
            {item.children.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.id}
                  href={child.href}
                  onClick={compact ? () => setMobileOpen(false) : undefined}
                  aria-current={childActive ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center rounded-lg border px-2.5 py-2 text-[12.5px] transition-colors duration-150',
                    FOCUS_RING,
                    childActive ? `${ACTIVE_ITEM} font-medium` : `${IDLE_ITEM} font-normal`,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-4 top-1/2 h-px w-2.5 bg-[#E1DDD2]"
                  />
                  <span className="truncate">{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSectionLabel = (title: string, compact = false) =>
    isCollapsed && !compact ? (
      <div className="mx-auto mb-2 h-px w-6 bg-[#E1DDD2]" aria-hidden="true" />
    ) : (
      <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A39F96]">
        {title}
      </div>
    );

  return (
    <>
      {/* Desktop rail */}
      <aside
        aria-label="Navigasi Admin"
        className={cn(
          'fixed bottom-0 left-0 top-0 z-40 hidden flex-col border-r border-[#E5E2D9] bg-[#FCFBF7] font-sans',
          'transition-[width] duration-240 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:flex',
          isCollapsed ? 'w-[76px]' : 'w-[264px]',
        )}
      >
        {/* Brand row */}
        <div
          className={cn(
            'flex h-[72px] shrink-0 items-center gap-2.5 px-4',
            isCollapsed && 'justify-center px-0',
          )}
        >
          <Link
            href="/admin"
            className={cn('flex min-w-0 items-center gap-2.5 rounded-xl', FOCUS_RING)}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#6657E8] to-[#4839BD] text-[13px] font-bold text-white shadow-[0_6px_14px_-6px_rgba(102,87,232,0.85)]">
              DA
            </span>
            {!isCollapsed && (
              <span className="font-display truncate text-[15.5px] font-medium tracking-[-0.02em] text-[#111111]">
                Digital Atelier
              </span>
            )}
          </Link>

          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleMode}
              title="Minimalkan sidebar (Ctrl+B)"
              aria-label="Minimalkan sidebar"
              className={cn(
                'ml-auto rounded-lg p-1.5 text-[#8F8B80] transition-colors hover:bg-[#F1EDE3] hover:text-[#111111]',
                FOCUS_RING,
              )}
            >
              <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            type="button"
            onClick={toggleMode}
            title="Perluas sidebar (Ctrl+B)"
            aria-label="Perluas sidebar"
            className={cn(
              'mx-auto mb-3 rounded-lg p-1.5 text-[#8F8B80] transition-colors hover:bg-[#F1EDE3] hover:text-[#111111]',
              FOCUS_RING,
            )}
          >
            <PanelLeft className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
        )}

        {/* Scrolling groups */}
        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 pb-4 pt-1">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {renderSectionLabel(section.title)}
              <div className="space-y-1">{section.items.map((item) => renderItem(item))}</div>
            </div>
          ))}
        </nav>

        {/* Bottom-pinned settings group, after the flexible gap */}
        <div className="shrink-0 px-3 pb-4 pt-2">
          {renderSectionLabel(SETTINGS_SECTION.title)}
          <div className="space-y-1">{SETTINGS_SECTION.items.map((item) => renderItem(item))}</div>
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#E5E2D9] bg-[#FCFBF7] px-4 font-sans md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu navigasi"
            className="rounded-lg p-2 text-[#111111] transition-colors hover:bg-[#F1EDE3]"
          >
            <PanelLeft className="h-5 w-5" strokeWidth={1.6} />
          </button>
          <span className="font-display text-[15px] font-medium tracking-[-0.02em] text-[#111111]">
            Digital Atelier
          </span>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex font-sans md:hidden">
          <div
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-[#111111]/45 backdrop-blur-[2px]"
          />

          <div className="relative z-10 flex h-full w-[284px] max-w-[85vw] flex-col bg-[#FCFBF7] shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E2D9] px-4">
              <span className="font-display text-[15px] font-medium tracking-[-0.02em] text-[#111111]">
                Menu Admin
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup menu navigasi"
                className="rounded-lg p-1.5 text-[#686660] transition-colors hover:bg-[#F1EDE3] hover:text-[#111111]"
              >
                <X className="h-5 w-5" strokeWidth={1.6} />
              </button>
            </div>

            <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-4">
              {ALL_SECTIONS.map((section) => (
                <div key={section.title}>
                  {renderSectionLabel(section.title, true)}
                  <div className="space-y-1">
                    {section.items.map((item) => renderItem(item, { compact: true }))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
