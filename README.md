# Digital Atelier Webstore

Next.js 15 webstore untuk produk digital dengan guest checkout, QRIS statis, verifikasi pembayaran manual, customer–admin messaging, notifikasi dalam aplikasi, dan secure download.

## Stack

- Next.js 15 App Router, React 19, TypeScript strict
- Prisma ORM dan MySQL 8
- Tailwind CSS v4, Lucide, GSAP/Framer Motion
- Penyimpanan privat lokal dengan abstraksi S3/R2
- Vitest dan Playwright

## Menjalankan MySQL lokal

Persyaratan: Node.js 20+ dan Docker Desktop (atau server MySQL yang kompatibel).

```bash
cp .env.example .env
docker compose up -d mysql
npm install
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Konfigurasi Compose menggunakan:

```env
DATABASE_URL="mysql://digital_atelier:password@localhost:3306/digital_atelier"
```

Container memakai MySQL 8, volume `digital_atelier_mysql_data`, health check, dan port lokal `3306`. Ganti semua kredensial dan session secret sebelum deployment.

Untuk membuat migration baru saat mengembangkan schema:

```bash
npm run db:migrate -- --name nama_perubahan
```

## Memindahkan data SQLite lama

File SQLite lama tidak dihapus. Database aktif sebelumnya tetap tersedia di `prisma/dev.db` dan migration SQLite lama diarsipkan di `prisma/sqlite-migrations/`.

Setelah MySQL dimigrasikan tetapi sebelum seed, jalankan:

```bash
npm run db:import-sqlite
npm run db:seed
```

Importer membuka SQLite dalam mode read-only, memetakan status lama `PAYMENT_VERIFIED` menjadi `PAYMENT_APPROVED` dan `PRODUCT_DELIVERED` menjadi `PRODUCT_SENT`, membuat `CustomerAccess` serta satu conversation untuk tiap order lama, lalu memindahkan data ke MySQL. Importer menolak target yang sudah berisi order; gunakan argumen `--merge` secara sadar jika perlu mengulang import dengan duplicate skipping.

## Akses dan alur

- Admin: `/admin/login`
- Pusat pesan admin: `/admin/messages`
- Order admin: `/admin/orders`
- Pesan pelanggan: `/messages`
- Notifikasi pelanggan: `/notifications`
- Lacak order: `/track-order`

Guest customer dilindungi signed HttpOnly session yang terikat ke `CustomerAccess`. Customer hanya bisa membuka order, conversation, notifikasi, dan entitlement miliknya. Akses produk memakai route download terotorisasi; path storage dan token hash tidak dikirim ke browser.

Status order utama:

```txt
PENDING_PAYMENT
WAITING_VERIFICATION
PAYMENT_REJECTED
PAYMENT_APPROVED
PRODUCT_SENT
COMPLETED
```

Persetujuan pembayaran tidak otomatis mengirim produk. Admin harus memilih `Kirim Produk`, lalu dapat memilih `Tandai Pesanan Selesai` setelah akses dibuat.

### File pengiriman dan lampiran pesan

- Pada status `PAYMENT_APPROVED`, admin wajib memilih file produk sebelum menekan `Kirim Produk` dan dapat menambahkan catatan maksimal 1.000 karakter.
- File kiriman maksimal 100 MB dan disimpan sebagai `FileAsset` privat yang ditautkan langsung ke entitlement order. Download tidak lagi bergantung pada path file atau versi produk yang terlihat oleh browser.
- Admin dan pelanggan dapat menyertakan satu gambar, PDF, ZIP, TXT, atau dokumen Office per pesan dengan ukuran maksimal 10 MB.
- Gambar ditampilkan sebagai preview; file lain menjadi tautan download. Keduanya hanya tersedia melalui `/api/conversation-attachments/[id]` setelah authorization peserta conversation atau admin berhasil.
- SVG, HTML, script, dan executable tidak diterima sebagai attachment.

## Verifikasi

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Email notifikasi sengaja tidak digunakan pada fase ini; semua event customer dikirim melalui notification center dalam aplikasi.
