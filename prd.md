# Product Requirements Document

## Webstore Produk Digital

*Cinematic storefront dengan QRIS statis, verifikasi manual, dan pengiriman produk digital yang aman*

| **Nama Proyek**    | [Nama Brand / Webstore] |
|--------------------|---------------------------|
| **Versi Dokumen**  | Draft v1.0                |
| **Tanggal**        | 1 Agustus 2026            |
| **Pemilik Produk** | FaRu                      |

*Status: siap digunakan sebagai baseline desain, pengembangan, dan QA MVP.*

# Kontrol Dokumen

| **Versi** | **Tanggal**    | **Penulis** | **Perubahan**                                     |
|-----------|----------------|-------------|---------------------------------------------------|
| 1.0       | 1 Agustus 2026 | Sol / FaRu  | Draft awal PRD untuk MVP webstore produk digital. |

## Asumsi Utama

- Webstore menjual produk digital seperti template, e-book, preset, aset desain, source code, atau file unduhan lainnya.

- Pembayaran MVP memakai QRIS statis; sistem tidak menerima callback pembayaran otomatis.

- Pembeli dapat checkout tanpa membuat akun.

- Admin memverifikasi pembayaran berdasarkan bukti unggahan dan riwayat transaksi merchant.

- Produk digital tersedia sebagai file unduhan atau tautan akses yang diberikan setelah pembayaran disetujui.

- Website dibuat responsif dan animasi berat disederhanakan pada perangkat mobile atau ketika reduced motion aktif.

## Daftar Bagian

| **No.** | **Bagian**                     |
|---------|--------------------------------|
| 1       | Ringkasan Produk               |
| 2       | Latar Belakang dan Masalah     |
| 3       | Tujuan, Metrik, dan Batasan    |
| 4       | Pengguna dan Peran             |
| 5       | Ruang Lingkup MVP              |
| 6       | User Journey dan Alur Utama    |
| 7       | Kebutuhan Fungsional           |
| 8       | Dashboard Admin                |
| 9       | Model Status dan Aturan Bisnis |
| 10      | Model Data Konseptual          |
| 11      | Kebutuhan Nonfungsional        |
| 12      | Analytics dan Pelaporan        |
| 13      | Desain dan Motion              |
| 14      | Risiko dan Mitigasi            |
| 15      | Rencana Rilis                  |
| 16      | Definition of Done dan UAT     |
| 17      | Open Decisions                 |

# 1. Ringkasan Produk

Webstore Produk Digital adalah platform penjualan langsung yang menggabungkan pengalaman visual premium dan animasi sinematik dengan proses pembelian yang sederhana. Pengguna dapat menjelajah katalog, melihat detail produk, checkout tanpa login, membayar melalui QRIS statis, mengunggah bukti pembayaran, memantau status pesanan, dan mengunduh produk setelah admin menyetujui pembayaran.

> **Proposisi nilai inti**  
> Bagian depan terasa seperti website brand premium; bagian transaksi tetap cepat, jelas, dan minim hambatan. Animasi tidak boleh menghalangi pembelian.

## 1.1 Visi Produk

Menciptakan webstore produk digital yang terasa eksklusif, dipercaya pembeli, mudah dikelola satu admin, dan dapat berkembang menuju pembayaran otomatis tanpa harus membangun ulang fondasi produk.

## 1.2 Prinsip Produk

- Clarity over spectacle: informasi harga, produk, pembayaran, dan status selalu lebih penting daripada animasi.

- Guest-first checkout: akun tidak menjadi hambatan untuk membeli.

- Trust by design: invoice, status order, kebijakan lisensi, dan riwayat aksi admin terlihat jelas.

- Secure delivery: file asli tidak diekspos langsung dan hanya dapat diakses oleh order yang valid.

- Progressive enhancement: pengalaman inti tetap berfungsi ketika animasi dikurangi atau JavaScript lambat.

# 2. Latar Belakang dan Masalah

Penjual produk digital membutuhkan kanal penjualan yang lebih kuat daripada sekadar mengirim QRIS dan file melalui chat. Proses manual penuh menimbulkan beberapa masalah: pembeli tidak mendapatkan status yang jelas, admin sulit melacak order, bukti pembayaran tersebar, risiko salah kirim meningkat, dan pengalaman brand terasa tidak konsisten.

## Masalah yang harus diselesaikan:

- Pembeli membutuhkan jalur pembelian yang jelas dari penemuan produk hingga menerima file.

- Admin membutuhkan antrean verifikasi pembayaran yang terstruktur dan dapat diaudit.

- Sistem harus mencegah akses file sebelum pembayaran disetujui.

- Tampilan harus memiliki identitas visual dan motion premium tanpa mengorbankan performa.

- Fondasi data harus siap untuk migrasi ke payment gateway otomatis di fase berikutnya.

# 3. Tujuan, Metrik, dan Batasan

## 3.1 Tujuan MVP

**1.** Memungkinkan pembeli menyelesaikan checkout produk digital tanpa akun.

**2.** Mencatat setiap order dengan invoice unik dan status yang dapat dilacak.

**3.** Menampilkan QRIS statis serta instruksi pembayaran yang tidak ambigu.

**4.** Memungkinkan upload dan upload ulang bukti pembayaran.

**5.** Memungkinkan admin menyetujui atau menolak pembayaran secara efisien.

**6.** Membuka akses unduhan secara otomatis setelah pembayaran disetujui.

**7.** Menyediakan storefront animatif yang cepat dan responsif.

