# Design Specification

## Webstore Produk Digital — Cinematic Storefront & Admin Dashboard

| Informasi | Nilai |
|---|---|
| Dokumen | `design.md` |
| Versi | Draft v1.0 |
| Tanggal | 1 Agustus 2026 |
| Pemilik Produk | FaRu |
| Acuan Produk | `prd.md` |
| Status | Siap menjadi baseline UI/UX dan implementasi frontend |

> Webstore memiliki dua karakter visual yang saling melengkapi: **storefront yang editorial dan sinematik** untuk pembeli, serta **admin dashboard yang tenang, ringkas, dan operasional** untuk pengelolaan toko. Animasi harus memperkuat hierarki dan brand, bukan memperlambat transaksi.

---

## 1. Tujuan Dokumen

Dokumen ini menetapkan arah visual, arsitektur informasi, pola interaksi, komponen, motion, responsivitas, aksesibilitas, dan batas implementasi desain untuk MVP webstore produk digital.

Design specification ini mencakup:

- storefront publik;
- katalog dan detail produk;
- cart dan guest checkout;
- pembayaran menggunakan QRIS statis;
- upload bukti pembayaran;
- tracking order dan secure download;
- admin dashboard;
- sidebar admin yang dapat diminimalkan seperti referensi gambar;
- design tokens dan component states;
- aturan motion, performa, serta reduced motion.

---

## 2. Prinsip Desain

### 2.1 Clarity before spectacle

Harga, CTA, status order, nominal pembayaran, dan langkah berikutnya harus selalu lebih mudah ditemukan daripada elemen dekoratif.

### 2.2 Motion with purpose

Animasi digunakan untuk:

- menunjukkan hubungan antar-elemen;
- memperjelas perubahan state;
- mengarahkan perhatian;
- meningkatkan karakter brand;
- memberikan feedback setelah aksi.

Animasi tidak digunakan untuk menunda akses ke konten utama atau membuat pengguna menunggu tanpa alasan.

### 2.3 Guest-first commerce

Pembeli dapat menyelesaikan seluruh transaksi tanpa membuat akun. Form dibuat sesingkat mungkin dan status order dapat diakses melalui secure link.

### 2.4 Trust by design

Nomor invoice, nominal, status, batas waktu, instruksi pembayaran, alasan penolakan, dan akses download ditampilkan secara eksplisit.

### 2.5 Progressive enhancement

Konten, navigasi, checkout, dan download tetap berfungsi ketika:

- perangkat memiliki performa rendah;
- JavaScript terlambat dimuat;
- pengguna mengaktifkan `prefers-reduced-motion`;
- koneksi lambat;
- efek visual tertentu dinonaktifkan.

### 2.6 Operational calm

Admin dashboard tidak mengikuti intensitas motion storefront. Fokusnya adalah kecepatan membaca, membandingkan, dan mengambil keputusan.

---

## 3. Pembagian Experience

### 3.1 Storefront publik

Karakter:

- editorial;
- premium;
- high-contrast;
- typography-led;
- scroll choreography;
- foto atau mockup produk berukuran besar;
- whitespace luas;
- CTA jelas.

### 3.2 Transactional flow

Karakter:

- bersih;
- linear;
- sedikit animasi;
- bebas distraksi;
- mobile-first;
- menekankan keamanan dan kejelasan.

Mencakup cart, checkout, payment page, upload bukti, tracking, dan download.

### 3.3 Admin dashboard

Karakter:

- neutral light UI;
- compact tetapi tidak padat;
- sidebar hierarkis;
- data table dan detail panel;
- animation ringan;
- keyboard-friendly.

> Sidebar seperti referensi gambar hanya digunakan pada **admin dashboard**, bukan pada storefront pembeli.

---

## 4. Information Architecture

## 4.1 Storefront routes

```txt
/
/products
/products/[slug]
/categories/[slug]
/cart
/checkout
/payment/[invoice]
/order/[invoice]?token=[secure-token]
/download/[token]
/track-order
/faq
/terms
/privacy
/refund-policy
```

## 4.2 Admin routes

```txt
/admin
/admin/orders
/admin/orders/[id]
/admin/verifications
/admin/products
/admin/products/new
/admin/products/[id]
/admin/categories
/admin/customers
/admin/coupons
/admin/files
/admin/reports
/admin/activity
/admin/settings/store
/admin/settings/payment
/admin/settings/downloads
/admin/settings/notifications
/admin/settings/security
```

## 4.3 Route groups yang disarankan

```txt
app/
├── (storefront)/
├── (commerce)/
├── (legal)/
├── admin/
└── api/
```

Storefront dan commerce dapat memiliki layout berbeda agar halaman transaksi tidak membawa efek animasi yang berat.

---

## 5. Visual Direction

## 5.1 Konsep visual

Arah utama adalah **Modern Digital Atelier**: kombinasi layout majalah, ruang kosong, visual produk yang kuat, tipografi display, dan detail interaksi modern.

Storefront memakai palet netral hangat dengan satu aksen brand. Admin memakai surface terang dan border lembut agar data mudah dipindai dalam waktu lama.

## 5.2 Mood keywords

```txt
Editorial
Cinematic
Precise
Tactile
Premium
Minimal
Confident
Modern
```

## 5.3 Hal yang perlu dihindari

- gradient berlebihan pada setiap komponen;
- glassmorphism di seluruh halaman;
- semua elemen bergerak bersamaan;
- scroll hijacking;
- cursor custom pada mobile;
- teks tipis dengan kontras rendah;
- CTA yang hanya muncul setelah animasi panjang;
- dashboard admin yang terlalu dekoratif;
- loading screen yang tidak dapat dilewati.

---

## 6. Design Tokens

Semua token perlu tersedia sebagai CSS variables agar theme mudah diubah tanpa membongkar komponen.

