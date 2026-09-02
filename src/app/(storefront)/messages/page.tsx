import { Suspense } from 'react';
import { MessageCenter } from '@/components/messaging/MessageCenter';

export default function CustomerMessagesPage() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 md:px-12 md:py-14">
      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6657E8]">Akun Pelanggan</p>
        <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.03em] text-[#111111]">Pesan</h1>
        <p className="mt-2 text-sm text-[#686660]">Percakapan privat dengan penjual untuk setiap pesananmu.</p>
      </div>
      <Suspense fallback={<div className="h-[680px] animate-pulse rounded-2xl bg-white" />}>
        <MessageCenter mode="customer" />
      </Suspense>
    </div>
  );
}