## 3.2 Metrik Keberhasilan Awal

| **Metrik**               | **Definisi**                                          | **Target MVP**                                                                            |
|--------------------------|-------------------------------------------------------|-------------------------------------------------------------------------------------------|
| Checkout completion rate | Persentase checkout yang menghasilkan order.          | Baseline dikumpulkan; target awal ≥ 60% dari pengguna yang memulai checkout.              |
| Proof upload rate        | Persentase order belum dibayar yang mengunggah bukti. | ≥ 70% dalam 24 jam.                                                                       |
| Median verification time | Waktu dari bukti diunggah hingga keputusan admin.     | ≤ 2 jam pada jam operasional.                                                             |
| Successful delivery rate | Order terverifikasi yang berhasil membuka produk.     | ≥ 98%.                                                                                    |
| Support rate             | Order yang membutuhkan bantuan manual tambahan.       | \< 10%.                                                                                   |
| Core Web Vitals          | Kualitas pengalaman halaman utama dan katalog.        | Lulus pada mayoritas kunjungan mobile; animasi tidak menyebabkan layout shift signifikan. |

## 3.3 Non-Goals MVP

- Payment gateway dengan callback otomatis.

- Marketplace multi-vendor.

- Aplikasi mobile native.

- Affiliate, referral, atau komisi bertingkat.

- Subscription billing dan membership kompleks.

- Sistem review publik dan komunitas.

- WhatsApp Business API otomatis.

- DRM penuh atau pencegahan sempurna terhadap pembajakan file.

# 4. Pengguna dan Peran

| **Peran**              | **Kebutuhan Utama**                                                       | **Hak Akses**                                               |
|------------------------|---------------------------------------------------------------------------|-------------------------------------------------------------|
| Pengunjung             | Menemukan produk, memahami manfaat, melihat demo dan harga.               | Halaman publik, katalog, detail, FAQ.                       |
| Pembeli / Guest        | Checkout, membayar, upload bukti, cek status, mengunduh produk.           | Order miliknya melalui secure token.                        |
| Admin                  | Mengelola produk, memverifikasi pembayaran, mengelola file dan pelanggan. | Semua fungsi operasional melalui dashboard terautentikasi.  |
| Super Admin (opsional) | Mengelola admin lain dan konfigurasi sensitif.                            | Role management, audit, konfigurasi pembayaran dan storage. |

## 4.1 Persona Utama

Pembeli cepat: menemukan produk dari media sosial, membuka halaman produk di ponsel, ingin melihat preview, membayar QRIS, dan menerima file tanpa membuat akun.

Admin tunggal: mengelola katalog sekaligus memeriksa pembayaran. Membutuhkan daftar prioritas, bukti yang mudah diperbesar, keputusan satu klik dengan catatan, dan audit trail.

# 5. Ruang Lingkup MVP

| **Area**     | **Termasuk dalam MVP**                                                          | **Tidak Termasuk**                                |
|--------------|---------------------------------------------------------------------------------|---------------------------------------------------|
| Storefront   | Homepage animatif, katalog, kategori, pencarian, detail produk, produk terkait. | Personalisasi berbasis AI.                        |
| Commerce     | Cart opsional, buy now, checkout guest, invoice, kode promo sederhana.          | Multi-currency dan pajak kompleks.                |
| Payment      | QRIS statis, instruksi, upload bukti, verifikasi manual.                        | Callback, refund otomatis, split payment.         |
| Fulfillment  | Secure download, limit download, expiry, resend access.                         | Streaming course dan license key server kompleks. |
| Admin        | Dashboard, orders, verification queue, products, files, coupons, settings.      | Multi-tenant dan approval berlapis.               |
| Notification | Email transaksional dasar; notifikasi dashboard admin.                          | WhatsApp API dan push notification.               |
| Analytics    | Funnel dasar, revenue, produk terlaris, verification time.                      | Attribution multi-touch lanjutan.                 |

# 6. User Journey dan Alur Utama

## 6.1 Alur Pembelian Utama

**1.** Pengguna membuka homepage atau halaman produk dari tautan kampanye.

**2.** Pengguna melihat preview, harga, isi produk, kompatibilitas, dan lisensi.

**3.** Pengguna menekan Beli Sekarang atau menambahkan produk ke cart.

**4.** Pengguna mengisi nama, email, nomor WhatsApp, dan persetujuan syarat.

**5.** Sistem memvalidasi cart, menghitung diskon, membuat invoice, dan menyimpan order.

**6.** Halaman pembayaran menampilkan QRIS statis, nominal, expiry, dan instruksi.

**7.** Pengguna membayar melalui aplikasi yang mendukung QRIS, lalu mengunggah bukti.

**8.** Status order berubah menjadi Menunggu Verifikasi dan admin menerima notifikasi.

**9.** Admin mencocokkan nominal, identitas/waktu, bukti, dan transaksi merchant.

**10.** Jika disetujui, sistem mengaktifkan entitlement dan mengirim email akses.

**11.** Pengguna mengunduh produk dari halaman order dengan secure token.

## 6.2 Alur Penolakan dan Upload Ulang

**1.** Admin memilih Tolak Pembayaran dan wajib memilih/menulis alasan.

**2.** Status menjadi Pembayaran Ditolak; akses produk tetap terkunci.

**3.** Pembeli menerima email dan melihat alasan pada halaman order.

**4.** Pembeli dapat mengunggah bukti baru selama order belum expired/dibatalkan.

**5.** Status kembali menjadi Menunggu Verifikasi dan tercatat sebagai submission baru.

