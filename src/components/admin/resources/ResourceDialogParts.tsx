'use client';

import React, { useState } from 'react';
import { AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/dialog';

export const RESOURCE_INPUT_CLASS =
  'w-full rounded-xl border border-[#DAD6CD] bg-[#FCFBF7] px-3.5 py-2.5 text-xs text-[#111111] outline-none transition-colors placeholder:text-[#8F8B80] focus:border-[#6657E8] focus:ring-2 focus:ring-[#6657E8]/15 disabled:cursor-not-allowed disabled:opacity-60';
export const RESOURCE_LABEL_CLASS = 'mb-1.5 block text-xs font-semibold text-[#111111]';
export const RESOURCE_ERROR_CLASS = 'mt-1.5 text-[11px] leading-relaxed text-[#B42318]';

export function ResourceFormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-[#B42318]/20 bg-[#B42318]/8 p-3 text-xs text-[#B42318]">
      <AlertCircle className="mt-px h-4 w-4 shrink-0" strokeWidth={1.8} />
      <span>{message}</span>
    </div>
  );
}

interface ResourceSubmitFooterProps {
  busy: boolean;
  onCancel: () => void;
  submitLabel: string;
  onSubmit: () => void;
}

export function ResourceSubmitFooter({
  busy,
  onCancel,
  submitLabel,
  onSubmit,
}: ResourceSubmitFooterProps) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#686660] transition-colors hover:bg-[#F4F1EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] disabled:opacity-50"
      >
        Batal
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6657E8] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#5244D2] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {submitLabel}
      </button>
    </div>
  );
}

interface DeleteResourceDialogProps {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  endpoint: string;
  resourceLabel: string;
  description: string;
}

export function DeleteResourceDialog({
  open,
  onClose,
  onDeleted,
  endpoint,
  resourceLabel,
  description,
}: DeleteResourceDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { method: 'DELETE' });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) throw new Error(data.error || 'Gagal menghapus data.');
      onDeleted();
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Gagal menghapus data.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      surface="admin"
      size="md"
      dismissible={!busy}
      title={`Hapus ${resourceLabel}`}
      description="Tindakan ini hanya diizinkan apabila data belum terhubung dengan riwayat operasional."
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#686660] hover:bg-[#F4F1EA] disabled:opacity-50">
            Batal
          </button>
          <button type="button" onClick={handleDelete} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B42318] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#961C13] active:translate-y-px disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Hapus Permanen
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
          <p className="text-sm font-semibold text-[#111111]">{resourceLabel}</p>
          <p className="mt-2 text-xs leading-5 text-[#686660]">{description}</p>
        </div>
        <ResourceFormError message={error} />
      </div>
    </ResponsiveDialog>
  );
}