## 6.1 Color tokens

### Storefront

| Token | Default | Fungsi |
|---|---:|---|
| `--store-bg` | `#F4F1EA` | Background utama ivory |
| `--store-surface` | `#FFFFFF` | Card dan surface terang |
| `--store-ink` | `#111111` | Teks utama dan dark section |
| `--store-muted` | `#686660` | Teks sekunder |
| `--store-border` | `#DAD6CD` | Border lembut |
| `--store-accent` | `#6657E8` | CTA, active state, highlight |
| `--store-accent-soft` | `#E8E4FF` | Badge atau subtle surface |
| `--store-success` | `#187A4A` | Status sukses |
| `--store-warning` | `#9A6000` | Menunggu atau warning |
| `--store-danger` | `#B42318` | Error atau penolakan |

`--store-accent` adalah nilai sementara dan harus diganti sesuai identitas brand final.

### Admin

| Token | Default | Fungsi |
|---|---:|---|
| `--admin-bg` | `#F7F8FA` | Background workspace |
| `--admin-sidebar` | `#FFFFFF` | Sidebar |
| `--admin-surface` | `#FFFFFF` | Card dan panel |
| `--admin-ink` | `#222326` | Teks utama |
| `--admin-muted` | `#777B84` | Teks sekunder |
| `--admin-subtle` | `#A8ADB6` | Label tersier |
| `--admin-border` | `#E6E8EC` | Separator dan border |
| `--admin-hover` | `#F2F3F5` | Hover item |
| `--admin-active` | `#ECEDEF` | Active navigation |
| `--admin-accent` | `#6657E8` | Focus, link, selected |
| `--admin-danger` | `#C9362B` | Destructive action |

## 6.2 Typography

### Font families

```css
--font-display: "Instrument Serif", Georgia, serif;
--font-sans: "Geist", "Inter", system-ui, sans-serif;
--font-mono: "Geist Mono", ui-monospace, monospace;
```

- Display font hanya digunakan pada headline storefront.
- Semua form, nominal, tabel, status, dan admin UI memakai sans-serif.
- Angka pada invoice, nominal, dan data table menggunakan `font-variant-numeric: tabular-nums`.

### Type scale

| Style | Desktop | Mobile | Line height | Penggunaan |
|---|---:|---:|---:|---|
| Display XL | 96 px | 52 px | 0.95 | Hero utama |
| Display L | 72 px | 44 px | 1.00 | Section headline |
| H1 | 48 px | 36 px | 1.10 | Judul halaman |
| H2 | 36 px | 30 px | 1.15 | Section title |
| H3 | 24 px | 22 px | 1.25 | Card/detail heading |
| Body L | 18 px | 17 px | 1.60 | Lead paragraph |
| Body | 16 px | 16 px | 1.55 | Konten utama |
| Body S | 14 px | 14 px | 1.45 | Helper text |
| Caption | 12 px | 12 px | 1.35 | Metadata |
| Admin UI | 14 px | 14 px | 1.35 | Navigation dan table |

## 6.3 Spacing

Gunakan sistem 4 px.

```txt
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
```

## 6.4 Radius

| Token | Nilai | Penggunaan |
|---|---:|---|
| `--radius-xs` | 6 px | Badge kecil |
| `--radius-sm` | 8 px | Input dan admin item |
| `--radius-md` | 12 px | Button, card sederhana |
| `--radius-lg` | 20 px | Product card dan panel |
| `--radius-xl` | 32 px | Hero visual |
| `--radius-pill` | 999 px | Pill dan status |

## 6.5 Elevation

```css
--shadow-sm: 0 1px 2px rgb(17 24 39 / 0.05);
--shadow-md: 0 8px 24px rgb(17 24 39 / 0.08);
--shadow-lg: 0 24px 60px rgb(17 24 39 / 0.14);
--shadow-focus: 0 0 0 3px rgb(102 87 232 / 0.24);
```

Admin menggunakan shadow minimal. Storefront boleh memakai elevation yang lebih kuat pada floating visual dan modal.

## 6.6 Grid

### Storefront desktop

- max content width: `1440px`;
- horizontal padding: `48–72px`;
- 12 columns;
- gutter: `24px`;
- section spacing: `96–160px`.

### Storefront mobile

- horizontal padding: `20px`;
- 4 columns;
- gutter: `12px`;
- section spacing: `64–96px`.

### Admin

- content padding desktop: `24px`;
- content padding large desktop: `32px`;
- content padding mobile: `16px`;
- card gap: `16px` atau `20px`;
- max width tidak dibatasi untuk data table, tetapi detail forms dapat memakai `960px`.

---

## 7. Storefront Layout

## 7.1 Global header

### Desktop

- posisi awal transparan di atas hero;
- menjadi solid atau blurred surface setelah scroll 40 px;
- brand di kiri;
- nav utama di tengah atau kiri setelah brand;
- utility actions di kanan: search, track order, cart;
- tinggi 72–80 px;
- CTA utama opsional: `Explore Products`.

### Mobile

- tinggi 64 px;
- logo kiri;
- cart dan menu kanan;
- menu tampil sebagai full-screen sheet;
- tidak menggunakan hover-dependent interaction.

### Header motion

- background fade: 180 ms;
- nav item underline: 160 ms;
- mobile menu: 320 ms dengan stagger ringan;
- header tidak boleh bersembunyi saat pengguna berada di checkout/payment.

## 7.2 Homepage sections

Urutan baseline:

```txt
1. Cinematic preloader opsional
2. Hero product showcase
3. Featured categories
4. Selected products
5. Brand statement / benefit
6. Pinned storytelling section
7. Product collection / horizontal showcase
8. Preview or inside-the-product section
9. Testimonial / social proof
10. FAQ
11. Final CTA
12. Footer
```

### Hero