## 6.3 Alur Order Kedaluwarsa

Order yang belum memiliki bukti pembayaran hingga batas waktu berubah menjadi Kedaluwarsa. Order dengan bukti yang sudah masuk tidak boleh expired otomatis ketika masih menunggu keputusan admin. Admin dapat mengaktifkan kembali order bila diperlukan.

# 7. Kebutuhan Fungsional

*Prioritas menggunakan MoSCoW: Must, Should, Could, Won’t (untuk MVP).*

## 7.1 Storefront dan Navigasi

| **ID** | **Requirement**                                                                                                                    | **Prioritas** | **Acceptance Criteria**                                                    |
|--------|------------------------------------------------------------------------------------------------------------------------------------|---------------|----------------------------------------------------------------------------|
| SF-01  | Homepage menampilkan hero, featured products, kategori, benefit, testimoni/FAQ, dan CTA.                                           | Must          | Semua section dapat dibuka di mobile; CTA mengarah ke katalog atau produk. |
| SF-02  | Navigasi menyediakan Home, Products, Categories, FAQ, Track Order, dan Cart.                                                       | Must          | Menu desktop dan mobile dapat dioperasikan dengan keyboard/touch.          |
| SF-03  | Katalog mendukung pencarian, filter kategori, dan sorting dasar.                                                                   | Must          | Hasil berubah sesuai kata kunci/filter dan empty state tampil jelas.       |
| SF-04  | Product card menampilkan thumbnail, nama, harga, status diskon, dan CTA.                                                           | Must          | Data selalu konsisten dengan detail produk.                                |
| SF-05  | Halaman detail menampilkan preview, deskripsi, isi, format, ukuran, lisensi, kompatibilitas, changelog, FAQ, dan related products. | Must          | Produk tidak dapat dibeli bila draft/archived.                             |
| SF-06  | Quick view produk dari katalog.                                                                                                    | Could         | Modal/drawer dapat ditutup dan tidak memblokir navigasi aksesibel.         |

## 7.2 Cart dan Checkout

| **ID** | **Requirement**                                                                                         | **Prioritas** | **Acceptance Criteria**                                                                          |
|--------|---------------------------------------------------------------------------------------------------------|---------------|--------------------------------------------------------------------------------------------------|
| CO-01  | Pengguna dapat Beli Sekarang atau menambahkan produk ke cart.                                           | Must          | Item valid masuk cart; duplikasi mengikuti aturan produk.                                        |
| CO-02  | Cart menyimpan item di browser untuk guest.                                                             | Should        | Cart bertahan setelah refresh pada perangkat yang sama.                                          |
| CO-03  | Checkout meminta nama, email, WhatsApp, dan persetujuan terms/privacy.                                  | Must          | Validasi field tampil inline dan checkout tidak diproses bila invalid.                           |
| CO-04  | Kode promo mendukung diskon nominal/persentase, periode aktif, minimum transaksi, dan batas penggunaan. | Should        | Kode invalid/expired memberi alasan yang mudah dipahami.                                         |
| CO-05  | Sistem menghitung subtotal, diskon, unique code opsional, dan total.                                    | Must          | Total tersimpan sebagai snapshot pada order dan tidak berubah jika harga produk kemudian diedit. |
| CO-06  | Checkout bersifat idempotent untuk mencegah order ganda akibat klik berulang.                           | Must          | Request dengan idempotency key yang sama menghasilkan satu order.                                |

## 7.3 Invoice dan Pembayaran QRIS Statis

| **ID** | **Requirement**                                                                         | **Prioritas** | **Acceptance Criteria**                                                                             |
|--------|-----------------------------------------------------------------------------------------|---------------|-----------------------------------------------------------------------------------------------------|
| PY-01  | Sistem membuat invoice unik setelah checkout berhasil.                                  | Must          | Format unik, tidak mudah bentrok, dapat dicari admin.                                               |
| PY-02  | Halaman pembayaran menampilkan QRIS statis milik merchant.                              | Must          | Gambar QR dapat dipindai dan memiliki fallback download/open image.                                 |
| PY-03  | Halaman menampilkan total tepat, batas waktu, dan langkah pembayaran.                   | Must          | Nominal dan expiry sama dengan data order.                                                          |
| PY-04  | Sistem menjelaskan bahwa nominal mungkin perlu diinput manual pada aplikasi pembayaran. | Must          | Instruksi terlihat sebelum upload bukti.                                                            |
| PY-05  | Pembeli dapat menyalin invoice, nominal, dan link status order.                         | Should        | Aksi copy memberi feedback sukses/gagal.                                                            |
| PY-06  | Konfigurasi memungkinkan admin mengganti gambar QRIS dan nama merchant.                 | Must          | Perubahan hanya berlaku pada halaman pembayaran baru; order lama tetap menyimpan snapshot metadata. |

## 7.4 Upload Bukti Pembayaran

