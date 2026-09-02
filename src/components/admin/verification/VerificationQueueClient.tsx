'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { formatRupiah } from '@/lib/utils/invoice';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ZoomIn,
  Loader2,
  ShieldCheck,
  User,
  Mail,
  Phone,
} from 'lucide-react';

interface VerificationQueueClientProps {
  initialOrders: any[];
}

export function VerificationQueueClient({ initialOrders }: VerificationQueueClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Nominal pembayaran tidak sesuai dengan total tagihan.');
  const [internalNote, setInternalNote] = useState('');
  const [zoomProof, setZoomProof] = useState(false);

  const currentOrder = orders[selectedIndex];

  const handleApprove = async () => {
    if (!currentOrder) return;
    setIsApproving(true);

    try {
      const res = await fetch(`/api/admin/verifications/${currentOrder.id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyetujui pembayaran');
      }

      // Remove approved order from queue view
      setOrders((prev) => prev.filter((o) => o.id !== currentOrder.id));
      setSelectedIndex(0);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memproses approval');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) return;
    setIsRejecting(true);

    try {
      const res = await fetch(`/api/admin/verifications/${currentOrder.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectionReason,
          internalNote,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menolak pembayaran');
      }

      setShowRejectModal(false);
      setOrders((prev) => prev.filter((o) => o.id !== currentOrder.id));
      setSelectedIndex(0);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memproses penolakan');
    } finally {
      setIsRejecting(false);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="admin-surface p-16 text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-[#187A4A] mx-auto" />
        <h3 className="font-semibold text-lg text-[#111111]">Antrean Verifikasi Kosong</h3>
        <p className="text-xs text-[#686660]">
          Semua bukti pembayaran telah diperiksa. Tidak ada antrean yang membutuhkan tindakan saat ini.
        </p>
      </div>
    );
  }

  const activeProof = currentOrder?.proofs?.[0];
  const proofImageUrl = activeProof?.fileId ? `/api/admin/proof-image/${activeProof.fileId}` : null;
  const isAmountMatch = activeProof ? activeProof.amount === currentOrder.total : false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left List Column (4 Cols) */}
      <div className="lg:col-span-4 rounded-2xl border border-[#E5E2D9] bg-white p-4 space-y-3 max-h-[800px] overflow-y-auto">
        <div className="text-xs font-semibold text-[#686660] px-1 uppercase tracking-wider">
          {orders.length} Menunggu Verifikasi
        </div>

        {orders.map((ord, idx) => {
          const isSelected = idx === selectedIndex;
          const activePrf = ord.proofs?.[0];

          return (
            <div
              key={ord.id}
              onClick={() => setSelectedIndex(idx)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#ECE8DE] border-[#6657E8] shadow-xs'
                  : 'bg-[#F8F6F0] border-[#E5E2D9] hover:bg-[#F4F1EA]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#111111]">{ord.invoice}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#9A6000]/10 text-[#9A6000]">
                  {new Date(ord.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-xs text-[#686660] mt-1 truncate">{ord.customerName}</div>
              <div className="font-mono text-xs font-bold text-[#111111] mt-2">
                {formatRupiah(ord.total)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Side-by-Side Comparison Column (8 Cols) */}
      <div className="lg:col-span-8 admin-surface p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E5E2D9] gap-4">
          <div>
            <span className="text-xs text-[#686660] block">Detail Verifikasi Order</span>
            <span className="font-mono text-xl font-bold text-[#111111]">{currentOrder.invoice}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              disabled={isApproving || isRejecting}
              className="px-4 py-2 bg-[#B42318]/10 hover:bg-[#B42318] text-[#B42318] hover:text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Tolak Pembayaran</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="px-5 py-2 bg-[#6657E8] hover:bg-[#5244D2] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui Pembayaran (Approve)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Amount Comparison Widget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#F8F6F0] border border-[#E5E2D9] rounded-xl space-y-1">
            <span className="text-xs text-[#686660]">Nominal Tagihan Order</span>
            <div className="font-mono text-2xl font-bold text-[#111111]">
              {formatRupiah(currentOrder.total)}
            </div>
          </div>

          <div
            className={`p-4 border rounded-xl space-y-1 ${
              isAmountMatch ? 'bg-[#187A4A]/10 border-[#187A4A]/30' : 'bg-[#B42318]/10 border-[#B42318]/30'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold">Nominal di Bukti Transfer</span>
              {isAmountMatch ? (
                <span className="text-[10px] bg-[#187A4A] text-white font-bold px-2 py-0.5 rounded-full">Sesuai</span>
              ) : (
                <span className="text-[10px] bg-[#B42318] text-white font-bold px-2 py-0.5 rounded-full">Beda</span>
              )}
            </div>
            <div className="font-mono text-2xl font-bold">
              {activeProof ? formatRupiah(activeProof.amount) : 'Belum Upload'}
            </div>
          </div>
        </div>

        {/* Details Grid: Order & Proof Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#111111]">
          {/* Order Snapshot */}
          <div className="p-4 bg-[#F8F6F0] border border-[#E5E2D9] rounded-xl space-y-3">
            <h4 className="font-semibold text-xs text-[#686660] uppercase tracking-wider">Data Pembeli</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#686660]" />
                <span className="font-medium">{currentOrder.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#686660]" />
                <span>{currentOrder.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#686660]" />
                <span>{currentOrder.customerWhatsapp}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E2D9]">
              <span className="font-semibold text-xs text-[#686660] uppercase tracking-wider block mb-1">
                Item Dipesan
              </span>
              {currentOrder.items.map((i: any) => (
                <div key={i.id} className="flex justify-between py-1">
                  <span>{i.productName}</span>
                  <span className="font-mono font-medium">{formatRupiah(i.unitPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Proof Submission Details */}
          <div className="p-4 bg-[#F8F6F0] border border-[#E5E2D9] rounded-xl space-y-3">
            <h4 className="font-semibold text-xs text-[#686660] uppercase tracking-wider">Metadata Bukti Upload</h4>
            {activeProof ? (
              <div className="space-y-2">
                <div>
                  <span className="text-[#686660] block">Nama Pengirim</span>
                  <span className="font-medium text-[#111111]">{activeProof.senderName}</span>
                </div>
                <div>
                  <span className="text-[#686660] block">Waktu Transfer</span>
                  <span>{new Date(activeProof.paidAt).toLocaleString('id-ID')}</span>
                </div>
                {activeProof.note && (
                  <div>
                    <span className="text-[#686660] block">Catatan Pembeli</span>
                    <span className="italic">{activeProof.note}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[#686660]">Belum ada data bukti.</p>
            )}
          </div>
        </div>

        {/* Proof Image Preview */}
        {proofImageUrl && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#686660]">
              <span className="font-semibold">Foto Screenshot Bukti Transfer</span>
              <button
                type="button"
                onClick={() => setZoomProof(!zoomProof)}
                className="flex items-center gap-1 hover:text-[#6657E8]"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>{zoomProof ? 'Perkecil' : 'Perbesar Zoom'}</span>
              </button>
            </div>

            <div
              className={`relative rounded-2xl border border-[#E5E2D9] overflow-hidden bg-[#111111] transition-all ${
                zoomProof ? 'h-[600px]' : 'h-[320px]'
              }`}
            >
              <Image src={proofImageUrl} alt="Bukti Transfer QRIS" fill className="object-contain" />
            </div>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-semibold text-lg text-[#111111]">Tolak Pembayaran Pesanan</h3>
            <p className="text-xs text-[#686660]">
              Pembeli akan menerima notifikasi di aplikasi beserta alasan penolakan dan dapat mengunggah bukti baru.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Alasan Penolakan (Wajib)
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 bg-[#F8F6F0] border border-[#E5E2D9] rounded-xl text-xs text-[#111111] mb-2"
                >
                  <option value="Nominal pembayaran tidak sesuai dengan total tagihan.">
                    Nominal tidak sesuai total tagihan
                  </option>
                  <option value="Gambar bukti transfer tidak terbaca atau buram.">
                    Foto bukti tidak terbaca / buram
                  </option>
                  <option value="Transaksi tidak ditemukan di mutasi merchant QRIS.">
                    Transaksi tidak ditemukan di mutasi merchant
                  </option>
                  <option value="Bukti transfer teridentifikasi sebagai duplikat / palsu.">
                    Bukti terdeteksi duplikat / tidak valid
                  </option>
                </select>

                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 bg-[#F8F6F0] border border-[#E5E2D9] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#6657E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Catatan Internal Admin (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Catatan rahasia hanya untuk tim admin"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="w-full p-3 bg-[#F8F6F0] border border-[#E5E2D9] rounded-xl text-xs text-[#111111]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2.5 bg-[#F8F6F0] hover:bg-[#E5E2D9] text-[#111111] text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="flex-1 py-2.5 bg-[#B42318] hover:bg-[#961C13] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                >
                  {isRejecting ? 'Kirim...' : 'Konfirmasi Tolak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