Komposisi desktop:

- headline display 2–4 baris;
- satu visual produk utama;
- floating metadata atau product badge;
- CTA utama dan secondary action;
- microcopy tentang format atau benefit;
- elemen dekoratif tidak boleh menutup CTA.

Komposisi mobile:

- headline lebih pendek;
- visual ditempatkan setelah CTA;
- floating elements dikurangi;
- tidak memakai parallax pointer.

### Featured product card

Card harus mendukung:

- image/mockup;
- nama produk;
- kategori;
- harga dan harga diskon;
- label seperti `New` atau `Best Seller`;
- CTA;
- optional quick view.

Hover desktop:

- image scale maksimal `1.04`;
- metadata bergeser 4–8 px;
- quick action muncul dengan opacity/translate;
- durasi 220–320 ms.

Touch:

- semua informasi penting selalu terlihat;
- tidak ada aksi yang hanya tersedia lewat hover.

## 7.3 Catalog

Layout desktop:

- title dan result count;
- search;
- filter chips atau filter drawer;
- sorting;
- 3–4 column product grid.

Mobile:

- sticky compact controls;
- filter dan sort sebagai bottom sheet;
- 1–2 column grid sesuai lebar layar.

States:

- loading skeleton;
- no result;
- filter active;
- network error;
- archived/unavailable product;
- pagination atau load more.

## 7.4 Product detail page

Struktur:

```txt
Breadcrumb
Product gallery / demo
Product title and summary
Price
Primary CTA
Trust metadata
Description
What is included
Compatibility / requirements
License
Changelog
FAQ
Related products
Sticky mobile buy bar
```

Desktop dapat memakai split layout 7/5 columns. Area pembelian dapat sticky selama konten detail discroll.

CTA states:

- default;
- hover;
- loading;
- added to cart;
- unavailable;
- already purchased, bila fitur akun ditambahkan nanti.

---

## 8. Transactional Experience

## 8.1 Cart

Desktop:

- dapat berupa drawer dari kanan;
- width 420–480 px;
- background dimmed;
- subtotal dan CTA checkout sticky di bawah.

Mobile:

- full-height bottom sheet atau full-screen page;
- close button mudah dijangkau;
- minimum target sentuh 44 px.

Cart item:

- thumbnail;
- title;
- license/variant jika ada;
- price;
- remove action;
- quantity hanya tampil jika memang didukung produk.

## 8.2 Checkout

Checkout memakai layout sederhana tanpa animasi sinematik.

### Desktop

- form di kiri;
- order summary sticky di kanan;
- max width 1180 px;
- progress indicator opsional: `Informasi → Pembayaran → Selesai`.

### Mobile

- satu kolom;
- order summary collapsible di atas;
- CTA sticky bottom hanya jika tidak menutupi input atau keyboard.

Field MVP:

```txt
Nama lengkap
Email
Nomor WhatsApp
Kode promo
Persetujuan Terms & Privacy
```

Interaction rules:

- error muncul inline setelah blur atau submit;
- input valid tidak perlu dipenuhi ikon berlebihan;
- submit button memiliki loading dan idempotency protection;
- total harga harus terlihat sebelum pengguna menekan submit.

## 8.3 Payment page — QRIS statis

Halaman ini harus terasa seperti checklist, bukan landing page.

Urutan visual:

```txt
Status order
Nomor invoice
Countdown / batas pembayaran
Nominal tepat
QRIS image
Nama merchant
Instruksi langkah demi langkah
Copy invoice / copy nominal
Upload bukti pembayaran
Bantuan / kontak admin
```

### QRIS card

- QR image minimal 240 × 240 px desktop dan 220 × 220 px mobile;
- surface putih tanpa efek yang mengganggu scanning;
- quiet zone QR tidak boleh dipotong;
- tersedia aksi `Buka gambar` atau `Simpan QRIS`;
- teks menegaskan bahwa nominal perlu diinput sesuai total order bila QRIS statis tidak membawa nominal;
- snapshot nama merchant ditampilkan.

### Payment status banner

| Status | Tone | Aksi utama |
|---|---|---|
| Menunggu Pembayaran | Warning | Upload bukti |
| Menunggu Verifikasi | Neutral/Info | Lihat bukti dan tunggu |
| Pembayaran Ditolak | Danger | Baca alasan dan upload ulang |
| Pembayaran Diterima | Success | Buka produk |
| Kedaluwarsa | Muted | Hubungi admin atau buat order baru |

## 8.4 Upload bukti pembayaran

Komponen `PaymentProofUploader` terdiri dari:

- drag-and-drop zone desktop;
- tap-to-upload pada mobile;
- preview gambar;
- nama file dan ukuran;
- progress upload;
- remove/replace;
- form metadata;
- submit button;
- privacy notice singkat.

Accepted format:

```txt
JPG, PNG, WebP
Maksimum default 5 MB
Satu file aktif per submission
```

States:

```txt
Idle
Drag active
Validating
Uploading
Uploaded
Validation error
Network error
Submitted
Rejected and replaceable
```

Setelah submit berhasil:

- status berubah tanpa full-page reload;
- success state terlihat jelas;
- pengguna diberi estimasi jam operasional, bila tersedia;
- tombol upload dinonaktifkan sampai ada penolakan atau admin meminta upload ulang.

## 8.5 Track order

Metode akses:

1. secure link dari email, atau
2. input invoice + email pada halaman `Track Order`.

Timeline:

```txt
Order dibuat
Pembayaran menunggu
Bukti dikirim
Verifikasi admin
Produk tersedia
```

Current step harus memiliki label tekstual, bukan hanya warna.

## 8.6 Secure download

Download page menampilkan:

- produk;
- versi;
- ukuran file;
- expiry link;
- sisa kuota download;
- tombol download;
- dokumentasi atau changelog;
- bantuan bila gagal.

