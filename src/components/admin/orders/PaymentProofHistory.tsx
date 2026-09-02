'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  FileImage,
  Loader2,
  Mail,
  Phone,
  User,
  XCircle,
  ZoomIn,
} from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/dialog';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { formatRupiah } from '@/lib/utils/invoice';

interface PaymentProofRow {
  id: string;
  fileId: string;
  originalName: string;
  senderName: string;
  amount: number;
  paidAt: string;
  note: string | null;
  status: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface PaymentProofOrder {
  id: string;
  invoice: string;
  status: string;
  total: number;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  items: Array<{ id: string; productName: string; unitPrice: number; quantity: number }>;
}

interface PaymentProofHistoryProps {
  order: PaymentProofOrder;
  proofs: PaymentProofRow[];
}

const REJECTION_OPTIONS = [
  'Nominal pembayaran tidak sesuai dengan total tagihan.',
  'Gambar bukti transfer tidak terbaca atau buram.',
  'Transaksi tidak ditemukan di mutasi merchant QRIS.',
  'Bukti transfer teridentifikasi sebagai duplikat atau tidak valid.',
];

export function PaymentProofHistory({ order, proofs }: PaymentProofHistoryProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<PaymentProofRow | null>(null);
  const [busyAction, setBusyAction] = useState<'approve' | 'reject' | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_OPTIONS[0]);
  const [internalNote, setInternalNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const close = () => {
    if (busyAction) return;
    setSelected(null);
    setShowReject(false);
    setActionError(null);
    setZoomed(false);
  };

  const approve = async () => {
    setBusyAction('approve');
    setActionError(null);
    try {
      const response = await fetch(`/api/admin/verifications/${order.id}/approve`, { method: 'POST' });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) throw new Error(data.error || 'Gagal menyetujui pembayaran.');
      router.refresh();
      setSelected(null);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Gagal menyetujui pembayaran.');
    } finally {
      setBusyAction(null);
    }
  };