| **ID** | **Requirement**                                                                               | **Prioritas** | **Acceptance Criteria**                                                   |
|--------|-----------------------------------------------------------------------------------------------|---------------|---------------------------------------------------------------------------|
| UP-01  | Pembeli dapat mengunggah JPG, PNG, atau WebP dengan batas ukuran konfigurabel (default 5 MB). | Must          | File di luar tipe/ukuran ditolak sebelum disimpan.                        |
| UP-02  | Form bukti mencatat nama pengirim, waktu pembayaran, nominal, dan catatan opsional.           | Must          | Submission tersimpan bersama timestamp server.                            |
| UP-03  | File diganti nama secara aman dan disimpan di private storage.                                | Must          | URL storage asli tidak dapat diakses publik.                              |
| UP-04  | Setelah upload, status berubah menjadi Menunggu Verifikasi.                                   | Must          | Pembeli melihat konfirmasi dan admin mendapat item antrean.               |
| UP-05  | Pembeli dapat upload ulang setelah penolakan.                                                 | Must          | Submission lama tetap tersimpan untuk audit; yang terbaru ditandai aktif. |
| UP-06  | Sistem mendeteksi file bukti identik secara best-effort menggunakan hash.                     | Should        | Admin menerima peringatan duplikasi tanpa auto-reject.                    |

## 7.5 Tracking Order

| **ID** | **Requirement**                                                                         | **Prioritas** | **Acceptance Criteria**                                                      |
|--------|-----------------------------------------------------------------------------------------|---------------|------------------------------------------------------------------------------|
| TR-01  | Setiap order memiliki halaman status dengan secure random token.                        | Must          | Invoice saja tidak cukup untuk membuka detail sensitif.                      |
| TR-02  | Halaman menampilkan item, total, timeline status, catatan admin, dan aksi yang relevan. | Must          | Aksi menyesuaikan status: bayar/upload ulang/download.                       |
| TR-03  | Fitur Track Order menerima invoice + email sebagai fallback.                            | Should        | Data valid menghasilkan tautan status; respons tidak membocorkan order lain. |
| TR-04  | Token dapat dirotasi oleh admin bila link diduga tersebar.                              | Could         | Token lama langsung tidak berlaku.                                           |

## 7.6 Fulfillment dan Download

| **ID** | **Requirement**                                                                        | **Prioritas** | **Acceptance Criteria**                                   |
|--------|----------------------------------------------------------------------------------------|---------------|-----------------------------------------------------------|
| DL-01  | Pembayaran yang disetujui membuat entitlement untuk setiap item order.                 | Must          | Entitlement hanya dibuat sekali per item/order.           |
| DL-02  | Download dilakukan melalui endpoint yang memvalidasi token, status, expiry, dan limit. | Must          | File tidak memiliki public direct URL.                    |
| DL-03  | Admin dapat mengatur masa berlaku dan jumlah maksimum download per produk/order.       | Must          | Counter bertambah hanya saat unduhan benar-benar dimulai. |
| DL-04  | Pembeli dapat melihat sisa download dan masa berlaku.                                  | Should        | Nilai sesuai entitlement.                                 |
| DL-05  | Admin dapat reset limit, memperpanjang expiry, atau mengirim ulang akses.              | Must          | Semua tindakan masuk audit log.                           |
| DL-06  | Versi file baru dapat dipublikasikan tanpa memutus order lama sesuai kebijakan produk. | Should        | Admin memilih apakah pembeli lama mendapat versi terbaru. |

## 7.7 Email dan Notifikasi

| **ID** | **Requirement**                                            | **Prioritas** | **Acceptance Criteria**                                          |
|--------|------------------------------------------------------------|---------------|------------------------------------------------------------------|
| NT-01  | Email order dibuat dikirim setelah checkout.               | Must          | Berisi invoice, total, batas waktu, dan link pembayaran/status.  |
| NT-02  | Email bukti diterima dikirim setelah upload.               | Must          | Berisi status Menunggu Verifikasi.                               |
| NT-03  | Email keputusan dikirim saat pembayaran disetujui/ditolak. | Must          | Approval berisi akses; rejection berisi alasan dan upload ulang. |
| NT-04  | Admin mendapat notifikasi dashboard untuk bukti baru.      | Must          | Badge/count berubah ketika item baru masuk.                      |
| NT-05  | Email admin untuk bukti baru dapat diaktifkan/nonaktifkan. | Should        | Konfigurasi tersimpan per admin.                                 |

## 7.8 Akun Pembeli

| **ID** | **Requirement**                                                                 | **Prioritas** | **Acceptance Criteria**                                                        |
|--------|---------------------------------------------------------------------------------|---------------|--------------------------------------------------------------------------------|
| AC-01  | Akun tidak wajib pada MVP.                                                      | Must          | Guest dapat menyelesaikan seluruh alur pembelian.                              |
| AC-02  | Sistem dapat ditingkatkan untuk membuat akun dari email setelah order verified. | Won’t         | Hanya dicatat sebagai arah fase berikutnya; tidak menghalangi desain data MVP. |

# 8. Dashboard Admin

## 8.1 Dashboard Ringkasan

| **ID** | **Requirement**                                                                                       | **Prioritas** | **Acceptance Criteria**                                             |
|--------|-------------------------------------------------------------------------------------------------------|---------------|---------------------------------------------------------------------|
| AD-01  | Menampilkan revenue, jumlah order, order menunggu verifikasi, conversion funnel, dan produk terlaris. | Must          | Filter tanggal tersedia dan angka konsisten dengan data order.      |
| AD-02  | Menampilkan antrean tindakan prioritas.                                                               | Must          | Order dengan bukti baru muncul paling atas berdasarkan waktu masuk. |

## 8.2 Manajemen Order dan Verifikasi

