'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function CustomerOrdersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-[720px] items-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-2xl border border-[#B42318]/20 bg-white p-7 text-center sm:p-10">
        <AlertCircle className="mx-auto h-9 w-9 text-[#B42318]" aria-hidden="true" />
        <h1 className="mt-6 font-display text-3xl font-medium text-[#111111]">Pesanan belum dapat dimuat.</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#686660]">Terjadi kendala saat mengambil data pesananmu. Coba muat kembali halaman ini.</p>
        <button type="button" onClick={reset} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white hover:bg-[#6657E8] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6657E8]">
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </button>
      </section>
    </div>
  );
}
