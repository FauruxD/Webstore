'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react';

type AuthMode = 'login' | 'register';

interface CustomerAuthFormProps {
  mode: AuthMode;
  nextPath: string;
}

interface FormState {
  displayName: string;
  email: string;
  whatsapp: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_FORM: FormState = {
  displayName: '',
  email: '',
  whatsapp: '',
  password: '',
  confirmPassword: '',
};

const inputClass = 'w-full rounded-xl border border-[#DAD6CD] bg-[#F8F6F0] py-3 pl-10 pr-4 text-sm text-[#111111] outline-none transition-colors placeholder:text-[#77736B] focus:border-[#6657E8] focus:ring-2 focus:ring-[#6657E8]/15 disabled:cursor-not-allowed disabled:opacity-60';

export function CustomerAuthForm({ mode, nextPath }: CustomerAuthFormProps) {
  const router = useRouter();
  const isRegister = mode === 'register';
  const [form, setForm] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (isRegister && form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Konfirmasi password tidak sama' });
      return;
    }

    setBusy(true);
    try {
      const endpoint = isRegister ? '/api/customer/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          next: nextPath,
          ...(isRegister ? { displayName: form.displayName, whatsapp: form.whatsapp } : {}),
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        redirectUrl?: string;
        fieldErrors?: Record<string, string>;
      };
      if (!response.ok || !data.success) {
        setFieldErrors(data.fieldErrors || {});
        throw new Error(data.error || 'Autentikasi gagal. Silakan coba lagi.');
      }

      router.push(data.redirectUrl || '/account');
      router.refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Autentikasi gagal. Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const alternateHref = `${isRegister ? '/login' : '/register'}?next=${encodeURIComponent(nextPath)}`;

  return (
    <section className="flex min-h-[calc(100dvh-5rem)] items-center px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto grid w-full max-w-[1080px] overflow-hidden rounded-[28px] border border-[#DAD6CD] bg-white shadow-[0_30px_80px_-56px_rgba(17,17,17,0.55)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
          <Link href="/" className="mb-10 inline-flex w-fit items-center gap-2.5 text-sm font-semibold text-[#111111] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6657E8]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] font-display text-base text-[#F8F6F0]">A</span>
            Digital Atelier
          </Link>

          <div className="max-w-md">
            <h1 className="font-display text-4xl font-medium tracking-[-0.035em] text-[#111111] sm:text-5xl">
              {isRegister ? 'Buat akun pelanggan.' : 'Selamat datang kembali.'}
            </h1>
            <p className="mt-3 max-w-[44ch] text-sm leading-6 text-[#686660]">
              {isRegister
                ? 'Simpan pesanan, pesan, notifikasi, dan akses unduhan dalam satu sesi aman.'
                : 'Satu pintu masuk untuk pelanggan dan admin. Akses berikutnya disesuaikan otomatis dengan peran akunmu.'}
            </p>
          </div>

          {error && (
            <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-[#B42318]/25 bg-[#B42318]/8 p-3.5 text-sm text-[#9D1D14]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            {isRegister && (
              <div>
                <label htmlFor="customer-auth-name" className="mb-1.5 block text-xs font-semibold text-[#111111]">Nama lengkap</label>
                <div className="relative"><UserRound className="absolute left-3.5 top-3.5 h-4 w-4 text-[#686660]" /><input id="customer-auth-name" value={form.displayName} onChange={(event) => update('displayName', event.target.value)} className={inputClass} autoComplete="name" disabled={busy} aria-invalid={Boolean(fieldErrors.displayName)} /></div>
                {fieldErrors.displayName && <p className="mt-1.5 text-xs text-[#B42318]">{fieldErrors.displayName}</p>}
              </div>
            )}

            <div>
              <label htmlFor="customer-auth-email" className="mb-1.5 block text-xs font-semibold text-[#111111]">Email</label>
              <div className="relative"><Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#686660]" /><input id="customer-auth-email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} className={inputClass} autoComplete="email" inputMode="email" disabled={busy} aria-invalid={Boolean(fieldErrors.email)} /></div>
              {fieldErrors.email && <p className="mt-1.5 text-xs text-[#B42318]">{fieldErrors.email}</p>}
            </div>

            {isRegister && (
              <div>
                <label htmlFor="customer-auth-phone" className="mb-1.5 block text-xs font-semibold text-[#111111]">WhatsApp <span className="font-normal text-[#686660]">(opsional)</span></label>
                <div className="relative"><Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-[#686660]" /><input id="customer-auth-phone" type="tel" value={form.whatsapp} onChange={(event) => update('whatsapp', event.target.value)} className={inputClass} autoComplete="tel" inputMode="tel" disabled={busy} placeholder="0812 3456 7890" aria-invalid={Boolean(fieldErrors.whatsapp)} /></div>
                {fieldErrors.whatsapp && <p className="mt-1.5 text-xs text-[#B42318]">{fieldErrors.whatsapp}</p>}
              </div>
            )}

            <div>
              <label htmlFor="customer-auth-password" className="mb-1.5 block text-xs font-semibold text-[#111111]">Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-[#686660]" />
                <input id="customer-auth-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => update('password', event.target.value)} className={`${inputClass} pr-11`} autoComplete={isRegister ? 'new-password' : 'current-password'} disabled={busy} aria-invalid={Boolean(fieldErrors.password)} />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-2.5 top-2.5 rounded-lg p-1.5 text-[#686660] hover:bg-white hover:text-[#111111] focus-visible:outline-2 focus-visible:outline-[#6657E8]" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              {fieldErrors.password ? <p className="mt-1.5 text-xs text-[#B42318]">{fieldErrors.password}</p> : isRegister ? <p className="mt-1.5 text-xs text-[#686660]">Minimal 8 karakter, berisi huruf dan angka.</p> : null}
            </div>

            {isRegister && (
              <div>
                <label htmlFor="customer-auth-confirm" className="mb-1.5 block text-xs font-semibold text-[#111111]">Konfirmasi password</label>
                <div className="relative"><CheckCircle2 className="absolute left-3.5 top-3.5 h-4 w-4 text-[#686660]" /><input id="customer-auth-confirm" type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} className={inputClass} autoComplete="new-password" disabled={busy} aria-invalid={Boolean(fieldErrors.confirmPassword)} /></div>
                {fieldErrors.confirmPassword && <p className="mt-1.5 text-xs text-[#B42318]">{fieldErrors.confirmPassword}</p>}
              </div>
            )}

            <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111111] px-5 py-3.5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-[#6657E8] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8] disabled:cursor-wait disabled:opacity-60">
              <span>{busy ? 'Memproses...' : isRegister ? 'Buat Akun' : 'Masuk'}</span>
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-sm text-[#686660]">
            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <Link href={alternateHref} className="font-semibold text-[#6657E8] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]">
              {isRegister ? 'Masuk' : 'Daftar sekarang'}
            </Link>
          </p>
        </div>

        <aside className="relative hidden min-h-[680px] overflow-hidden bg-[#E8E4FF] p-12 lg:flex lg:flex-col lg:justify-between" aria-label="Pratinjau koleksi Digital Atelier">
          <div className="relative z-10 max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5147B8]">Akses sesuai peran</p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-[1.08] tracking-[-0.035em] text-[#111111]">Pesanan, percakapan, dan operasional dalam satu pintu yang aman.</h2>
          </div>
          <div className="relative z-10 mt-10 overflow-hidden rounded-2xl border border-white/70 bg-white/60 p-3 shadow-[0_24px_60px_-42px_rgba(52,43,139,0.8)]">
            <Image src="/images/products/ui-kit-dashboard.svg" alt="Pratinjau produk digital Digital Atelier" width={760} height={520} priority className="h-auto w-full rounded-xl" />
          </div>
        </aside>
      </div>
    </section>
  );
}