| **ID** | **Requirement**                                                                                     | **Prioritas** | **Acceptance Criteria**                                             |
|--------|-----------------------------------------------------------------------------------------------------|---------------|---------------------------------------------------------------------|
| AD-10  | Admin dapat mencari/filter order berdasarkan invoice, email, WhatsApp, status, tanggal, dan produk. | Must          | Filter dapat digabung dan direset.                                  |
| AD-11  | Detail order menampilkan snapshot customer, items, total, timeline, proofs, dan entitlement.        | Must          | Semua data penting terlihat dalam satu layar atau tab jelas.        |
| AD-12  | Viewer bukti mendukung zoom, rotate, open full size, dan download terbatas.                         | Must          | Bukti dapat dibandingkan dengan data order tanpa berpindah konteks. |
| AD-13  | Admin dapat Approve atau Reject; rejection wajib alasan.                                            | Must          | Aksi membutuhkan konfirmasi dan mencatat actor/timestamp.           |
| AD-14  | Approve membuat entitlement dan memicu email secara atomik/idempotent.                              | Must          | Klik berulang tidak membuat akses ganda atau email berlebihan.      |
| AD-15  | Admin dapat menambah catatan internal dan catatan untuk pembeli.                                    | Should        | Catatan internal tidak pernah tampil ke pembeli.                    |
| AD-16  | Admin dapat menandai order Cancelled atau Refunded secara manual.                                   | Should        | Status memerlukan alasan dan audit log.                             |

## 8.3 Manajemen Produk dan File

| **ID** | **Requirement**                                                             | **Prioritas** | **Acceptance Criteria**                                      |
|--------|-----------------------------------------------------------------------------|---------------|--------------------------------------------------------------|
| PR-01  | CRUD produk dengan status Draft, Published, Archived.                       | Must          | Produk published tampil publik; archived tidak dapat dibeli. |
| PR-02  | Kelola kategori, slug, SEO metadata, gambar, preview, dan related products. | Must          | Slug unik dan preview memiliki alt text.                     |
| PR-03  | Kelola harga normal, harga diskon, periode diskon, dan badge.               | Must          | Harga aktif dihitung konsisten di storefront dan checkout.   |
| PR-04  | Upload file digital dan metadata versi/changelog.                           | Must          | File tersimpan private dan terhubung ke versi produk.        |
| PR-05  | Atur kebijakan lisensi, expiry download, dan limit download.                | Must          | Nilai default dapat dioverride per order oleh admin.         |

## 8.4 Settings, Access, dan Audit

| **ID** | **Requirement**                                                                                     | **Prioritas** | **Acceptance Criteria**                       |
|--------|-----------------------------------------------------------------------------------------------------|---------------|-----------------------------------------------|
| ST-01  | Pengaturan merchant: nama, email, WhatsApp, jam operasional, QRIS, instruksi, dan expiry order.     | Must          | Perubahan tervalidasi dan dicatat.            |
| ST-02  | Admin login dengan password kuat dan opsi 2FA.                                                      | Must          | Session aman; brute-force dilimit.            |
| ST-03  | Audit log mencatat login sensitif, keputusan payment, perubahan file, QRIS, harga, dan entitlement. | Must          | Log bersifat append-only bagi admin biasa.    |
| ST-04  | Role Admin dan Super Admin.                                                                         | Should        | Hak akses diuji per endpoint, bukan hanya UI. |

# 9. Model Status dan Aturan Bisnis

## 9.1 Status Order

| **Status**           | **Arti**                                 | **Aksi Pembeli**                    | **Aksi Admin**                        |
|----------------------|------------------------------------------|-------------------------------------|---------------------------------------|
| PENDING_PAYMENT      | Order dibuat, belum ada bukti.           | Bayar dan upload bukti.             | Lihat/batalkan bila perlu.            |
| WAITING_VERIFICATION | Bukti terbaru telah diterima.            | Menunggu; tidak perlu upload lagi.  | Approve atau reject.                  |
| PAYMENT_REJECTED     | Bukti ditolak.                           | Baca alasan dan upload ulang.       | Tinjau ulang jika ada bukti baru.     |
| PAYMENT_VERIFIED     | Pembayaran sah, fulfillment diproses.    | Menunggu akses singkat.             | Resend/atasi error fulfillment.       |
| PRODUCT_DELIVERED    | Akses produk tersedia.                   | Download produk.                    | Reset/extend/revoke sesuai kebijakan. |
| EXPIRED              | Batas bayar terlewati tanpa bukti aktif. | Buat order baru atau hubungi admin. | Reopen opsional.                      |
| CANCELLED            | Order dibatalkan.                        | Tidak ada.                          | Catat alasan.                         |
| REFUNDED             | Dana dikembalikan manual.                | Lihat status.                       | Revoke entitlement sesuai kebijakan.  |

## 9.2 Transisi Status yang Diizinkan

| **Dari**             | **Ke**               | **Pemicu**                                                   |
|----------------------|----------------------|--------------------------------------------------------------|
| PENDING_PAYMENT      | WAITING_VERIFICATION | Pembeli upload bukti valid secara teknis.                    |
| PENDING_PAYMENT      | EXPIRED              | Scheduler melewati expiry dan tidak ada bukti aktif.         |
| WAITING_VERIFICATION | PAYMENT_VERIFIED     | Admin approve.                                               |
| WAITING_VERIFICATION | PAYMENT_REJECTED     | Admin reject dengan alasan.                                  |
| PAYMENT_REJECTED     | WAITING_VERIFICATION | Pembeli upload ulang.                                        |
| PAYMENT_VERIFIED     | PRODUCT_DELIVERED    | Entitlement berhasil dibuat.                                 |
| \*                   | CANCELLED            | Admin membatalkan sesuai aturan.                             |
| PRODUCT_DELIVERED    | REFUNDED             | Admin mencatat refund manual dan menerapkan kebijakan akses. |

