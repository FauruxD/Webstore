import React from 'react';

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
      <h1 className="font-serif text-4xl font-bold text-[#111111]">Pertanyaan Umum (FAQ)</h1>
      
      <div className="space-y-6 text-sm text-[#686660]">
        <div className="bg-white p-6 rounded-2xl border border-[#DAD6CD] space-y-2">
          <h3 className="font-bold text-base text-[#111111]">Bagaimana cara membeli produk digital?</h3>
          <p>Pilih produk yang kamu inginkan, klik Beli Sekarang atau Tambah ke Keranjang, isi nama, email, dan WhatsApp, lalu bayar via QRIS statis.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#DAD6CD] space-y-2">
          <h3 className="font-bold text-base text-[#111111]">Apakah saya harus membuat akun?</h3>
          <p>Tidak. Seluruh transaksi di Digital Atelier mendukung Guest Checkout. Link akses produk akan dikirim langsung via email dan halaman tracking terenkripsi.</p>
        </div>
      </div>
    </div>
  );
}
