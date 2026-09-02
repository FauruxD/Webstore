'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Plus, Trash2, Users } from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/dialog';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { formatRupiah } from '@/lib/utils/invoice';
import {
  DeleteResourceDialog,
  RESOURCE_ERROR_CLASS,
  RESOURCE_INPUT_CLASS,
  RESOURCE_LABEL_CLASS,
  ResourceFormError,
  ResourceSubmitFooter,
} from '@/components/admin/resources/ResourceDialogParts';

export interface CustomerRow {
  id: string;
  displayName: string;
  emailNormalized: string;
  whatsapp: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  isRegistered: boolean;
  canDelete: boolean;
}

interface CustomerForm {
  displayName: string;
  emailNormalized: string;
  whatsapp: string;
}

const EMPTY_FORM: CustomerForm = { displayName: '', emailNormalized: '', whatsapp: '' };

export function CustomerManager({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CustomerRow | null | 'new'>(null);
  const [deleting, setDeleting] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError(null);
    setEditing('new');
  };

  const openEdit = (customer: CustomerRow) => {
    setForm({
      displayName: customer.displayName,
      emailNormalized: customer.emailNormalized,
      whatsapp: customer.whatsapp || '',
    });
    setFieldErrors({});
    setFormError(null);
    setEditing(customer);
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
      const response = await fetch(
        isNew ? '/api/admin/customers' : `/api/admin/customers/${editing.id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
      );
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
      };
      if (!response.ok || !data.success) {
        setFieldErrors(data.fieldErrors || {});
        throw new Error(data.error || 'Gagal menyimpan pelanggan.');
      }
      setEditing(null);
      router.refresh();
    } catch (cause: unknown) {
      setFormError(cause instanceof Error ? cause.message : 'Gagal menyimpan pelanggan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="admin-surface w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2D9] p-4 sm:p-5">
          <div>
            <p className="text-sm font-semibold text-[#111111]">{customers.length} profil pelanggan</p>
            <p className="mt-1 text-[11px] text-[#686660]">Perubahan profil tidak mengubah snapshot pembeli pada invoice lama.</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#6657E8] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#5244D2] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2">
            <Plus className="h-4 w-4" /> Tambah Pelanggan
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>Nama Pelanggan</th><th>Tipe</th><th>Kontak</th><th>Total Order</th><th>Total Belanja</th><th>Order Terakhir</th><th className="text-right">Aksi</th></tr></thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} className="p-4"><AdminEmptyState title="Belum Ada Pelanggan" description="Data pelanggan tercatat setelah checkout atau dapat dibuat secara manual." icon={Users} /></td></tr>
              ) : customers.map((customer) => (
                <tr key={customer.id}>
                  <td><span className="admin-cell-title">{customer.displayName}</span></td>
                  <td><span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-semibold ${customer.isRegistered ? 'bg-[#E8F3EC] text-[#187A4A]' : 'bg-[#F1EEE6] text-[#686660]'}`}>{customer.isRegistered ? 'Akun' : 'Guest'}</span></td>
                  <td><span className="block font-mono text-[11px] text-[#111111]">{customer.emailNormalized}</span><span className="mt-1 block font-mono text-[10px] text-[#686660]">{customer.whatsapp || 'WhatsApp belum diisi'}</span></td>
                  <td className="whitespace-nowrap font-mono font-semibold">{customer.orderCount} order</td>
                  <td className="whitespace-nowrap font-semibold tabular-nums text-[#6657E8]">{formatRupiah(customer.totalSpent)}</td>
                  <td className="whitespace-nowrap text-[#686660]">{customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum ada order'}</td>
                  <td className="whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button type="button" onClick={() => openEdit(customer)} aria-label={`Edit ${customer.displayName}`} className="rounded-lg border border-[#E5E2D9] bg-white p-2 text-[#686660] transition-colors hover:border-[#6657E8] hover:text-[#6657E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8]"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => setDeleting(customer)} disabled={!customer.canDelete} aria-label={`Hapus ${customer.displayName}`} title={customer.canDelete ? 'Hapus pelanggan' : customer.isRegistered ? 'Akun terdaftar tidak dapat dihapus dari daftar pelanggan' : 'Riwayat transaksi melindungi pelanggan dari penghapusan'} className="rounded-lg border border-[#E5E2D9] bg-white p-2 text-[#686660] transition-colors hover:border-[#B42318] hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318] disabled:cursor-not-allowed disabled:opacity-35"><Trash2 className="h-3.5 w-3.5" /></button>
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
        size="md"
        dismissible={!busy}
        title={editing === 'new' ? 'Tambah Pelanggan' : 'Edit Pelanggan'}
        description="Profil ini digunakan sebagai identitas akses pelanggan. Detail invoice lama tetap disimpan sebagai snapshot."
        footer={<ResourceSubmitFooter busy={busy} onCancel={closeEditor} onSubmit={submit} submitLabel={editing === 'new' ? 'Buat Pelanggan' : 'Simpan Perubahan'} />}
      >
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }} noValidate>
          <ResourceFormError message={formError} />
          <div><label htmlFor="customer-name" className={RESOURCE_LABEL_CLASS}>Nama pelanggan</label><input id="customer-name" value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} className={RESOURCE_INPUT_CLASS} disabled={busy} autoFocus />{fieldErrors.displayName && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.displayName}</p>}</div>
          <div><label htmlFor="customer-email" className={RESOURCE_LABEL_CLASS}>Email</label><input id="customer-email" type="email" value={form.emailNormalized} onChange={(event) => setForm((current) => ({ ...current, emailNormalized: event.target.value }))} className={`${RESOURCE_INPUT_CLASS} font-mono`} disabled={busy} autoComplete="email" />{fieldErrors.emailNormalized && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.emailNormalized}</p>}</div>
          <div><label htmlFor="customer-whatsapp" className={RESOURCE_LABEL_CLASS}>Nomor WhatsApp</label><input id="customer-whatsapp" type="tel" value={form.whatsapp} onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))} placeholder="0812 3456 7890" className={`${RESOURCE_INPUT_CLASS} font-mono`} disabled={busy} autoComplete="tel" />{fieldErrors.whatsapp && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.whatsapp}</p>}</div>
        </form>
      </ResponsiveDialog>

      {deleting && <DeleteResourceDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onDeleted={() => router.refresh()} endpoint={`/api/admin/customers/${deleting.id}`} resourceLabel={deleting.displayName} description="Profil pelanggan tanpa transaksi akan dihapus permanen. Riwayat invoice tidak pernah ikut dihapus." />}
    </>
  );
}
