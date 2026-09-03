'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Save, TriangleAlert } from 'lucide-react';

interface StoreSettingsFormProps {
  initialStoreName: string;
  initialNotificationEmail: string;
  initialSupportWhatsapp: string;
}

type FieldErrors = Partial<Record<'storeName' | 'notificationEmail' | 'supportWhatsapp', string[]>>;

const inputClass =
  'w-full rounded-xl border border-[#E5E2D9] bg-[#F8F6F0] px-4 py-3 text-xs text-[#111111] outline-none transition-colors focus:border-[#6657E8] focus:ring-2 focus:ring-[#6657E8]/15 disabled:cursor-not-allowed disabled:opacity-60';

export function StoreSettingsForm({
  initialStoreName,
  initialNotificationEmail,
  initialSupportWhatsapp,
}: StoreSettingsFormProps) {
  const [values, setValues] = useState({
    storeName: initialStoreName,
    notificationEmail: initialNotificationEmail,
    supportWhatsapp: initialSupportWhatsapp,
  });
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const update = (field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setFieldErrors({});
    setFeedback(null);
    try {
      const response = await fetch('/api/admin/settings/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
        fieldErrors?: FieldErrors;
      };
      if (!response.ok || !result.success) {
        setFieldErrors(result.fieldErrors || {});
        throw new Error(result.error || 'Gagal menyimpan pengaturan toko.');
      }
      setFeedback({ tone: 'success', message: result.message || 'Pengaturan toko berhasil disimpan.' });
    } catch (cause: unknown) {
      setFeedback({
        tone: 'error',
        message: cause instanceof Error ? cause.message : 'Gagal menyimpan pengaturan toko.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="store-name" className="mb-1.5 block text-xs font-semibold text-[#111111]">
          Nama Webstore *
        </label>
        <input
          id="store-name"
          type="text"
          value={values.storeName}
          onChange={(event) => update('storeName', event.target.value)}
          className={inputClass}
          disabled={busy}
          autoComplete="organization"
          aria-invalid={Boolean(fieldErrors.storeName)}
          aria-describedby={fieldErrors.storeName ? 'store-name-error' : undefined}
        />
        {fieldErrors.storeName?.[0] && <p id="store-name-error" className="mt-1.5 text-xs text-[#B42318]">{fieldErrors.storeName[0]}</p>}
      </div>

      <div>
        <label htmlFor="notification-email" className="mb-1.5 block text-xs font-semibold text-[#111111]">
          Email Pengirim Notifikasi *
        </label>
        <input
          id="notification-email"
          type="email"
          value={values.notificationEmail}
          onChange={(event) => update('notificationEmail', event.target.value)}
          className={inputClass}
          disabled={busy}
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.notificationEmail)}
          aria-describedby={fieldErrors.notificationEmail ? 'notification-email-error' : 'notification-email-help'}
        />
        <p id="notification-email-help" className="mt-1.5 text-[11px] leading-5 text-[#686660]">
          Disimpan sebagai identitas operasional; pengiriman email belum diaktifkan.
        </p>
        {fieldErrors.notificationEmail?.[0] && <p id="notification-email-error" className="mt-1.5 text-xs text-[#B42318]">{fieldErrors.notificationEmail[0]}</p>}
      </div>

      <div>
        <label htmlFor="support-whatsapp" className="mb-1.5 block text-xs font-semibold text-[#111111]">
          WhatsApp Dukungan Pembeli
        </label>
        <input
          id="support-whatsapp"
          type="tel"
          value={values.supportWhatsapp}
          onChange={(event) => update('supportWhatsapp', event.target.value)}
          className={inputClass}
          disabled={busy}
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={Boolean(fieldErrors.supportWhatsapp)}
          aria-describedby={fieldErrors.supportWhatsapp ? 'support-whatsapp-error' : undefined}
        />
        {fieldErrors.supportWhatsapp?.[0] && <p id="support-whatsapp-error" className="mt-1.5 text-xs text-[#B42318]">{fieldErrors.supportWhatsapp[0]}</p>}
      </div>

      {feedback && (
        <div
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${feedback.tone === 'success' ? 'border-[#187A4A]/20 bg-[#187A4A]/8 text-[#187A4A]' : 'border-[#B42318]/20 bg-[#B42318]/8 text-[#B42318]'}`}
        >
          {feedback.tone === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="flex justify-end border-t border-[#E5E2D9] pt-5">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#6657E8] px-6 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#5244D2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#B8B3DF]"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Save className="h-4 w-4" />}
          {busy ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </form>
  );
}