CTA download tidak boleh memakai preloader atau animasi panjang. Feedback dimulai maksimal 100 ms setelah klik.

---

## 9. Admin Dashboard Shell

## 9.1 Struktur shell

```txt
┌─────────────────────────────────────────────────────────────┐
│ Sidebar │ Topbar / Page header                              │
│         ├───────────────────────────────────────────────────┤
│         │ Main content                                      │
│         │                                                   │
│         │                                                   │
└─────────────────────────────────────────────────────────────┘
```

Desktop menggunakan fixed sidebar. Area konten menggunakan CSS grid atau padding-left yang dikendalikan CSS variable.

```css
--sidebar-width-expanded: 248px;
--sidebar-width-collapsed: 64px;
```

Lebar dapat disesuaikan 8–12 px saat implementasi visual, tetapi rasio expanded/collapsed harus tetap terasa seperti referensi.

## 9.2 Sidebar admin — referensi utama

Sidebar mengikuti karakter gambar yang dikirim:

- surface putih;
- separator horizontal tipis;
- icon outline;
- label section uppercase kecil;
- active item memakai background abu-abu lembut;
- nested navigation;
- angka/badge berada di sisi kanan;
- control collapse berada di bagian header;
- mode collapsed menjadi icon-only rail;
- rounded outer edge dapat digunakan pada layout desktop floating.

### Expanded state

| Properti | Spesifikasi |
|---|---|
| Width | 248 px |
| Header height | 56 px |
| Nav row height | 38–40 px |
| Horizontal padding | 12 px |
| Item padding | 10 px |
| Icon size | 18 px |
| Label size | 14 px |
| Section label | 11 px uppercase, medium |
| Active radius | 8 px |
| Divider | 1 px `--admin-border` |

Isi expanded:

```txt
[Brand icon] [Store name] [Chevron]      [Collapse]

[⌘] Command / Search                    [/]

Dashboard
Activity                                 [badge]
Orders                                   [badge]
Payment Verification                     [badge]
Products

WORKSPACE                              [...] [+]
Catalog                                  [chevron]
  Products
  Categories
Customers
Coupons
Files
Reports

SYSTEM                                 [...] [+]
Settings                                 [chevron]
  Store
  Payment
  Downloads
  Notifications
  Security

[Optional storefront preview card]
[View Storefront]
[Admin avatar + account menu]
```

Menu dapat disederhanakan agar tidak ada item duplikat. Struktur final yang direkomendasikan:

```txt
PRIMARY
Dashboard
Orders
Payment Verification
Products

MANAGE
Categories
Customers
Coupons
Files
Reports

SYSTEM
Activity
Settings
```

### Collapsed state

| Properti | Spesifikasi |
|---|---|
| Width | 64 px |
| Icon button | 40 × 40 px |
| Rail alignment | Center |
| Label | Hidden visually |
| Tooltip | Muncul saat hover/focus |
| Badge | Dot atau compact count |
| Nested item | Dibuka melalui flyout menu |
| Section separator | Tetap terlihat |

Collapsed rail hanya menampilkan:

- brand mark;
- expand button;
- command icon;
- primary navigation icons;
- section separators;
- account/avatar di bawah.

### Collapse interaction

Trigger:

- tombol collapse/expand di header;
- shortcut `Ctrl/Cmd + B`;
- optional double-click pada empty rail area tidak direkomendasikan.

Behavior:

1. state sidebar berubah antara `expanded` dan `collapsed`;
2. state disimpan di cookie atau `localStorage`;
3. state dipulihkan sebelum hydration sebisa mungkin agar tidak flicker;
4. content area menyesuaikan lebar tanpa horizontal scroll;
5. submenu expanded ditutup ketika rail menjadi collapsed;
6. item aktif tetap terlihat melalui active background atau indicator;
7. tooltip muncul setelah 350–500 ms saat collapsed;
8. `aria-expanded` diperbarui pada trigger.

### Collapse animation

Gunakan CSS transition atau Motion, bukan GSAP.

```txt
Sidebar width        240 ms  cubic-bezier(.2,.8,.2,1)
Label opacity        100 ms  ease-out
Label translate      160 ms  ease-out, 4 px
Content reflow       240 ms  sama dengan sidebar
Nested content       180 ms  ease-out
Tooltip              120 ms  setelah delay
```

Aturan choreography:

- saat collapse, label fade terlebih dahulu lalu width mengecil;
- saat expand, width melebar terlebih dahulu lalu label fade masuk;
- icon tidak boleh bergeser secara liar;
- animasi dinonaktifkan saat reduced motion.

### Responsive behavior

| Breakpoint | Behavior |
|---|---|
| ≥ 1280 px | Expanded secara default; user dapat collapse |
| 1024–1279 px | Collapsed secara default; user dapat expand |
| 768–1023 px | Icon rail atau overlay drawer, berdasarkan ruang tabel |
| < 768 px | Tidak memakai rail permanen; gunakan off-canvas drawer |

Mobile drawer:

- full height;
- width `min(88vw, 320px)`;
- backdrop;
- close via button, backdrop, atau Escape;
- focus trapped;
- nav otomatis menutup setelah route berubah.

### Sidebar component contract

```ts
type SidebarMode = "expanded" | "collapsed";

type AdminNavItem = {
  id: string;
  label: string;
  href?: string;
  icon: React.ComponentType;
  badge?: number | "dot";
  children?: AdminNavItem[];
  permission?: string;
};

type AdminSidebarProps = {
  mode: SidebarMode;
  items: AdminNavItem[];
  activePath: string;
  onModeChange: (mode: SidebarMode) => void;
};
```

### Sidebar accessibility

