import { test, expect, type Page } from '@playwright/test';
import { db } from '../../src/lib/db';

const PRODUCT_SLUG = 'lumina-ui-kit';
const CHECKOUT_COUPON = 'E2E-CHECKOUT-10';

/** Fails the test on any console error, so hydration warnings cannot slip by. */
function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  // The browser asks for /favicon.ico on its own and this project ships none.
  // That 404 predates these dialogs and is not what these tests are guarding.
  const isIgnorable = (text: string) => text.includes('/favicon.ico');

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location()?.url ?? '';
    if (isIgnorable(location)) return;
    errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  // Console text for a failed asset omits the URL, which makes a bare 404 in the
  // report impossible to trace back to a request.
  page.on('response', (response) => {
    if (response.status() >= 400 && !isIgnorable(response.url())) {
      errors.push(`HTTP ${response.status()} ${response.url()}`);
    }
  });
  return errors;
}

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.fill('input[type="email"]', 'admin@webstore.local');
  await page.fill('input[type="password"]', 'AdminSecret123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin');
}

test.describe('Product detail redesign', () => {
  test.beforeAll(async () => {
    await db.coupon.upsert({
      where: { code: CHECKOUT_COUPON },
      update: {
        type: 'PERCENTAGE',
        value: 10,
        minPurchase: 100_000,
        maxUsage: 100,
        currentUsage: 0,
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 60 * 60_000),
        isActive: true,
      },
      create: {
        code: CHECKOUT_COUPON,
        type: 'PERCENTAGE',
        value: 10,
        minPurchase: 100_000,
        maxUsage: 100,
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 60 * 60_000),
        isActive: true,
      },
    });
  });

  test.afterAll(async () => {
    const coupon = await db.coupon.findUnique({ where: { code: CHECKOUT_COUPON }, select: { id: true } });
    if (!coupon) return;

    const orders = await db.order.findMany({
      where: { couponCode: CHECKOUT_COUPON },
      select: { id: true, customerAccessId: true },
    });
    const orderIds = orders.map((order) => order.id);
    const customerAccessIds = [...new Set(orders.map((order) => order.customerAccessId))];
    await db.$transaction(async (tx) => {
      await tx.couponUsage.deleteMany({ where: { couponId: coupon.id } });
      if (orderIds.length > 0) await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      await tx.coupon.delete({ where: { id: coupon.id } });
      if (customerAccessIds.length > 0) {
        await tx.customerAccess.deleteMany({
          where: { id: { in: customerAccessIds }, orders: { none: {} }, account: null },
        });
      }
    });
  });

  test('renders the editorial sections and a working purchase panel', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(`/products/${PRODUCT_SLUG}`);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tentang produk ini' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Yang kamu dapatkan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kompatibilitas dan kebutuhan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Informasi lisensi' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pertanyaan umum' })).toBeVisible();

    // The buy CTA must be a button that opens a dialog, never a navigation link.
    const buyButton = page.getByRole('button', { name: 'Beli Sekarang' });
    await expect(buyButton).toBeVisible();

    // FAQ disclosure works without client JS wiring.
    const firstQuestion = page.locator('details summary').first();
    await firstQuestion.click();
    await expect(page.locator('details[open]').first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('checkout dialog opens in place, validates, and blocks duplicate submits', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(`/products/${PRODUCT_SLUG}`);

    await page.getByRole('button', { name: 'Beli Sekarang' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/products/${PRODUCT_SLUG}$`));

    const submit = dialog.getByRole('button', { name: 'Buat Pesanan & Bayar QRIS' });
    await expect(submit).toBeVisible();

    // Empty form surfaces inline validation instead of posting.
    await submit.click();
    await expect(dialog.getByText('Nama lengkap wajib diisi')).toBeVisible();
    await expect(dialog.getByText('Format email tidak valid')).toBeVisible();

    await dialog.locator('#checkout-name').fill('QA Buyer');
    await dialog.locator('#checkout-email').fill(`qa-${Date.now()}@example.com`);
    await dialog.locator('#checkout-whatsapp').fill('08123456789');

    // Real coupon validation through the service, not a hardcoded check.
    await dialog.locator('#checkout-coupon').fill(CHECKOUT_COUPON);
    await dialog.getByRole('button', { name: 'Gunakan' }).click();
    await expect(dialog.getByText(new RegExp(`${CHECKOUT_COUPON} diterapkan`))).toBeVisible();

    await dialog.getByRole('checkbox').check();

    const checkoutCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/checkout') && request.method() === 'POST') {
        checkoutCalls.push(request.url());
      }
    });

    await submit.click();

    // Same dialog swaps to the QRIS step rather than redirecting.
    await expect(dialog.getByText('Pesanan berhasil dibuat.', { exact: false })).toBeVisible({
      timeout: 20_000,
    });
    await expect(dialog.getByText(/INV-\d{8}-/)).toBeVisible();
    await expect(dialog.getByRole('img', { name: 'Kode QRIS pembayaran' })).toBeVisible();
    await expect(dialog.getByText(/Batas pembayaran/)).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Buka Halaman Lacak Pesanan/ })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/products/${PRODUCT_SLUG}$`));

    expect(checkoutCalls.length).toBe(1);
    expect(errors).toEqual([]);
  });

  test('checkout dialog closes on Escape and reopens clean', async ({ page }) => {
    await page.goto(`/products/${PRODUCT_SLUG}`);

    await page.getByRole('button', { name: 'Beli Sekarang' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.locator('#checkout-name').fill('Discarded Draft');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'Beli Sekarang' }).click();
    await expect(page.getByRole('dialog').locator('#checkout-name')).toHaveValue('');
  });

  test('checkout dialog is usable on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/products/${PRODUCT_SLUG}`);

    await page.getByRole('button', { name: 'Beli Sekarang' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Collapsible summary stands in for the desktop sticky aside.
    const summaryToggle = dialog.getByRole('button', { name: /Ringkasan pesanan/ });
    await expect(summaryToggle).toBeVisible();
    await summaryToggle.click();
    await expect(summaryToggle).toHaveAttribute('aria-expanded', 'true');

    await expect(dialog.getByRole('button', { name: 'Buat Pesanan & Bayar QRIS' })).toBeVisible();
  });
});

