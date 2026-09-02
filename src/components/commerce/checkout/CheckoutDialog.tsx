'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/dialog';
import { formatRupiah } from '@/lib/utils/invoice';
import { cn } from '@/lib/utils/cn';
import { OrderPaymentStep } from './OrderPaymentStep';

export interface CheckoutLineItem {
  id: string;
  name: string;
  license: string;
  price: number;
  salePrice?: number | null;
}

export interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  items: CheckoutLineItem[];
  qrisUrl: string;
  merchantName: string;
  /** Clears the guest cart after a cart-driven checkout succeeds. */
  onOrderCreated?: () => void;
}

interface CreatedOrder {
  invoice: string;
  total: number;
  expiresAt: string;
  trackingUrl: string;
}

interface PromoState {
  status: 'idle' | 'checking' | 'valid' | 'invalid';
  discount: number;
  message: string | null;
}

const INPUT_CLASS =
  'w-full rounded-xl border border-[#DAD6CD] bg-[#F4F1EA] px-4 py-3 text-xs text-[#111111] transition-colors focus:border-[#6657E8] focus:outline-none disabled:opacity-60';
const LABEL_CLASS = 'mb-1.5 block text-xs font-semibold text-[#111111]';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function newIdempotencyKey(): string {
  return `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Guest checkout without leaving the product page. Posts to the same
 * `/api/checkout` endpoint the standalone page uses, then swaps this dialog to
 * the QRIS payment step instead of redirecting.
 */
export function CheckoutDialog({
  open,
  onClose,
  items,
  qrisUrl,
  merchantName,
  onOrderCreated,
}: CheckoutDialogProps) {
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [order, setOrder] = useState<CreatedOrder | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [isRegisteredCustomer, setIsRegisteredCustomer] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [promo, setPromo] = useState<PromoState>({
    status: 'idle',
    discount: 0,
    message: null,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  // A second click must never create a second order, even if React re-renders
  // before `isSubmitting` lands.
  const submitLockRef = useRef(false);
  const idempotencyKeyRef = useRef(newIdempotencyKey());

  const subtotal = items.reduce((sum, item) => sum + (item.salePrice ?? item.price), 0);
  const discount = promo.status === 'valid' ? promo.discount : 0;
  const total = Math.max(0, subtotal - discount);

  // Every fresh open is a fresh order attempt, so it needs a fresh key.
  useEffect(() => {
    if (!open) return;

    idempotencyKeyRef.current = newIdempotencyKey();
    let active = true;

    void fetch('/api/customer/auth/session', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { customer?: { displayName: string; email: string; whatsapp: string | null; isRegistered: boolean } | null } | null) => {
        if (!active || !data?.customer) return;
        setCustomerName((current) => current || data.customer?.displayName || '');
        setCustomerEmail((current) => current || data.customer?.email || '');
        setCustomerWhatsapp((current) => current || data.customer?.whatsapp || '');
        setIsRegisteredCustomer(data.customer.isRegistered);
      })
      .catch(() => {
        // Checkout stays available if optional profile prefill fails.
      });

    return () => {
      active = false;
    };
  }, [open]);

  const resetAll = () => {
    setStep('form');
    setOrder(null);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerWhatsapp('');
    setIsRegisteredCustomer(false);
    setCouponCode('');
    setAgreeTerms(false);
    setPromo({ status: 'idle', discount: 0, message: null });
    setFieldErrors({});
    setError(null);
    setIsSubmitting(false);
    setSummaryOpen(false);
    submitLockRef.current = false;
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetAll();
    onClose();
  };

  const applyPromo = async () => {
    const code = couponCode.trim();
    if (!code) {
      setPromo({ status: 'idle', discount: 0, message: null });
      return;
    }

    setPromo({ status: 'checking', discount: 0, message: null });

    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          subtotal,
          customerEmail: EMAIL_PATTERN.test(customerEmail) ? customerEmail : '',
        }),
      });
      const data = await res.json();

      if (data.success && data.valid) {
        setPromo({
          status: 'valid',
          discount: data.discountAmount ?? 0,
          message: `Kode ${data.code ?? code.toUpperCase()} diterapkan.`,
        });
      } else {
        setPromo({
          status: 'invalid',
          discount: 0,
          message: data.reason ?? data.error ?? 'Kode promo tidak valid.',
        });
      }
    } catch {
      setPromo({
        status: 'invalid',
        discount: 0,
        message: 'Gagal memeriksa kode promo. Coba lagi.',
      });
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (customerName.trim().length < 2) next.customerName = 'Nama lengkap wajib diisi';
    if (!EMAIL_PATTERN.test(customerEmail.trim())) next.customerEmail = 'Format email tidak valid';
    if (customerWhatsapp.trim().length < 8) next.customerWhatsapp = 'Nomor WhatsApp tidak valid';
    if (!agreeTerms) next.agreeTerms = 'Kamu harus menyetujui Syarat & Ketentuan';
    if (items.length === 0) next.items = 'Belum ada produk yang dipilih';

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (submitLockRef.current) return;

    setError(null);
    if (!validate()) return;

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerWhatsapp: customerWhatsapp.trim(),
          items: items.map((item) => ({ productId: item.id })),
          couponCode: couponCode.trim() || undefined,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses checkout');
      }

      setOrder({
        invoice: data.invoice,
        total: data.order?.total ?? total,
        expiresAt: data.order?.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        trackingUrl: data.orderUrl,
      });
      setStep('payment');
      onOrderCreated?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan pada server');
      // Only unlock on failure. A created order must not be re-submitted.
      submitLockRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const summaryRows = (
    <div className="space-y-4">
      <div className="divide-y divide-[#DAD6CD]">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0">
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-[#111111]">{item.name}</span>
              <span className="text-[11px] text-[#686660]">{item.license}</span>
            </div>
            <div className="shrink-0 text-right">
              <span className="block text-xs font-bold tabular-nums text-[#111111]">
                {formatRupiah(item.salePrice ?? item.price)}
              </span>
              {item.salePrice != null && item.salePrice < item.price && (
                <span className="text-[11px] tabular-nums text-[#686660] line-through">
                  {formatRupiah(item.price)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-[#DAD6CD] pt-4 text-xs text-[#686660]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium tabular-nums text-[#111111]">{formatRupiah(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-[#187A4A]">
            <span>Diskon promo</span>
            <span className="font-medium tabular-nums">-{formatRupiah(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[#DAD6CD] pt-2 text-base font-bold text-[#111111]">
          <span>Total tagihan</span>
          <span className="tabular-nums text-[#6657E8]">{formatRupiah(total)}</span>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-[#F4F1EA] p-4 text-[11px] leading-relaxed text-[#686660]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#187A4A]" />
        <span>
          Pembayaran via QRIS statis dengan verifikasi manual admin. Kode QRIS muncul di langkah
          berikutnya tanpa berpindah halaman.
        </span>
      </div>
    </div>
  );

  const formFooter = (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs sm:hidden">
        <span className="text-[#686660]">Total tagihan</span>
        <span className="text-base font-bold tabular-nums text-[#6657E8]">
          {formatRupiah(total)}
        </span>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="rounded-xl px-4 py-3 text-xs font-semibold text-[#686660] transition-colors hover:bg-[#F4F1EA] disabled:cursor-not-allowed disabled:opacity-50 sm:py-2.5"
        >
          Batal
        </button>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSubmitting || items.length === 0}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#111111] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#6657E8] active:bg-[#5244d2] disabled:cursor-not-allowed disabled:bg-[#686660] disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Membuat Pesanan...</span>
            </>
          ) : (
            <>
              <span>Buat Pesanan &amp; Bayar QRIS</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const paymentFooter = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] text-[#686660]">
        Simpan nomor invoice untuk melacak status pesanan kapan saja.
      </p>
      <button
        type="button"
        onClick={handleClose}
        className="rounded-xl bg-[#111111] px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#6657E8] sm:py-2.5"
      >
        Selesai
      </button>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onClose={handleClose}
      size="xl"
      dismissible={!isSubmitting}
      title={step === 'form' ? 'Guest Checkout' : 'Pembayaran QRIS'}
      description={
        step === 'form'
          ? 'Isi data pembeli untuk menerima instruksi pembayaran dan akses file digital.'
          : 'Selesaikan pembayaran lalu unggah bukti transfer untuk diverifikasi admin.'
      }
      footer={step === 'form' ? formFooter : paymentFooter}
    >
      {step === 'payment' && order ? (
        <OrderPaymentStep
          invoice={order.invoice}
          total={order.total}
          expiresAt={order.expiresAt}
          qrisUrl={qrisUrl}
          merchantName={merchantName}
          trackingUrl={order.trackingUrl}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4 lg:col-span-7"
          >
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-[#B42318]/20 bg-[#B42318]/10 p-4 text-xs text-[#B42318]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className={LABEL_CLASS} htmlFor="checkout-name">
                Nama Lengkap *
              </label>
              <input
                id="checkout-name"
                type="text"
                placeholder="cth: Faishal R."
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.customerName)}
                className={INPUT_CLASS}
              />
              {fieldErrors.customerName && (
                <p className="mt-1.5 text-[11px] text-[#B42318]">{fieldErrors.customerName}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="checkout-email">
                Alamat Email (pengiriman file) *
              </label>
              <input
                id="checkout-email"
                type="email"
                placeholder="cth: faishal@example.com"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                disabled={isSubmitting || isRegisteredCustomer}
                aria-invalid={Boolean(fieldErrors.customerEmail)}
                className={INPUT_CLASS}
              />
              {isRegisteredCustomer && !fieldErrors.customerEmail && (
                <p className="mt-1.5 text-[11px] text-[#686660]">Email mengikuti akun yang sedang masuk.</p>
              )}
              {fieldErrors.customerEmail && (
                <p className="mt-1.5 text-[11px] text-[#B42318]">{fieldErrors.customerEmail}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="checkout-whatsapp">
                Nomor WhatsApp *
              </label>
              <input
                id="checkout-whatsapp"
                type="tel"
                placeholder="cth: 08123456789"
                value={customerWhatsapp}
                onChange={(event) => setCustomerWhatsapp(event.target.value)}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.customerWhatsapp)}
                className={INPUT_CLASS}
              />
              {fieldErrors.customerWhatsapp && (
                <p className="mt-1.5 text-[11px] text-[#B42318]">{fieldErrors.customerWhatsapp}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="checkout-coupon">
                Kode Promo (opsional)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-3.5 h-4 w-4 text-[#686660]" />
                  <input
                    id="checkout-coupon"
                    type="text"
                    placeholder="cth: DISKON10"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value);
                      setPromo({ status: 'idle', discount: 0, message: null });
                    }}
                    disabled={isSubmitting}
                    className={`${INPUT_CLASS} pl-9`}
                  />
                </div>
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={isSubmitting || promo.status === 'checking' || !couponCode.trim()}
                  className="shrink-0 rounded-xl bg-[#111111] px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#6657E8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {promo.status === 'checking' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Gunakan'
                  )}
                </button>
              </div>
              {promo.message && (
                <p
                  className={cn(
                    'mt-1.5 flex items-center gap-1.5 text-[11px]',
                    promo.status === 'valid' ? 'text-[#187A4A]' : 'text-[#B42318]',
                  )}
                >
                  {promo.status === 'valid' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>{promo.message}</span>
                </p>
              )}
            </div>

            {/* Mobile only: the summary lives above the submit button. */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setSummaryOpen((value) => !value)}
                aria-expanded={summaryOpen}
                className="flex w-full items-center justify-between rounded-2xl border border-[#DAD6CD] bg-white px-4 py-3 text-xs font-semibold text-[#111111]"
              >
                <span>Ringkasan pesanan</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-[#6657E8]">{formatRupiah(total)}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-[#686660] transition-transform',
                      summaryOpen && 'rotate-180',
                    )}
                  />
                </span>
              </button>
              {summaryOpen && (
                <div className="mt-3 rounded-2xl border border-[#DAD6CD] bg-white p-5">
                  {summaryRows}
                </div>
              )}
            </div>

            <div className="pt-1">
              <label className="flex cursor-pointer items-start gap-2.5 text-xs text-[#686660]">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(event) => setAgreeTerms(event.target.checked)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.agreeTerms)}
                  className="mt-0.5 rounded text-[#6657E8] focus:ring-[#6657E8]"
                />
                <span>
                  Saya menyetujui{' '}
                  <Link href="/terms" target="_blank" className="text-[#111111] underline">
                    Syarat &amp; Ketentuan
                  </Link>{' '}
                  dan Kebijakan Lisensi Digital.
                </span>
              </label>
              {fieldErrors.agreeTerms && (
                <p className="mt-1.5 text-[11px] text-[#B42318]">{fieldErrors.agreeTerms}</p>
              )}
            </div>

            {/* Lets Enter submit the form without a second visible button. */}
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
              Buat Pesanan &amp; Bayar QRIS
            </button>
          </form>

          <aside className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-0 rounded-3xl border border-[#DAD6CD] bg-white p-6">
              <h3 className="font-display mb-4 text-lg font-semibold text-[#111111]">
                Ringkasan Pesanan
              </h3>
              {summaryRows}
            </div>
          </aside>
        </div>
      )}
    </ResponsiveDialog>
  );
}