## 9.3 Aturan Bisnis Kritis

- Harga, diskon, nama produk, dan file version yang dibeli disimpan sebagai snapshot order.

- Order dengan proof aktif tidak boleh di-expire otomatis saat menunggu verifikasi.

- Approve harus idempotent dan atomik: status, entitlement, audit, serta notification tidak boleh setengah berhasil tanpa mekanisme retry.

- Admin tidak boleh menghapus permanen bukti pembayaran atau audit log melalui UI normal.

- Bukti pembayaran bukan satu-satunya dasar approval; admin wajib mencocokkan transaksi merchant.

- Produk gratis dapat melewati pembayaran dan langsung membuat entitlement setelah checkout/email verification opsional.

- Nominal unik 1-999 rupiah dapat diaktifkan sebagai konfigurasi untuk membantu rekonsiliasi, tetapi bukan syarat MVP.

# 10. Model Data Konseptual

| **Entitas**    | **Field Inti**                                                                                   | **Relasi / Catatan**                            |
|----------------|--------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Product        | id, name, slug, status, description, price, sale_price, license, download_policy                 | Memiliki category, media, versions.             |
| ProductVersion | id, product_id, version, file_id, changelog, published_at                                        | Menunjuk private file asset.                    |
| Order          | id, invoice, status, customer snapshot, subtotal, discount, total, expires_at, secure_token_hash | Memiliki items, proofs, timeline, entitlements. |
| OrderItem      | order_id, product snapshot, unit_price, quantity, version_policy                                 | Snapshot mencegah perubahan historis.           |
| PaymentProof   | order_id, file_id, sender_name, amount, paid_at, note, file_hash, status                         | Multiple submissions per order.                 |
| Entitlement    | order_item_id, token_hash, expires_at, max_downloads, download_count, revoked_at                 | Membuka file yang berhak.                       |
| DownloadEvent  | entitlement_id, timestamp, IP hash, user agent, result                                           | Untuk limit dan audit keamanan.                 |
| Coupon         | code, type, value, active period, limits, conditions                                             | Usage dicatat per order/email.                  |
| AdminUser      | id, name, email, role, password hash, 2FA, status                                                | Terhubung ke audit event.                       |
| AuditLog       | actor, action, entity, before/after summary, timestamp, request metadata                         | Append-only secara aplikasi.                    |
| Notification   | recipient, channel, template, status, retries, sent_at                                           | Email transaksional dan admin alert.            |

# 11. Kebutuhan Nonfungsional

| **Area**      | **Requirement**                                                                                                                                    |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| Performance   | Halaman utama tetap interaktif cepat; aset gambar/video dioptimalkan; animasi menggunakan transform/opacity; lazy-load section non-kritis.         |
| Responsive    | Alur lengkap berfungsi pada mobile 360 px hingga desktop lebar. Tidak ada horizontal overflow yang tidak disengaja.                                |
| Accessibility | Keyboard navigation, focus state, semantic HTML, label form, kontras memadai, alt text, dan prefers-reduced-motion.                                |
| Security      | HTTPS, CSRF protection sesuai arsitektur, rate limiting, secure cookies, validation server-side, private object storage, signed/streamed download. |
| Upload Safety | Allowlist MIME/extension, size limit, filename random, image re-encode/scan bila tersedia, tidak mengeksekusi file pengguna.                       |
| Privacy       | Bukti pembayaran dan data kontak hanya untuk operasional; retention policy ditentukan; halaman order memakai token rahasia.                        |
| Reliability   | Operasi approve dan delivery idempotent; retry notification; backup database; error logging dan alert dasar.                                       |
| Observability | Structured logs, error monitoring, audit trail, metrik queue verification dan failure fulfillment.                                                 |
| SEO           | Metadata unik, canonical, sitemap, robots, Open Graph, schema Product bila relevan; halaman order tidak diindeks.                                  |
| Compatibility | Dukung versi modern Chrome, Safari, Edge, Firefox; fallback untuk fitur motion yang tidak tersedia.                                                |
| Localization  | Bahasa Indonesia dan format Rupiah; struktur siap untuk bahasa lain meski belum diimplementasikan.                                                 |

## 11.1 Target Teknis Awal

- API p95 untuk operasi non-upload di bawah 500 ms pada beban MVP normal.

- Upload bukti memberikan progress/feedback dan timeout yang dapat dipahami.

- Tidak ada direct public URL untuk product files atau payment proofs.

- RPO backup maksimal 24 jam dan prosedur restore terdokumentasi untuk MVP.

- Error fulfillment tidak boleh menghilangkan status pembayaran yang sudah disetujui; sistem menyediakan retry/recovery.

# 12. Analytics dan Pelaporan

## Event funnel minimum:

| **Event**                                 | **Properti Utama**                      |
|-------------------------------------------|-----------------------------------------|
| view_home                                 | source, device, reduced_motion          |
| view_product                              | product_id, category, price             |
| add_to_cart / buy_now                     | product_id, price                       |
| begin_checkout                            | cart_value, item_count                  |
| order_created                             | order_id pseudonymous, value, coupon    |
| payment_page_viewed                       | order_status                            |
| proof_upload_started / completed / failed | file_size_bucket, error_type            |
| payment_approved / rejected               | verification_duration, rejection_reason |
| download_started / completed / denied     | product_id, denial_reason               |

## Dashboard admin minimum:

- Revenue berdasarkan tanggal approval dan/atau order created (jelaskan definisi pada UI).

- Jumlah order per status.

