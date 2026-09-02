'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, CircleAlert, Download, MessageCircle, ReceiptText } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
  order?: { invoice: string } | null;
}

function iconFor(type: string) {
  if (type === 'NEW_MESSAGE') return MessageCircle;
  if (type === 'PRODUCT_SENT') return Download;
  if (type === 'PAYMENT_REJECTED' || type === 'PAYMENT_PROOF_REQUIRED') return CircleAlert;
  return ReceiptText;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/customer/notifications', { cache: 'no-store' });
      if (response.status === 401) {
        setNotifications([]);
        return;
      }
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications);
        setHasMore(data.hasMore);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  const markRead = async (id: string) => {
    await fetch(`/api/customer/notifications/${id}/read`, { method: 'POST' });
    setNotifications((rows) => rows.map((row) => row.id === id ? { ...row, readAt: new Date().toISOString() } : row));
  };

  const markAll = async () => {
    await fetch('/api/customer/notifications/read-all', { method: 'POST' });
    const now = new Date().toISOString();
    setNotifications((rows) => rows.map((row) => ({ ...row, readAt: row.readAt || now })));
  };

  const loadOlder = async () => {
    const last = notifications.at(-1);
    if (!last) return;
    const response = await fetch(`/api/customer/notifications?before=${encodeURIComponent(last.createdAt)}`);
    const data = await response.json();
    if (response.ok) {
      setNotifications((rows) => [...rows, ...data.notifications]);
      setHasMore(data.hasMore);
    }
  };

  if (loading) return <div className="h-72 animate-pulse rounded-3xl bg-white" />;
  if (notifications.length === 0) {
    return (
      <div className="rounded-3xl border border-[#E5E2D9] bg-white px-6 py-20 text-center">
        <Bell className="mx-auto h-11 w-11 text-[#C9C4B7]" />
        <h2 className="mt-4 font-display text-2xl font-medium text-[#111111]">Belum ada notifikasi</h2>
        <p className="mt-2 text-xs text-[#686660]">Perubahan pembayaran, akses produk, dan pesan baru akan muncul di sini.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-[#E5E2D9] bg-white">
      <div className="flex items-center justify-between border-b border-[#E5E2D9] px-5 py-4 sm:px-7">
        <span className="text-xs font-semibold text-[#686660]">Terbaru</span>
        <button type="button" onClick={() => void markAll()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6657E8] hover:underline"><CheckCheck className="h-4 w-4" />Tandai semua dibaca</button>
      </div>
      <div className="divide-y divide-[#E5E2D9]">
        {notifications.map((notification) => {
          const Icon = iconFor(notification.type);
          const content = (
            <div className={cn('flex gap-4 px-5 py-5 transition-colors hover:bg-[#F8F6F0] sm:px-7', !notification.readAt && 'bg-[#E8E4FF]/35')}>
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', notification.readAt ? 'bg-[#F1EDE3] text-[#686660]' : 'bg-[#6657E8] text-white')}><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#111111]">{notification.title}</h3>
                    {notification.order && <p className="mt-0.5 font-mono text-[10px] text-[#6657E8]">{notification.order.invoice}</p>}
                  </div>
                  {!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#6657E8]" />}
                </div>
                <p className="mt-2 text-xs leading-5 text-[#686660]">{notification.body}</p>
                <p className="mt-2 text-[10px] text-[#A39F96]">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notification.createdAt))}</p>
              </div>
            </div>
          );
          return notification.actionUrl ? (
            <Link key={notification.id} href={notification.actionUrl} onClick={() => void markRead(notification.id)}>{content}</Link>
          ) : (
            <button type="button" key={notification.id} onClick={() => void markRead(notification.id)} className="w-full text-left">{content}</button>
          );
        })}
      </div>
      {hasMore && <div className="border-t border-[#E5E2D9] p-4 text-center"><button type="button" onClick={() => void loadOlder()} className="rounded-full border border-[#E5E2D9] px-4 py-2 text-xs font-semibold text-[#686660]">Muat notifikasi lebih lama</button></div>}
    </div>
  );
}