  const reject = async () => {
    if (!rejectionReason.trim()) {
      setActionError('Alasan penolakan wajib diisi.');
      return;
    }
    setBusyAction('reject');
    setActionError(null);
    try {
      const response = await fetch(`/api/admin/verifications/${order.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason, internalNote }),
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) throw new Error(data.error || 'Gagal menolak pembayaran.');
      router.refresh();
      setSelected(null);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Gagal menolak pembayaran.');
    } finally {
      setBusyAction(null);
    }
  };

  if (proofs.length === 0) {
    return <p className="text-xs text-[#686660]">Pembeli belum mengunggah bukti pembayaran.</p>;
  }

  const canReview = Boolean(
    selected && order.status === 'WAITING_VERIFICATION' && selected.status === 'ACTIVE',
  );

  return (
    <>
      <div className="space-y-3">
        {proofs.map((proof, index) => (
          <div key={proof.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E5E2D9] bg-[#F8F6F0] p-4 text-xs">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#111111]">Pengirim: {proof.senderName}</span>
                {index === 0 && <span className="rounded-full bg-[#E8E4FF] px-2 py-0.5 text-[9px] font-semibold text-[#6657E8]">Terbaru</span>}
              </div>
              <span className="mt-1 block font-mono text-[#686660]">Nominal: {formatRupiah(proof.amount)}</span>
              {proof.note && <span className="mt-1 block text-[11px] text-[#686660]">Catatan: {proof.note}</span>}
              <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#686660]">Status: {proof.status}</span>
              {proof.rejectionReason && <span className="mt-1 block text-[11px] text-[#B42318]">Alasan: {proof.rejectionReason}</span>}
            </div>
            <button type="button" onClick={() => { setSelected(proof); setActionError(null); setShowReject(false); }} className="inline-flex items-center gap-1.5 rounded-lg bg-[#6657E8] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#5244D2] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2">
              <Eye className="h-3.5 w-3.5" /> Lihat Detail Bukti
            </button>
          </div>
        ))}
      </div>

      <ResponsiveDialog
        open={Boolean(selected)}
        onClose={close}
        surface="admin"
        size="xl"
        dismissible={!busyAction}
        title={selected ? `Detail Bukti ${order.invoice}` : 'Detail Bukti Pembayaran'}
        description="Bandingkan nominal invoice, metadata transfer, dan gambar bukti tanpa meninggalkan halaman pesanan."
        headerAside={selected ? <AdminStatusBadge status={selected.status} /> : undefined}
        footer={canReview ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowReject((current) => !current)} disabled={Boolean(busyAction)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#B42318]/25 bg-[#B42318]/8 px-4 py-2.5 text-xs font-semibold text-[#B42318] hover:bg-[#B42318] hover:text-white disabled:opacity-50"><XCircle className="h-4 w-4" /> Tolak Pembayaran</button>
            <button type="button" onClick={approve} disabled={Boolean(busyAction)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6657E8] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#5244D2] active:translate-y-px disabled:opacity-50">{busyAction === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Setujui Pembayaran</button>
          </div>
        ) : undefined}
      >
        {selected && (
          <div className="space-y-5">
            {actionError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-[#B42318]/20 bg-[#B42318]/8 p-3 text-xs text-[#B42318]"><AlertCircle className="mt-px h-4 w-4 shrink-0" />{actionError}</div>}

            {showReject && canReview && (
              <section className="rounded-2xl border border-[#B42318]/20 bg-[#B42318]/5 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-[#111111]">Alasan penolakan</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div><label htmlFor="proof-rejection-reason" className="mb-1.5 block text-xs font-semibold text-[#111111]">Alasan untuk pelanggan</label><select id="proof-rejection-reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="w-full rounded-xl border border-[#DAD6CD] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#6657E8]">{REJECTION_OPTIONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select><textarea rows={2} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="mt-2 w-full resize-y rounded-xl border border-[#DAD6CD] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#6657E8]" /></div>
                  <div><label htmlFor="proof-internal-note" className="mb-1.5 block text-xs font-semibold text-[#111111]">Catatan internal (opsional)</label><textarea id="proof-internal-note" rows={4} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} placeholder="Hanya terlihat oleh admin" className="w-full resize-y rounded-xl border border-[#DAD6CD] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#6657E8]" /></div>
                </div>
                <div className="mt-4 flex justify-end"><button type="button" onClick={reject} disabled={Boolean(busyAction)} className="inline-flex items-center gap-2 rounded-xl bg-[#B42318] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#961C13] disabled:opacity-50">{busyAction === 'reject' && <Loader2 className="h-4 w-4 animate-spin" />} Konfirmasi Penolakan</button></div>
              </section>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#E5E2D9] bg-white p-4"><span className="text-[11px] text-[#686660]">Nominal tagihan invoice</span><strong className="mt-2 block font-mono text-2xl text-[#111111]">{formatRupiah(order.total)}</strong></div>
              <div className={`rounded-2xl border p-4 ${selected.amount === order.total ? 'border-[#187A4A]/30 bg-[#187A4A]/8' : 'border-[#B42318]/30 bg-[#B42318]/8'}`}><div className="flex items-center justify-between gap-3"><span className="text-[11px] font-semibold text-[#111111]">Nominal pada bukti</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${selected.amount === order.total ? 'bg-[#187A4A] text-white' : 'bg-[#B42318] text-white'}`}>{selected.amount === order.total ? 'Sesuai' : 'Berbeda'}</span></div><strong className="mt-2 block font-mono text-2xl text-[#111111]">{formatRupiah(selected.amount)}</strong></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-[#E5E2D9] bg-white p-4 sm:p-5"><h3 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#686660]">Data pembeli dan item</h3><div className="mt-4 space-y-2 text-xs"><div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-[#6657E8]" />{order.customerName}</div><div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[#6657E8]" />{order.customerEmail}</div><div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[#6657E8]" />{order.customerWhatsapp}</div></div><div className="mt-4 border-t border-[#E5E2D9] pt-3">{order.items.map((item) => <div key={item.id} className="flex items-start justify-between gap-4 py-1.5 text-xs"><span className="min-w-0 font-medium text-[#111111]">{item.productName}<span className="ml-1 text-[#686660]">x{item.quantity}</span></span><span className="shrink-0 font-mono">{formatRupiah(item.unitPrice)}</span></div>)}</div></section>
              <section className="rounded-2xl border border-[#E5E2D9] bg-white p-4 sm:p-5"><h3 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#686660]">Metadata bukti upload</h3><dl className="mt-4 grid gap-3 text-xs"><div><dt className="text-[#686660]">Nama pengirim</dt><dd className="mt-0.5 font-semibold text-[#111111]">{selected.senderName}</dd></div><div><dt className="text-[#686660]">Waktu transfer</dt><dd className="mt-0.5 text-[#111111]">{new Date(selected.paidAt).toLocaleString('id-ID')}</dd></div><div><dt className="text-[#686660]">File bukti</dt><dd className="mt-0.5 flex items-center gap-1.5 text-[#111111]"><FileImage className="h-3.5 w-3.5 text-[#6657E8]" />{selected.originalName}</dd></div><div><dt className="text-[#686660]">Diupload</dt><dd className="mt-0.5 flex items-center gap-1.5 text-[#111111]"><Clock3 className="h-3.5 w-3.5 text-[#6657E8]" />{new Date(selected.createdAt).toLocaleString('id-ID')}</dd></div>{selected.note && <div><dt className="text-[#686660]">Catatan pembeli</dt><dd className="mt-0.5 whitespace-pre-wrap text-[#111111]">{selected.note}</dd></div>}</dl></section>
            </div>

            <section className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-semibold text-[#111111]">Foto bukti transfer</h3><button type="button" onClick={() => setZoomed((value) => !value)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-[#686660] hover:bg-[#F4F1EA] hover:text-[#6657E8]"><ZoomIn className="h-3.5 w-3.5" />{zoomed ? 'Perkecil' : 'Perbesar'}</button></div>
              <div className={`relative overflow-hidden rounded-2xl border border-[#E5E2D9] bg-[#111111] transition-[height] ${zoomed ? 'h-[min(70dvh,720px)]' : 'h-[320px] sm:h-[460px]'}`}><Image src={`/api/admin/proof-image/${selected.fileId}`} alt={`Bukti pembayaran ${order.invoice} dari ${selected.senderName}`} fill unoptimized className="object-contain" sizes="(max-width: 640px) 100vw, 960px" /></div>
            </section>

            {selected.rejectionReason && <div className="rounded-xl border border-[#B42318]/20 bg-[#B42318]/8 p-4 text-xs text-[#B42318]"><strong>Alasan penolakan</strong><p className="mt-1 whitespace-pre-wrap leading-5">{selected.rejectionReason}</p></div>}
          </div>
        )}
      </ResponsiveDialog>
    </>
  );
}