- Median dan p90 waktu verifikasi.

- Produk terlaris berdasarkan unit dan revenue.

- Drop-off funnel dari product view hingga proof upload.

- Failure rate email dan download.

# 13. Desain dan Motion

## 13.1 Arah Visual

Editorial premium dengan typography besar, negative space, imagery bermasker, transisi terang-gelap, dan motion yang terasa sinematik. Storefront boleh ekspresif; halaman pembayaran, tracking, dan admin harus lebih tenang dan utilitarian.

## 13.2 Komponen Motion Utama

| **Komponen**      | **Perilaku**                                       | **Batasan**                                                                                   |
|-------------------|----------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Preloader         | Logo reveal singkat saat first meaningful visit.   | Tidak tampil pada setiap navigasi; maksimal sekitar 1–1,5 detik atau dilewati bila aset siap. |
| Hero              | Text stagger, image mask reveal, floating accents. | CTA muncul cepat dan tetap dapat diklik.                                                      |
| Section reveal    | Clip/mask, translate, opacity, parallax ringan.    | Tidak menyebabkan layout shift.                                                               |
| Pinned showcase   | Produk/benefit berubah mengikuti scroll.           | Disederhanakan pada mobile dan reduced motion.                                                |
| Product card      | Image zoom/tilt ringan, metadata reveal.           | Tidak mengandalkan hover untuk informasi wajib.                                               |
| Page transition   | Transisi singkat antarhalaman publik.              | Checkout/payment dapat melewati transisi panjang.                                             |
| Cart drawer/modal | Spring motion yang responsif.                      | Focus trap dan escape-to-close.                                                               |

## 13.3 Design Tokens dan Sistem Komponen

- Gunakan design tokens untuk warna, typography, spacing, radius, shadow, motion duration, easing, dan z-index.

- Komponen commerce inti dibangun reusable: ProductCard, Price, CartDrawer, CheckoutForm, PaymentPanel, ProofUploader, StatusTimeline, DownloadCard.

- Animasi dibungkus sebagai primitive reusable: TextReveal, MaskReveal, MagneticButton, ScrollSection, ParallaxMedia.

- Admin menggunakan visual system yang konsisten tetapi mengutamakan densitas informasi dan kecepatan operasional.

# 14. Risiko dan Mitigasi

| **Risiko**                               | **Dampak**                            | **Mitigasi**                                                                                            |
|------------------------------------------|---------------------------------------|---------------------------------------------------------------------------------------------------------|
| Bukti palsu atau diedit                  | Produk terkirim tanpa pembayaran sah. | Admin wajib mencocokkan mutasi/riwayat merchant; warning duplicate hash; audit log.                     |
| Admin lambat memverifikasi               | Pembeli kehilangan kepercayaan.       | Jam operasional jelas, SLA internal, queue dan notifikasi, auto acknowledgement.                        |
| QRIS atau nominal membingungkan          | Pembayaran salah nominal/merchant.    | Instruksi visual, copy nominal, merchant name, FAQ, validasi amount pada form proof.                    |
| Link order tersebar                      | Data/order dapat diakses pihak lain.  | Secure high-entropy token, noindex, token rotation, minimal data exposure.                              |
| File produk bocor                        | Kerugian komersial.                   | Private storage, entitlement, expiry/limit; watermark per produk bila relevan; akui DRM tidak sempurna. |
| Animasi berat                            | Bounce rate dan UX buruk di mobile.   | Performance budget, lazy load, reduced motion, device-aware simplification.                             |
| Approve terproses ganda                  | Email/entitlement duplikat.           | Idempotency, transaction/outbox, unique constraints.                                                    |
| Perubahan file merusak order lama        | Pembeli mengunduh versi tak sesuai.   | Versioned assets dan snapshot policy.                                                                   |
| Data pribadi/bukti terlalu lama disimpan | Risiko privasi.                       | Retention policy, access control, deletion/anonymization workflow setelah periode tertentu.             |

# 15. Rencana Rilis

| **Fase**               | **Fokus**                                                  | **Output**                             |
|------------------------|------------------------------------------------------------|----------------------------------------|
| 0\. Discovery & Design | Brand, IA, flows, wireframe, motion prototype, data model. | Prototype klik dan spesifikasi desain. |
| 1\. Commerce Core      | Katalog, detail, cart/buy now, checkout, invoice.          | Order dapat dibuat end-to-end.         |
| 2\. Manual Payment     | QRIS, upload proof, status page, verification admin.       | Pembayaran manual dapat dioperasikan.  |
| 3\. Fulfillment        | Private file, entitlement, download, email.                | Produk terkirim aman setelah approval. |
| 4\. Motion & Polish    | Cinematic sections, performance, accessibility.            | Storefront sesuai arah visual.         |
| 5\. Hardening & Launch | Security checks, UAT, analytics, backup, runbook.          | MVP siap produksi.                     |

## 15.1 Prioritas Backlog

| **P0 — Launch Blocker**                                                                                                                | **P1 — Penting**                                                                                                 | **P2 — Setelah Launch**                                                                         |
|----------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Produk/katalog/detail; checkout; invoice; QRIS; proof upload; admin approve/reject; private download; email keputusan; security dasar. | Search/filter lebih lengkap; coupons; download policy per produk; admin analytics; proof duplicate warning; 2FA. | Wishlist; akun pembeli; WhatsApp API; reviews; affiliate; payment gateway otomatis; membership. |

# 16. Definition of Done dan UAT

## 16.1 Definition of Done