- setiap icon-only item memiliki accessible name;
- tooltip tidak menjadi satu-satunya label untuk screen reader;
- item aktif menggunakan `aria-current="page"`;
- submenu trigger memakai `aria-expanded` dan `aria-controls`;
- tombol collapse memiliki label dinamis `Minimalkan sidebar` / `Perluas sidebar`;
- navigasi dapat dioperasikan dengan keyboard;
- focus ring tidak terpotong oleh container;
- icon tidak digunakan sebagai satu-satunya penanda status penting.

## 9.3 Admin topbar

Desktop:

- breadcrumb atau page title kiri;
- global search/command opsional;
- notification;
- admin avatar/action kanan;
- tinggi 64 px;
- dapat sticky.

Mobile:

- menu trigger;
- title;
- contextual action;
- aksi sekunder masuk overflow menu.

## 9.4 Admin page header

Struktur:

```txt
Eyebrow / breadcrumb
Page title
Description or updated timestamp
Primary action
Secondary action / filter
```

Contoh pada Orders:

```txt
Orders
Kelola pembayaran dan pengiriman produk digital.
[Export] [Create manual order]
```

---

## 10. Admin Screens

## 10.1 Dashboard

Widgets MVP:

- total revenue;
- orders today;
- waiting verification;
- successful delivery rate;
- verification time;
- sales chart;
- recent orders;
- top products;
- action-required panel.

Prioritas visual:

1. antrean yang membutuhkan aksi;
2. KPI operasional;
3. trend;
4. insight tambahan.

Dashboard tidak boleh mengorbankan actionable queue demi grafik dekoratif.

## 10.2 Orders list

Toolbar:

- search invoice/name/email;
- status filter;
- date filter;
- product filter;
- sort;
- export;
- saved view opsional.

Columns:

```txt
Invoice
Customer
Products
Total
Payment Status
Order Status
Submitted At
Verification Age
Actions
```

Desktop menggunakan table. Mobile menggunakan stacked cards atau condensed list dengan detail drawer.

Row interaction:

- klik row membuka detail;
- action menu tidak memicu row click;
- status badge memiliki teks;
- overdue verification dapat memakai subtle warning background, bukan flashing animation.

## 10.3 Payment verification queue

Ini adalah layar operasional paling penting.

Desktop split view:

```txt
┌───────────────────┬──────────────────────────────────────┐
│ Verification list │ Order + proof details                │
│                   │                                      │
│ Newest / oldest   │ Proof preview                        │
│ Filters           │ Expected vs submitted amount         │
│                   │ Merchant check fields                │
│                   │ [Reject] [Approve Payment]            │
└───────────────────┴──────────────────────────────────────┘
```

Detail panel harus menampilkan berdampingan:

- expected amount;
- submitted amount;
- invoice;
- buyer name/email/WhatsApp;
- product list;
- proof timestamp;
- sender name;
- payment time;
- image preview;
- previous submissions;
- duplicate hash warning;
- admin notes;
- audit trail.

Approval action:

- primary button: `Approve Payment`;
- confirmation modal hanya diperlukan bila aksi langsung membuka entitlement dan mengirim email;
- modal merangkum invoice, nominal, dan produk;
- setelah sukses, pindah ke item berikutnya secara opsional.

Reject action:

- destructive secondary button;
- alasan wajib;
- pilihan predefined reason + custom note;
- preview pesan yang diterima pembeli;
- setelah submit, status berubah dan audit log ditambahkan.

## 10.4 Product management

Product editor dibagi menjadi sections:

```txt
Basic information
Media and preview
Pricing and promotion
Digital files
License and compatibility
SEO
Publication status
Changelog
```

Gunakan sticky action bar:

```txt
[Save Draft] [Preview] [Publish / Update]
```

Unsaved changes harus menghasilkan warning sebelum meninggalkan halaman.

## 10.5 File management

Tampilan:

- file name;
- product mapping;
- version;
- type;
- size;
- uploaded date;
- download count;
- active/archived;
- actions.

Upload file produk menggunakan private storage dan menampilkan progress.

## 10.6 Settings

Settings memakai secondary navigation di dalam content, bukan sidebar ketiga permanen pada layar sempit.

Sections:

- Store identity;
- QRIS and merchant;
- order expiry;
- proof upload limits;
- download expiry/count;
- email templates;
- admin security;
- operating hours.

Pada konfigurasi QRIS, tampilkan:

- current QR preview;
- merchant name;
- upload/replace action;
- scan test reminder;
- last updated timestamp;
- warning bahwa perubahan tidak mengubah snapshot order lama.

---

## 11. Component Inventory

## 11.1 Foundation

```txt
Button
IconButton
Link
Badge
StatusBadge
Avatar
Divider
Tooltip
Popover
DropdownMenu
ContextMenu
Dialog
AlertDialog
Drawer
Sheet
Tabs
Accordion
Toast
Skeleton
Spinner
Progress
EmptyState
ErrorState
```

## 11.2 Form

```txt
TextField
TextArea
Select
Combobox
Checkbox
RadioGroup
Switch
DatePicker
CurrencyInput
OTPInput (future)
FileUploader
FormMessage
FormSection
StickyFormActions
```

## 11.3 Storefront

```txt
CinematicHeader
MobileNavigation
HeroProductShowcase
SplitTextReveal
MaskedMedia
FloatingProductBadge
CategoryCard
ProductCard
ProductGrid
ProductGallery
ProductBuyPanel
PriceDisplay
LicenseSelector
QuickViewDrawer
CartDrawer
PromoCodeForm
FAQAccordion
TrackOrderForm
OrderTimeline
SecureDownloadCard
```

## 11.4 Payment

```txt
InvoiceSummary
PaymentStatusBanner
QRCodeCard
PaymentInstructionList
PaymentCountdown
CopyValueButton
PaymentProofUploader
ProofPreview
VerificationWaitingState
PaymentRejectedState
PaymentApprovedState
```

