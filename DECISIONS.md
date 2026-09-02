# Project Architectural & Product Decisions (DECISIONS.md)

This file documents key implementation choices, default settings, and architectural trade-offs made during the development of the Webstore Produk Digital MVP based on `prd.md` and `design.md`.

---

## 1. Storefront & Branding Defaults
- **Language & Copy**: Bahasa Indonesia for all public, transactional, and admin interfaces.
- **Currency**: Indonesian Rupiah (`IDR`), calculated strictly in integer minor units to prevent floating-point rounding bugs.
- **Store Name & Placeholder Branding**: "Digital Atelier" / "FaRu Digital Store", accent color `--store-accent: #6657E8`.

## 2. Payment & QRIS Strategy
- **Payment Method**: Static QRIS image with manual admin verification. No automatic webhooks/callbacks in MVP.
- **Order Expiry**: Unpaid orders expire after 24 hours. Orders with an active proof submitted in `WAITING_VERIFICATION` status are protected from auto-expiration.
- **Unique Payment Code**: Optional unique 1-999 IDR amount generator is available via settings but disabled by default.

## 3. Security & Hashing Controls
- **Order Tracking Access**: Uses high-entropy secure tokens (`secureTokenHash` saved in DB; raw token transmitted in URL to customer).
- **Download Entitlements**: Validates download limit (default 5 downloads) and token expiry (default 7 days). Files served via protected API stream (`/api/download/[token]`), never via direct public URLs.
- **Private Storage**: Product digital assets and payment proof images are stored in a private directory (`/storage/private`) accessible only via server-side authorization.

## 4. Admin Sidebar & UI Architecture
- **Sidebar Desktop Width**: 248px expanded, 64px collapsed icon rail.
- **Sidebar Keyboard Shortcut**: `Ctrl/Cmd + B` toggles state.
- **Sidebar Persistence**: Preference stored in `admin_sidebar_mode` cookie for zero-flicker SSR rendering, synced with `localStorage`.
- **Mobile Sidebar**: Off-canvas 320px drawer with focus trap, backdrop overlay, and Escape key listener.

## 5. Persistence & Adapters
- **Database Engine**: Prisma ORM with SQLite for zero-dependency local development (`dev.db`), fully compatible with PostgreSQL.
- **Storage Driver**: Modular storage service (`src/lib/storage/index.ts`) supporting local disk storage and cloud S3/R2 storage.
- **Email Driver**: Modular mailer service (`src/lib/email/index.ts`) supporting console logging for dev and Resend for production.