- Requirement dan acceptance criteria terkait telah lulus QA.

- Desain responsif telah diverifikasi pada mobile dan desktop target.

- Keyboard, focus, form errors, dan reduced motion telah diuji.

- Tidak ada file produk atau bukti pembayaran yang dapat diakses melalui URL publik langsung.

- Logging dan audit event tersedia untuk aksi sensitif.

- Analytics event penting terverifikasi pada environment produksi/staging.

- Dokumentasi admin dan prosedur pemulihan error tersedia.

- Tidak ada bug severity blocker/critical terbuka.

## 16.2 Skenario UAT Wajib

| **ID** | **Skenario**                                             | **Hasil Diharapkan**                                                |
|--------|----------------------------------------------------------|---------------------------------------------------------------------|
| UAT-01 | Guest membeli satu produk dengan data valid.             | Order dan invoice dibuat; halaman QRIS tampil.                      |
| UAT-02 | Guest memasukkan email/WhatsApp invalid.                 | Checkout ditahan dan error jelas.                                   |
| UAT-03 | Upload file melebihi batas atau tipe tidak didukung.     | File ditolak tanpa tersimpan.                                       |
| UAT-04 | Upload bukti valid.                                      | Status Waiting Verification; admin melihat antrean; email terkirim. |
| UAT-05 | Admin reject tanpa alasan.                               | Sistem menolak aksi.                                                |
| UAT-06 | Admin reject dengan alasan dan pembeli upload ulang.     | Riwayat lama tetap ada; status kembali Waiting Verification.        |
| UAT-07 | Admin approve dua kali/refresh.                          | Satu entitlement; tidak ada duplikasi efek.                         |
| UAT-08 | Pembeli membuka link download sebelum approval.          | Akses ditolak dengan pesan aman.                                    |
| UAT-09 | Pembeli download setelah approval.                       | File diterima; counter dan event tercatat.                          |
| UAT-10 | Limit atau expiry terlewati.                             | Download ditolak; admin dapat reset/extend.                         |
| UAT-11 | Token order salah atau invoice-only guessing.            | Detail sensitif tidak bocor.                                        |
| UAT-12 | Reduced motion aktif.                                    | Konten tetap lengkap; animasi berat dinonaktifkan.                  |
| UAT-13 | Order tanpa bukti melewati expiry.                       | Status Expired; tidak muncul sebagai queue aktif.                   |
| UAT-14 | Order dengan bukti menunggu admin melewati waktu expiry. | Tidak berubah menjadi Expired otomatis.                             |

# 17. Open Decisions

| **Keputusan**                     | **Opsi / Pertanyaan**                         | **Rekomendasi Awal**                                                            |
|-----------------------------------|-----------------------------------------------|---------------------------------------------------------------------------------|
| Cart atau single-product checkout | Apakah mayoritas pembelian hanya satu produk? | Sediakan Buy Now dan cart sederhana; Buy Now menjadi CTA utama.                 |
| Nominal unik                      | Tambahkan 1–999 rupiah untuk rekonsiliasi?    | Konfigurabel; nonaktif secara default sampai proses operasional diuji.          |
| Order expiry                      | Berapa lama pengguna boleh membayar?          | 24 jam; order dengan bukti aktif dikecualikan.                                  |
| SLA verifikasi                    | Jam operasional dan target keputusan?         | Tampilkan ekspektasi, mis. maksimal 2 jam pada jam operasional.                 |
| Download policy                   | Berapa lama dan berapa kali?                  | Default 7 hari / 5 kali; dapat diatur per produk.                               |
| File update                       | Apakah pembeli lama memperoleh update?        | Kebijakan per produk: lifetime updates atau purchased version only.             |
| Email provider                    | Provider transaksi yang akan dipakai?         | Pilih provider dengan webhook delivery status dan domain authentication.        |
| Storage                           | Object storage/provider?                      | Private bucket dengan signed access atau streaming melalui backend.             |
| Retention proof                   | Berapa lama bukti pembayaran disimpan?        | Tentukan bersama kebutuhan pembukuan dan kebijakan privasi; batasi akses admin. |
| Stack implementasi                | Next.js/TypeScript/DB/storage/provider email? | Putuskan setelah hosting, anggaran, dan kebutuhan operasional dikunci.          |

> **Keputusan launch gate**  
> Sebelum development final, kunci nama brand, tipe produk pertama, default expiry order, SLA verifikasi, download policy, QRIS merchant, dan email pengirim.

# Lampiran A — Rekomendasi Struktur Halaman

| **Area Publik**                                                       | **Area Pembeli**                                                     | **Area Admin**                                                                                                         |
|-----------------------------------------------------------------------|----------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Home; Products; Category; Product Detail; About; FAQ; Terms; Privacy. | Cart; Checkout; Payment; Track Order; Order Status; Download Access. | Dashboard; Verification Queue; Orders; Products; Categories; Files; Customers; Coupons; Reports; Settings; Audit Logs. |

# Lampiran B — Copy Minimum Halaman Pembayaran

- Pastikan nama merchant pada aplikasi pembayaran sesuai dengan nama yang ditampilkan.

- Bayar tepat sesuai nominal order. Pada QRIS statis, nominal mungkin perlu dimasukkan secara manual.

- Setelah pembayaran berhasil, unggah screenshot transaksi agar admin dapat memverifikasi.

- Produk akan tersedia setelah pembayaran ditemukan dan disetujui admin.

- Jangan membagikan tautan status order karena tautan tersebut memberikan akses ke detail pesanan.