## 11.5 Admin

```txt
AdminShell
AdminSidebar
AdminSidebarSection
AdminSidebarItem
AdminSidebarFlyout
AdminTopbar
PageHeader
MetricCard
ChartCard
DataTable
TableToolbar
FilterBar
SavedViewMenu
BulkActionBar
OrderDetailPanel
VerificationQueue
ProofImageViewer
ComparisonField
AuditTimeline
ProductEditor
FileManager
SettingsSection
```

---

## 12. Component State Rules

Setiap interactive component minimal memiliki:

```txt
Default
Hover
Pressed
Focus-visible
Disabled
Loading
Success, bila relevan
Error, bila relevan
```

### Button hierarchy

- `Primary`: aksi utama per area;
- `Secondary`: aksi pendukung;
- `Ghost`: utility action;
- `Destructive`: hapus/tolak/batalkan;
- `Link`: navigasi ringan.

Hanya satu primary action dominan per panel atau modal.

### Status badges

Status tidak hanya dibedakan menggunakan warna.

| Status | Label | Icon opsional |
|---|---|---|
| Pending Payment | Menunggu Pembayaran | Clock |
| Waiting Verification | Menunggu Verifikasi | Scan/Search |
| Approved | Pembayaran Diterima | Check |
| Rejected | Pembayaran Ditolak | X |
| Delivered | Produk Terkirim | Download/Package |
| Expired | Kedaluwarsa | Timer Off |
| Cancelled | Dibatalkan | Ban |

---

## 13. Motion System

## 13.1 Motion layers

### Layer 1 — Functional

Digunakan untuk:

- button feedback;
- form validation;
- modal/drawer;
- cart;
- upload progress;
- sidebar collapse;
- status change.

Durasi: 100–280 ms.

### Layer 2 — Expressive

Digunakan untuk:

- text reveal;
- image mask;
- product card hover;
- section transitions;
- subtle parallax.

Durasi: 300–800 ms.

### Layer 3 — Cinematic

Digunakan terbatas pada:

- hero intro;
- pinned storytelling;
- horizontal showcase;
- page transition storefront.

Durasi tergantung scroll atau maksimal sekitar 1200 ms untuk non-scroll animation.

## 13.2 Easing tokens

```css
--ease-standard: cubic-bezier(.2, .8, .2, 1);
--ease-enter: cubic-bezier(.16, 1, .3, 1);
--ease-exit: cubic-bezier(.7, 0, .84, 0);
--ease-linear: linear;
```

## 13.3 Tool allocation

| Tool | Penggunaan |
|---|---|
| CSS transitions | Hover, focus, sidebar, dropdown sederhana |
| Motion | Drawer, modal, shared layout, cart, feedback |
| GSAP + ScrollTrigger | Pinned section, text sequencing, mask reveal, parallax |
| Lenis | Smooth scroll storefront desktop saja, bila performa memadai |

GSAP dan Lenis tidak digunakan pada admin dashboard atau transactional forms.

## 13.4 Preloader

Preloader bersifat opsional dan hanya digunakan pada kunjungan pertama sesi.

Aturan:

- maksimum 1.2 detik setelah critical content siap;
- menyediakan skip logic bila loading lambat;
- tidak muncul pada checkout, payment, tracking, admin, atau download;
- tidak memblokir screen reader;
- reduced motion langsung menampilkan halaman.

## 13.5 Reduced motion

Saat `prefers-reduced-motion: reduce`:

- smooth scroll dimatikan;
- parallax dimatikan;
- pinned scroll diubah menjadi layout normal;
- text reveal menjadi fade singkat atau langsung tampil;
- hover tilt dimatikan;
- sidebar tetap berubah state tanpa interpolasi besar;
- tidak ada auto-playing decorative video yang wajib dilihat.

---

## 14. Responsive System

## 14.1 Breakpoints

```css
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;
```

Gunakan content-driven breakpoints bila komponen pecah sebelum breakpoint global.

## 14.2 Mobile priorities

- CTA selalu terlihat;
- nominal pembayaran tidak terpotong;
- QR dapat dipindai dari layar lain;
- upload bukti mudah dari gallery/camera;
- table admin berubah menjadi card/list;
- sidebar admin menjadi drawer;
- large motion disederhanakan;
- sticky element tidak menutup keyboard;
- safe-area inset diperhitungkan.

## 14.3 Touch targets

Minimum:

- 44 × 44 px untuk primary interactive element;
- jarak antar-icon action minimal 8 px;
- destructive action tidak ditempatkan terlalu dekat dengan primary action tanpa pembeda.

---

## 15. Accessibility

Target minimal: WCAG 2.2 AA untuk alur utama.

Checklist:

- semantic HTML;
- skip-to-content link;
- visible focus;
- keyboard navigation;
- focus trap pada dialog/drawer;
- restore focus setelah dialog ditutup;
- contrast minimum AA;
- label form eksplisit;
- error dikaitkan dengan field;
- status async memakai live region seperlunya;
- alt text untuk product image;
- decorative asset memakai empty alt;
- QR image memiliki penjelasan tekstual;
- countdown tidak mengumumkan setiap detik ke screen reader;
- status tidak hanya menggunakan warna;
- tooltip bukan satu-satunya sumber informasi;
- reduced motion didukung;
- zoom hingga 200% tidak memutus flow.

---

## 16. Empty, Loading, Error, and Offline States

Setiap layar harus mendefinisikan state non-happy-path.

## 16.1 Empty states

Contoh:

- katalog tanpa hasil;
- belum ada order;
- verification queue kosong;
- belum ada file;
- report belum memiliki data.

Empty state memuat:

- judul;
- penjelasan singkat;
- satu aksi relevan;
- ilustrasi opsional yang ringan.

## 16.2 Loading

