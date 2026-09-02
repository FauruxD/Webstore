import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function CustomerNotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 md:px-12 md:py-14">
      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6657E8]">Akun Pelanggan</p>
        <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.03em] text-[#111111]">Notifikasi</h1>
        <p className="mt-2 text-sm text-[#686660]">Pembaruan pembayaran, pengiriman produk, dan status pesanan.</p>
      </div>
      <NotificationCenter />
    </div>
  );
}

