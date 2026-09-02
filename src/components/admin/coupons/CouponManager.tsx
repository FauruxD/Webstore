'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Plus, Ticket, Trash2 } from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/dialog';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { formatRupiah } from '@/lib/utils/invoice';
import {
  DeleteResourceDialog,
  RESOURCE_ERROR_CLASS,
  RESOURCE_INPUT_CLASS,
  RESOURCE_LABEL_CLASS,
  ResourceFormError,
  ResourceSubmitFooter,
} from '@/components/admin/resources/ResourceDialogParts';

export interface CouponRow {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minPurchase: number;
  maxUsage: number;
  currentUsage: number;
  perEmailLimit: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  usageCount: number;
}

interface CouponForm {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: string;
  minPurchase: string;
  maxUsage: string;
  perEmailLimit: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

function toDateTimeInput(value: Date | string): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function emptyCoupon(): CouponForm {
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    code: '',
    type: 'PERCENTAGE',
    value: '10',
    minPurchase: '0',
    maxUsage: '100',
    perEmailLimit: '1',
    startsAt: toDateTimeInput(now),
    endsAt: toDateTimeInput(end),
    isActive: true,
  };
}

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CouponRow | null | 'new'>(null);
  const [deleting, setDeleting] = useState<CouponRow | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyCoupon);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => {
    setForm(emptyCoupon());
    setFieldErrors({});
    setFormError(null);
    setEditing('new');
  };

  const openEdit = (coupon: CouponRow) => {
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minPurchase: String(coupon.minPurchase),
      maxUsage: String(coupon.maxUsage),
      perEmailLimit: String(coupon.perEmailLimit),
      startsAt: toDateTimeInput(coupon.startsAt),
      endsAt: toDateTimeInput(coupon.endsAt),
      isActive: coupon.isActive,
    });
    setFieldErrors({});
    setFormError(null);
    setEditing(coupon);
  };

  const closeEditor = () => {
    if (!busy) setEditing(null);
  };

  const submit = async () => {
    if (!editing) return;
    setBusy(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const isNew = editing === 'new';
      const response = await fetch(isNew ? '/api/admin/coupons' : `/api/admin/coupons/${editing.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
          minPurchase: Number(form.minPurchase),
          maxUsage: Number(form.maxUsage),
          perEmailLimit: Number(form.perEmailLimit),
        }),
      });
      const data = (await response.json()) as { success?: boolean; error?: string; fieldErrors?: Record<string, string> };
      if (!response.ok || !data.success) {
        setFieldErrors(data.fieldErrors || {});
        throw new Error(data.error || 'Gagal menyimpan kupon.');
      }
      setEditing(null);
      router.refresh();
    } catch (cause: unknown) {
      setFormError(cause instanceof Error ? cause.message : 'Gagal menyimpan kupon.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="admin-surface w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2D9] p-4 sm:p-5">
          <div>
            <p className="text-sm font-semibold text-[#111111]">{coupons.length} kupon promosi</p>
            <p className="mt-1 text-[11px] text-[#686660]">Kupon yang sudah digunakan dapat dinonaktifkan, tetapi riwayatnya tidak dihapus.</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#6657E8] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#5244D2] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2">
            <Plus className="h-4 w-4" /> Tambah Kupon
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>Kode</th><th>Diskon</th><th>Syarat</th><th>Penggunaan</th><th>Periode</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={7} className="p-4"><AdminEmptyState title="Belum Ada Kupon" description="Buat kode promo persentase atau potongan tetap untuk checkout." icon={Ticket} /></td></tr>
              ) : coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="font-mono font-bold text-[#6657E8]">{coupon.code}</td>
                  <td><span className="block font-semibold text-[#111111]">{coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : formatRupiah(coupon.value)}</span><span className="mt-1 block text-[10px] text-[#686660]">{coupon.type === 'PERCENTAGE' ? 'Persentase' : 'Potongan tetap'}</span></td>
                  <td className="whitespace-nowrap text-[#686660]">Min. {formatRupiah(coupon.minPurchase)}<span className="mt-1 block text-[10px]">{coupon.perEmailLimit}x per email</span></td>
                  <td className="whitespace-nowrap font-mono">{coupon.currentUsage} / {coupon.maxUsage}</td>
                  <td className="whitespace-nowrap text-[11px] text-[#686660]">{new Date(coupon.startsAt).toLocaleDateString('id-ID')}<span className="block">sampai {new Date(coupon.endsAt).toLocaleDateString('id-ID')}</span></td>
                  <td><AdminStatusBadge status={coupon.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                  <td className="whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button type="button" onClick={() => openEdit(coupon)} aria-label={`Edit ${coupon.code}`} className="rounded-lg border border-[#E5E2D9] bg-white p-2 text-[#686660] transition-colors hover:border-[#6657E8] hover:text-[#6657E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8]"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => setDeleting(coupon)} disabled={coupon.usageCount > 0 || coupon.currentUsage > 0} aria-label={`Hapus ${coupon.code}`} title={coupon.usageCount > 0 ? 'Nonaktifkan kupon yang sudah pernah digunakan' : 'Hapus kupon'} className="rounded-lg border border-[#E5E2D9] bg-white p-2 text-[#686660] transition-colors hover:border-[#B42318] hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318] disabled:cursor-not-allowed disabled:opacity-35"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ResponsiveDialog
        open={Boolean(editing)}
        onClose={closeEditor}
        surface="admin"
        size="lg"
        dismissible={!busy}
        title={editing === 'new' ? 'Tambah Kupon' : 'Edit Kupon'}
        description="Atur nilai diskon, periode aktif, dan batas penggunaan sebelum kode dipakai di checkout."
        footer={<ResourceSubmitFooter busy={busy} onCancel={closeEditor} onSubmit={submit} submitLabel={editing === 'new' ? 'Buat Kupon' : 'Simpan Perubahan'} />}
      >
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void submit(); }} noValidate>
          <ResourceFormError message={formError} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label htmlFor="coupon-code" className={RESOURCE_LABEL_CLASS}>Kode kupon</label><input id="coupon-code" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))} className={`${RESOURCE_INPUT_CLASS} font-mono uppercase`} disabled={busy} autoFocus />{fieldErrors.code && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.code}</p>}</div>
            <div><label htmlFor="coupon-type" className={RESOURCE_LABEL_CLASS}>Tipe diskon</label><select id="coupon-type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as CouponForm['type'] }))} className={RESOURCE_INPUT_CLASS} disabled={busy}><option value="PERCENTAGE">Persentase (%)</option><option value="FIXED">Potongan tetap (IDR)</option></select></div>
            <div><label htmlFor="coupon-value" className={RESOURCE_LABEL_CLASS}>Nilai diskon</label><input id="coupon-value" type="number" min="1" max={form.type === 'PERCENTAGE' ? 100 : undefined} value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} className={RESOURCE_INPUT_CLASS} disabled={busy} />{fieldErrors.value && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.value}</p>}</div>
            <div><label htmlFor="coupon-minimum" className={RESOURCE_LABEL_CLASS}>Minimal pembelian</label><input id="coupon-minimum" type="number" min="0" value={form.minPurchase} onChange={(event) => setForm((current) => ({ ...current, minPurchase: event.target.value }))} className={RESOURCE_INPUT_CLASS} disabled={busy} />{fieldErrors.minPurchase && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.minPurchase}</p>}</div>
            <div><label htmlFor="coupon-usage" className={RESOURCE_LABEL_CLASS}>Batas penggunaan</label><input id="coupon-usage" type="number" min="1" value={form.maxUsage} onChange={(event) => setForm((current) => ({ ...current, maxUsage: event.target.value }))} className={RESOURCE_INPUT_CLASS} disabled={busy} />{fieldErrors.maxUsage && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.maxUsage}</p>}</div>
            <div><label htmlFor="coupon-email-limit" className={RESOURCE_LABEL_CLASS}>Batas per email</label><input id="coupon-email-limit" type="number" min="1" value={form.perEmailLimit} onChange={(event) => setForm((current) => ({ ...current, perEmailLimit: event.target.value }))} className={RESOURCE_INPUT_CLASS} disabled={busy} />{fieldErrors.perEmailLimit && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.perEmailLimit}</p>}</div>
            <div><label htmlFor="coupon-start" className={RESOURCE_LABEL_CLASS}>Mulai berlaku</label><input id="coupon-start" type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} className={RESOURCE_INPUT_CLASS} disabled={busy} />{fieldErrors.startsAt && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.startsAt}</p>}</div>
            <div><label htmlFor="coupon-end" className={RESOURCE_LABEL_CLASS}>Berakhir</label><input id="coupon-end" type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} className={RESOURCE_INPUT_CLASS} disabled={busy} />{fieldErrors.endsAt && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.endsAt}</p>}</div>
          </div>
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${form.isActive ? 'border-[#6657E8] bg-[#6657E8]/5' : 'border-[#E5E2D9] bg-[#FCFBF7]'}`}><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-[#6657E8]" disabled={busy} /><span><span className="block text-xs font-semibold text-[#111111]">Kupon aktif</span><span className="mt-1 block text-[11px] leading-5 text-[#686660]">Checkout tetap memeriksa periode dan batas penggunaan walaupun status ini aktif.</span></span></label>
        </form>
      </ResponsiveDialog>

      {deleting && <DeleteResourceDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onDeleted={() => router.refresh()} endpoint={`/api/admin/coupons/${deleting.id}`} resourceLabel={deleting.code} description="Kupon yang belum pernah dipakai akan dihapus permanen dari daftar promosi." />}
    </>
  );
}
