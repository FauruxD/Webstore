'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Inbox,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
  ShoppingBag,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type CenterMode = 'admin' | 'customer';
const MAX_CHAT_FILE_SIZE = 10 * 1024 * 1024;
const CHAT_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.zip,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx';

interface AttachmentRow {
  id: string;
  fileAsset: {
    originalName: string;
    mimeType: string;
    size: number;
  };
}

interface MessageRow {
  id: string;
  senderType: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  kind: 'TEXT' | 'SYSTEM' | 'DOWNLOAD';
  body: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
  attachments?: AttachmentRow[];
}

interface ConversationRow {
  id: string;
  updatedAt: string;
  order: {
    id: string;
    invoice: string;
    customerName: string;
    status: string;
    items: Array<{ productName: string }>;
  };
  messages: MessageRow[];
  _count: { messages: number };
}

function timeLabel(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function dateTimeLabel(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function fileSizeLabel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageAttachment(attachment: AttachmentRow): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(attachment.fileAsset.mimeType);
}

export function MessageCenter({ mode }: { mode: CenterMode }) {
  const searchParams = useSearchParams();
  const requestedConversation = searchParams.get('conversation');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(requestedConversation);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(requestedConversation));
  const [error, setError] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const apiBase = `/api/${mode}/conversations`;
  const selected = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const loadConversations = useCallback(async (quiet = false) => {
    if (!quiet) setLoadingList(true);
    try {
      const query = mode === 'admin' && filter === 'unread' ? '?filter=unread' : '';
      const response = await fetch(`${apiBase}${query}`, { cache: 'no-store' });
      if (response.status === 401) {
        setConversations([]);
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat percakapan');
      setConversations(data.conversations);
    } catch (loadError) {
      if (!quiet) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat percakapan');
    } finally {
      if (!quiet) setLoadingList(false);
    }
  }, [apiBase, filter, mode]);

  const loadMessages = useCallback(async (conversationId: string, quiet = false) => {
    if (!quiet) setLoadingChat(true);
    try {
      const response = await fetch(`${apiBase}/${conversationId}/messages`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat pesan');
      setMessages((current) => {
        if (!quiet) return data.messages;
        const merged = new Map(current.map((message) => [message.id, message]));
        for (const message of data.messages as MessageRow[]) merged.set(message.id, message);
        return Array.from(merged.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
      setHasMore(data.hasMore);
      await fetch(`${apiBase}/${conversationId}/read`, { method: 'POST' });
    } catch (loadError) {
      if (!quiet) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat pesan');
    } finally {
      if (!quiet) setLoadingChat(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void loadConversations();
    const timer = window.setInterval(() => void loadConversations(true), 5000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedId);
    const timer = window.setInterval(() => void loadMessages(selectedId, true), 4000);
    return () => window.clearInterval(timer);
  }, [loadMessages, selectedId]);

  const openConversation = (id: string) => {
    setSelectedId(id);
    setMobileChatOpen(true);
    setError(null);
  };

  const loadOlder = async () => {
    if (!selectedId || !messages[0]) return;
    const response = await fetch(
      `${apiBase}/${selectedId}/messages?before=${encodeURIComponent(messages[0].createdAt)}`,
      { cache: 'no-store' },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Gagal memuat pesan lama');
      return;
    }
    setMessages((current) => [...data.messages, ...current]);
    setHasMore(data.hasMore);
  };

  const selectAttachment = (file: File | null) => {
    setError(null);
    if (file && file.size > MAX_CHAT_FILE_SIZE) {
      setAttachment(null);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      setError('Ukuran lampiran maksimal 10 MB');
      return;
    }
    setAttachment(file);
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId || (!draft.trim() && !attachment) || sending) return;
    setSending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set('body', draft);
      if (attachment) formData.set('attachment', attachment);
      const response = await fetch(`${apiBase}/${selectedId}/messages`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal mengirim pesan');
      setDraft('');
      clearAttachment();
      setMessages((current) => [...current, data.message]);
      void loadConversations(true);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const orderHref = selected
    ? mode === 'admin'
      ? `/admin/orders/${selected.order.id}`
      : `/order/${selected.order.invoice}`
    : '#';

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E2D9] bg-white shadow-[0_18px_50px_-38px_rgba(17,17,17,0.4)]">
      <div className={cn(
        'grid h-[min(720px,calc(100dvh-160px))] min-h-[580px] min-w-0 grid-cols-1',
        mode === 'admin'
          ? 'xl:grid-cols-[360px_minmax(0,1fr)]'
          : 'lg:grid-cols-[360px_minmax(0,1fr)]',
      )}>
        <aside className={cn(
          'min-h-0 min-w-0 flex-col border-r border-[#E5E2D9] bg-[#FCFBF7]',
          mobileChatOpen ? null : 'flex',
          mobileChatOpen && (mode === 'admin' ? 'hidden xl:flex' : 'hidden lg:flex'),
        )}>
          <div className="border-b border-[#E5E2D9] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A39F96]">Inbox</p>
                <h2 className="font-display text-xl font-medium text-[#111111]">Percakapan</h2>
              </div>
              <span className="rounded-full bg-[#E8E4FF] px-2.5 py-1 text-[10px] font-bold text-[#6657E8]">
                {conversations.length}
              </span>
            </div>
            {mode === 'admin' && (
              <div className="mt-4 grid grid-cols-2 rounded-xl bg-[#F1EDE3] p-1 text-xs">
                <button type="button" onClick={() => setFilter('all')} className={cn('rounded-lg px-3 py-2 font-semibold', filter === 'all' && 'bg-white text-[#111111] shadow-sm')}>Semua Pesan</button>
                <button type="button" onClick={() => setFilter('unread')} className={cn('rounded-lg px-3 py-2 font-semibold', filter === 'unread' && 'bg-white text-[#111111] shadow-sm')}>Belum Dibaca</button>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center p-12 text-[#686660]"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : conversations.length === 0 ? (
              <div className="p-10 text-center">
                <Inbox className="mx-auto h-9 w-9 text-[#C9C4B7]" />
                <p className="mt-3 text-sm font-semibold text-[#111111]">Belum ada percakapan</p>
                <p className="mt-1 text-xs leading-5 text-[#686660]">Percakapan order akan muncul di sini setelah checkout.</p>
              </div>
            ) : conversations.map((conversation) => {
              const last = conversation.messages[0];
              const unread = conversation._count.messages;
              return (
                <button
                  type="button"
                  key={conversation.id}
                  onClick={() => openConversation(conversation.id)}
                  className={cn(
                    'w-full border-b border-[#E5E2D9] px-5 py-4 text-left transition-colors hover:bg-[#F4F1EA]',
                    selectedId === conversation.id && 'bg-[#ECE8DE]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#111111]">
                        {mode === 'admin' ? conversation.order.customerName : conversation.order.invoice}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-[#6657E8]">
                        {mode === 'admin' ? conversation.order.invoice : conversation.order.items.map((item) => item.productName).join(', ')}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-[#8F8B80]">{timeLabel(conversation.updatedAt)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <p className={cn('min-w-0 flex-1 truncate text-xs text-[#686660]', unread > 0 && 'font-semibold text-[#111111]')}>
                      {last?.body || 'Belum ada pesan'}
                    </p>
                    {unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B42318] px-1.5 text-[10px] font-bold text-white">{unread}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className={cn(
          'min-h-0 min-w-0 flex-col bg-[#F8F6F0]',
          mobileChatOpen ? 'flex' : null,
          !mobileChatOpen && (mode === 'admin' ? 'hidden xl:flex' : 'hidden lg:flex'),
        )}>
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8E4FF] text-[#6657E8]"><MessageCircle className="h-7 w-7" /></div>
              <h3 className="mt-5 font-display text-2xl font-medium text-[#111111]">Pilih percakapan</h3>
              <p className="mt-2 max-w-sm text-xs leading-5 text-[#686660]">Pilih order dari daftar untuk membaca riwayat pesan dan membalas.</p>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between gap-4 border-b border-[#E5E2D9] bg-white px-4 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" onClick={() => setMobileChatOpen(false)} className={cn('rounded-lg p-2 text-[#686660] hover:bg-[#F4F1EA]', mode === 'admin' ? 'xl:hidden' : 'lg:hidden')} aria-label="Kembali ke daftar percakapan"><ArrowLeft className="h-5 w-5" /></button>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#111111]">{mode === 'admin' ? selected.order.customerName : 'Digital Atelier'}</p>
                    <p className="truncate font-mono text-[10px] text-[#686660]">{selected.order.invoice} · {selected.order.status}</p>
                  </div>
                </div>
                <Link href={orderHref} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E5E2D9] bg-[#FCFBF7] px-3 py-2 text-[11px] font-semibold text-[#111111] hover:border-[#6657E8]">
                  <ShoppingBag className="h-3.5 w-3.5" /><span className="hidden sm:inline">Buka Pesanan</span>
                </Link>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6 sm:px-7">
                {hasMore && <div className="text-center"><button type="button" onClick={() => void loadOlder()} className="rounded-full border border-[#E5E2D9] bg-white px-4 py-2 text-[11px] font-semibold text-[#686660]">Muat pesan lebih lama</button></div>}
                {loadingChat ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#6657E8]" /></div>
                ) : messages.map((message) => {
                  const mine = mode === 'admin' ? message.senderType === 'ADMIN' : message.senderType === 'CUSTOMER';
                  const system = message.senderType === 'SYSTEM';
                  const messageAttachment = message.attachments?.[0];
                  const attachmentUrl = messageAttachment
                    ? `/api/conversation-attachments/${messageAttachment.id}`
                    : null;
                  const attachmentOnly = messageAttachment
                    ? message.body === `Lampiran: ${messageAttachment.fileAsset.originalName}`
                    : false;
                  return (
                    <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start', system && 'justify-center')}>
                      <div className={cn(
                        'max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-5 shadow-sm',
                        mine ? 'rounded-br-md bg-[#6657E8] text-white' : 'rounded-bl-md border border-[#E5E2D9] bg-white text-[#111111]',
                        system && 'max-w-[92%] rounded-xl border-[#CFC8F5] bg-[#E8E4FF] text-[#3F349E]',
                      )}>
                        {messageAttachment && attachmentUrl && (
                          isImageAttachment(messageAttachment) ? (
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mb-2 block overflow-hidden rounded-xl border border-black/10 bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                              aria-label={`Buka gambar ${messageAttachment.fileAsset.originalName}`}
                            >
                              <Image
                                src={attachmentUrl}
                                alt={`Lampiran ${messageAttachment.fileAsset.originalName}`}
                                width={560}
                                height={360}
                                unoptimized
                                className="max-h-64 w-full object-contain"
                              />
                            </a>
                          ) : (
                            <a
                              href={`${attachmentUrl}?download=1`}
                              download
                              className={cn(
                                'mb-2 flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2',
                                mine
                                  ? 'border-white/20 bg-white/10 hover:bg-white/15 focus-visible:ring-white'
                                  : 'border-[#E5E2D9] bg-[#F8F6F0] hover:border-[#6657E8] focus-visible:ring-[#6657E8]',
                              )}
                            >
                              <FileText className="h-5 w-5 shrink-0" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[11px] font-semibold">{messageAttachment.fileAsset.originalName}</span>
                                <span className={cn('block text-[9px]', mine ? 'text-white/70' : 'text-[#8F8B80]')}>
                                  {fileSizeLabel(messageAttachment.fileAsset.size)} · Unduh lampiran
                                </span>
                              </span>
                            </a>
                          )
                        )}
                        {!attachmentOnly && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
                        {message.actionUrl && (
                          <Link href={message.actionUrl} className="mt-3 inline-flex rounded-lg bg-[#111111] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#6657E8]">
                            {message.actionLabel || 'Buka'}
                          </Link>
                        )}
                        <p className={cn('mt-1 text-[9px]', mine ? 'text-white/70' : 'text-[#8F8B80]', system && 'text-[#6657E8]')} title={dateTimeLabel(message.createdAt)}>{timeLabel(message.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={sendMessage} className="sticky bottom-0 border-t border-[#E5E2D9] bg-white p-4 sm:p-5">
                {error && <p role="alert" className="mb-2 text-[11px] text-[#B42318]">{error}</p>}
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept={CHAT_ACCEPT}
                  onChange={(event) => selectAttachment(event.target.files?.[0] || null)}
                  className="hidden"
                  tabIndex={-1}
                />
                {attachment && (
                  <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl border border-[#DAD6CD] bg-[#F8F6F0] px-3 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#6657E8]">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-[#111111]">{attachment.name}</p>
                      <p className="text-[9px] text-[#8F8B80]">{fileSizeLabel(attachment.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearAttachment}
                      aria-label="Hapus lampiran terpilih"
                      className="rounded-lg p-2 text-[#686660] hover:bg-white hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-3">
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    disabled={sending}
                    aria-label="Lampirkan file atau gambar"
                    title="Lampirkan file atau gambar"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#DAD6CD] bg-[#FCFBF7] text-[#686660] transition-colors hover:border-[#6657E8] hover:text-[#6657E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] disabled:opacity-40"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Tulis pesan..." className="max-h-28 min-h-[48px] min-w-0 flex-1 resize-none rounded-2xl border border-[#DAD6CD] bg-[#F8F6F0] px-4 py-3 text-xs text-[#111111] outline-none focus:border-[#6657E8] focus:ring-2 focus:ring-[#6657E8]/15" />
                  <button type="submit" disabled={sending || (!draft.trim() && !attachment)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#111111] text-white transition-[background-color,transform] hover:bg-[#6657E8] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Kirim pesan">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-right text-[9px] text-[#A39F96]">{attachment ? '1 lampiran · ' : ''}{draft.length}/2000</p>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