- skeleton meniru struktur final;
- hindari spinner besar pada seluruh halaman;
- button loading mempertahankan lebar;
- upload menampilkan progress bila tersedia;
- data table dapat menampilkan 6–10 skeleton rows.

## 16.3 Error

Error message harus menjelaskan:

1. apa yang gagal;
2. apakah data pengguna aman;
3. aksi berikutnya.

Contoh:

```txt
Bukti belum berhasil diunggah. File pilihanmu belum tersimpan. Coba lagi atau pilih file lain.
```

## 16.4 Offline or interrupted upload

- jangan mengubah status menjadi waiting verification sebelum submission tersimpan;
- simpan field metadata lokal sementara;
- sediakan retry;
- jangan mengunggah ganda tanpa idempotency key.

---

## 17. Content and Microcopy

## 17.1 Tone

- jelas;
- tenang;
- tidak menyalahkan pengguna;
- tidak terlalu formal;
- spesifik pada aksi berikutnya.

## 17.2 CTA baseline

| Konteks | CTA |
|---|---|
| Hero | Jelajahi Produk |
| Product | Beli Sekarang |
| Cart | Lanjut ke Checkout |
| Checkout | Buat Pesanan |
| Payment | Upload Bukti Pembayaran |
| Proof ready | Kirim untuk Verifikasi |
| Rejected | Upload Bukti Baru |
| Approved | Download Produk |
| Admin approval | Setujui Pembayaran |
| Admin rejection | Tolak Pembayaran |

## 17.3 Payment copy baseline

```txt
Bayar tepat sesuai total pesanan agar verifikasi lebih cepat.

QRIS ini bersifat statis. Masukkan nominal pembayaran secara manual di aplikasi pembayaranmu.

Setelah pembayaran berhasil, unggah screenshot bukti transaksi di bawah.
```

Hindari klaim seperti “otomatis terverifikasi” karena proses masih manual.

---

## 18. Icons and Imagery

## 18.1 Icons

Gunakan satu keluarga icon outline, disarankan Lucide.

Aturan:

- ukuran default admin 18 px;
- ukuran default storefront 20–24 px;
- stroke konsisten;
- icon dekoratif tidak memakai tooltip;
- label tetap ditampilkan kecuali pada collapsed sidebar atau utility icon yang umum.

## 18.2 Product imagery

- gunakan rasio konsisten per collection;
- sediakan art direction untuk desktop/mobile;
- gunakan AVIF/WebP bila memungkinkan;
- screenshot produk harus tajam dan realistis;
- visual mockup tidak boleh menutupi informasi penting;
- lazy-load image di bawah fold;
- hero image memiliki width/height untuk mencegah layout shift.

## 18.3 Video

- autoplay hanya untuk muted decorative preview;
- pause ketika offscreen;
- poster image wajib;
- tidak autoplay pada data-saver atau reduced motion;
- preview produk memiliki control bila mengandung informasi penting.

---

## 19. Frontend Architecture Recommendation

```txt
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui primitives
Motion
GSAP + ScrollTrigger
Lenis, storefront only
React Hook Form
Zod
TanStack Table
TanStack Query or server actions pattern
Lucide icons
```

## 19.1 Suggested component structure

```txt
components/
├── ui/
├── storefront/
│   ├── header/
│   ├── hero/
│   ├── product/
│   ├── cart/
│   └── motion/
├── commerce/
│   ├── checkout/
│   ├── payment/
│   ├── order/
│   └── download/
└── admin/
    ├── shell/
    ├── sidebar/
    ├── orders/
    ├── verification/
    ├── products/
    └── reports/
```

## 19.2 Sidebar implementation pattern

Gunakan CSS variable pada root admin shell:

```tsx
<div
  className="admin-shell"
  data-sidebar={sidebarMode}
  style={{
    "--sidebar-width": sidebarMode === "expanded" ? "248px" : "64px",
  } as React.CSSProperties}
>
  <AdminSidebar />
  <main className="admin-content">...</main>
</div>
```

```css
.admin-shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100dvh;
  transition: grid-template-columns 240ms var(--ease-standard);
}

.admin-sidebar {
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow: hidden;
}
```

Jangan menganimasikan `left` atau memindahkan seluruh content dengan transform permanen karena dapat mengganggu sticky positioning dan rendering teks.

## 19.3 State persistence

Preferred order:

1. cookie untuk server-rendered initial state;
2. localStorage sebagai fallback;
3. user preference dari database pada fase account/multi-admin.

Contoh key:

```txt
admin-sidebar-mode = expanded | collapsed
```

---

## 20. Performance Budget

Storefront animation tidak boleh mengorbankan fungsi commerce.

Target awal:

| Area | Target |
|---|---|
| LCP storefront mobile | ≤ 2.5 s pada kondisi p75 yang realistis |
| CLS | ≤ 0.1 |
| INP | ≤ 200 ms |
| Initial JS storefront | dijaga serendah mungkin; motion library dilazy-load per section |
| Admin interaction | feedback visual ≤ 100 ms |
| Sidebar animation | stabil mendekati 60 fps |
| Proof preview | gunakan optimized thumbnail; full image on demand |

Aturan implementasi:

- split GSAP code dari checkout/admin;
- dynamic import untuk section cinematic;
- jangan menginisialisasi ScrollTrigger pada elemen yang tidak ada;
- pause animation saat tab hidden;
- gunakan transform/opacity untuk animation;
- hindari blur besar pada banyak layer;
- virtualize table hanya ketika jumlah row memang membutuhkannya;
- compress proof preview tanpa merusak file asli yang disimpan.

---

## 21. Security-sensitive UX

Design tidak menggantikan keamanan backend, tetapi harus membantu pengguna memahami state aman.

