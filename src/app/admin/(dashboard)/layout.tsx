import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { AdminSidebar, SidebarMode } from '@/components/admin/sidebar/AdminSidebar';
import { db } from '@/lib/db';
import { LogOut } from 'lucide-react';

/** Initials for the session chip, so the topbar needs no avatar asset. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'A';
}

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/login?next=/admin');
  }

  const cookieStore = await cookies();
  const sidebarModeCookie = cookieStore.get('admin_sidebar_mode')?.value as SidebarMode;
  const initialMode = sidebarModeCookie === 'collapsed' ? 'collapsed' : 'expanded';

  const [pendingCount, unreadMessagesCount] = await Promise.all([
    db.order.count({ where: { status: 'WAITING_VERIFICATION' } }),
    db.message.count({ where: { senderType: 'CUSTOMER', readAt: null } }),
  ]);

  return (
    <div
      className="admin-shell font-sans"
      style={
        {
          '--sidebar-width': initialMode === 'expanded' ? '264px' : '76px',
        } as React.CSSProperties
      }
    >
      <AdminSidebar
        initialMode={initialMode}
        pendingVerificationsCount={pendingCount}
        initialUnreadMessagesCount={unreadMessagesCount}
      />

      <div className="admin-main-viewport">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between gap-4 border-b border-[#E5E2D9] bg-[#FCFBF7]/92 px-6 font-sans backdrop-blur-sm md:px-10">
          <nav aria-label="Breadcrumb" className="min-w-0 text-[11.5px] text-[#686660]">
            <span className="uppercase tracking-[0.14em]">Workspace</span>
            <span aria-hidden="true" className="px-2 text-[#C9C4B7]">
              /
            </span>
            <span className="font-semibold text-[#111111]">Portal Operasional Admin</span>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <span className="block text-xs font-semibold text-[#111111]">{session.name}</span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-[#686660]">
                {session.role}
              </span>
            </div>

            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E2D9] bg-white text-[11px] font-semibold text-[#6657E8]"
            >
              {initials(session.name)}
            </span>

            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                title="Keluar / Logout"
                className="cursor-pointer rounded-xl border border-transparent p-2 text-[#686660] transition-colors hover:border-[#E5E2D9] hover:bg-white hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FCFBF7]"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.6} />
              </button>
            </form>
          </div>
        </header>

        {/* Content */}
        <main className="w-full min-w-0 flex-1 px-6 py-8 md:px-10 md:py-10">
          <div className="mx-auto w-full min-w-0 max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