test.describe('Admin product creation dialog', () => {
  test('opens as a dialog from the products page and validates in place', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await loginAsAdmin(page);

    await page.goto('/admin/products');
    await page.getByRole('button', { name: /Tambah Produk/ }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/products$/);

    // Sticky footer actions from the brief.
    await expect(dialog.getByRole('button', { name: 'Batal' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Simpan sebagai Draft/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Publikasikan Produk/ })).toBeVisible();

    await dialog.getByRole('button', { name: /Publikasikan Produk/ }).click();
    await expect(dialog.getByText('Nama produk minimal 3 karakter')).toBeVisible();

    // Slug mirrors the name until the admin edits it directly.
    await dialog.locator('#product-name').fill('QA Dialog Product');
    await expect(dialog.locator('#product-slug')).toHaveValue('qa-dialog-product');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    expect(errors).toEqual([]);
  });

  test('deep link to /admin/products/new still opens the same dialog', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products/new');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('creates a product with uploads and refreshes the table without a reload', async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    await loginAsAdmin(page);
    await page.goto('/admin/products');

    const productName = `QA Upload Product ${Date.now()}`;

    await page.getByRole('button', { name: /Tambah Produk/ }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.locator('#product-name').fill(productName);
    await dialog.locator('#product-category').selectOption({ index: 1 });
    await dialog
      .locator('#product-description')
      .fill('Produk uji otomatis untuk memverifikasi alur unggah berkas pada dialog admin.');
    await dialog.locator('#product-price').fill('150000');
    await dialog.locator('#product-sale-price').fill('99000');
    await dialog.locator('#product-version').fill('1.0.0');

    // A 1x1 PNG and a tiny archive keep the upload real without a fixture file.
    await dialog
      .locator('label', { hasText: 'Pilih gambar preview produk' })
      .locator('input[type="file"]')
      .setInputFiles({
      name: 'preview.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
    await dialog
      .locator('label', { hasText: 'Pilih file yang akan diterima pembeli' })
      .locator('input[type="file"]')
      .setInputFiles({
      name: 'deliverable.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from('PK' + ' '.repeat(18), 'binary'),
    });

    await dialog.getByRole('button', { name: /Publikasikan Produk/ }).click();

    // Dialog closes itself once the create succeeds.
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    // Table picks up the new row via router.refresh(), not a document navigation.
    await expect(page.getByText(productName)).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin\/products$/);

    expect(errors).toEqual([]);
  });
});