- secure order token tidak ditampilkan penuh pada UI;
- bukti pembayaran hanya terlihat oleh pembeli terkait dan admin;
- admin destructive action memerlukan confirmation yang proporsional;
- approval/rejection menampilkan invoice target dengan jelas;
- file URL asli tidak pernah disalin ke clipboard;
- download expired memberikan jalur meminta akses ulang;
- session expired pada admin tidak menghapus form edit tanpa warning;
- sensitive settings menampilkan last changed metadata;
- audit log bersifat read-only dari UI standar.

---

## 22. Analytics Events for UX

```txt
home_viewed
hero_cta_clicked
catalog_filter_changed
product_viewed
buy_now_clicked
cart_opened
checkout_started
checkout_validation_failed
order_created
payment_page_viewed
qris_opened
invoice_copied
amount_copied
proof_upload_started
proof_upload_failed
proof_submitted
order_status_viewed
download_started
download_failed
admin_sidebar_collapsed
admin_sidebar_expanded
verification_opened
payment_approved
payment_rejected
```

Jangan mengirim file bukti, token, atau data pribadi mentah ke analytics.

---

## 23. Design QA Checklist

### Storefront

- [ ] Hero CTA terlihat tanpa menunggu animasi selesai.
- [ ] Header tetap terbaca pada seluruh background.
- [ ] Product cards bekerja dengan mouse, keyboard, dan touch.
- [ ] Parallax tidak menyebabkan motion sickness.
- [ ] Layout stabil sebelum image selesai dimuat.
- [ ] Reduced motion menghasilkan pengalaman lengkap.

### Checkout dan payment

- [ ] Total pembayaran terlihat sebelum order dibuat.
- [ ] QRIS dapat dipindai pada layar mobile dan desktop.
- [ ] Instruksi menyatakan bahwa QRIS bersifat statis.
- [ ] File invalid ditolak dengan alasan jelas.
- [ ] Upload progress dan retry tersedia.
- [ ] Status sukses tidak muncul sebelum backend mengonfirmasi submission.
- [ ] Penolakan menampilkan alasan dan upload ulang.

### Admin

- [ ] Sidebar dapat expand/collapse menggunakan tombol.
- [ ] Shortcut `Ctrl/Cmd + B` bekerja tanpa bentrok pada input.
- [ ] State sidebar bertahan setelah refresh.
- [ ] Collapsed items memiliki tooltip dan accessible label.
- [ ] Active route tetap terlihat pada kedua mode.
- [ ] Content tidak overflow ketika sidebar berubah ukuran.
- [ ] Sidebar berubah menjadi drawer pada mobile.
- [ ] Verification detail dapat dibandingkan tanpa berpindah banyak layar.
- [ ] Approve/reject memiliki confirmation dan audit feedback.

### Accessibility

- [ ] Semua fungsi dapat dioperasikan dengan keyboard.
- [ ] Focus order logis.
- [ ] Focus ring tidak terpotong.
- [ ] Kontras memenuhi AA.
- [ ] Error form dibaca screen reader.
- [ ] Status tidak hanya mengandalkan warna.
- [ ] Zoom 200% tetap usable.

---

## 24. Delivery Phases

## Phase 1 — Foundation

- tokens;
- typography;
- base components;
- storefront/admin layouts;
- responsive grid;
- sidebar expanded/collapsed;
- accessibility foundation.

## Phase 2 — Commerce Core

- catalog;
- product detail;
- cart;
- checkout;
- invoice/payment;
- proof uploader;
- order tracking;
- secure download.

## Phase 3 — Admin Operations

- dashboard;
- orders table;
- verification queue;
- product/file management;
- settings;
- reports baseline.

## Phase 4 — Cinematic Layer

- hero choreography;
- text reveals;
- masked media;
- pinned storytelling;
- page transitions;
- animation performance tuning;
- reduced-motion variants.

Urutan ini memastikan transaksi dan admin flow selesai sebelum efek sinematik ditambahkan.

---

## 25. Open Design Decisions

Hal berikut perlu dikunci sebelum high-fidelity design final:

1. Nama brand dan logo.
2. Warna aksen final.
3. Jenis produk digital pertama.
4. Apakah cart mendukung banyak produk pada peluncuran.
5. Apakah nominal memakai unique code untuk membantu verifikasi manual.
6. Jam operasional dan estimasi verifikasi yang ditampilkan.
7. Apakah admin terdiri dari satu orang atau beberapa role.
8. Apakah homepage memakai preloader.
9. Apakah storefront menggunakan dark mode section atau seluruh theme.
10. Apakah file delivery berupa direct file, external access link, atau keduanya.

---

## 26. Definition of Design Ready

Design dianggap siap masuk implementasi ketika:

- seluruh halaman MVP memiliki desktop dan mobile layout;
- seluruh critical flow memiliki loading, empty, success, dan error state;
- sidebar admin memiliki expanded, collapsed, flyout, dan mobile drawer state;
- component variants dan token telah ditentukan;
- checkout, QRIS, proof upload, rejection, approval, dan download telah diprototipekan;
- keyboard flow telah diuji;
- reduced-motion behavior telah didefinisikan;
- copy kritis telah disetujui;
- data yang dibutuhkan setiap screen dapat dipetakan ke requirement dalam `prd.md`;
- design QA checklist tidak memiliki blocker.

---

## 27. Final Direction

Storefront harus terasa seperti karya editorial yang hidup, sedangkan transaksi harus terasa sesederhana mengikuti instruksi yang jelas. Admin dashboard memakai sidebar hierarkis seperti referensi: **expanded untuk konteks penuh, collapsed sebagai icon rail, state persisten, submenu melalui flyout, dan drawer pada mobile**.

Hasil akhirnya bukan sekadar landing page animatif yang memiliki tombol beli, tetapi sistem commerce lengkap dengan karakter visual kuat dan operasi admin yang efisien.
