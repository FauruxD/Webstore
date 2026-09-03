import { expect, test, type Page } from '@playwright/test';
import { db } from '../../src/lib/db';

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('/favicon.ico')) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      errors.push(`HTTP ${response.status()} ${response.url()}`);
    }
  });
  return errors;
}

async function loginAsAdmin(page: Page) {
  const response = await page.request.post('/api/auth/login', {
    data: {
      email: 'admin@webstore.local',
      password: 'AdminSecret123!',
      next: '/admin',
    },
  });
  expect(response.ok()).toBe(true);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test.describe('Admin management, report, and dashboard additions', () => {
  test.describe.configure({ timeout: 120_000 });

  test('dashboard line chart stays responsive at all supported viewports', async ({ page }) => {
    const errors = trackErrors(page);
    await loginAsAdmin(page);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto('/admin');
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByRole('img', { name: /Grafik garis pesanan dan omzet sah/ })).toBeVisible();
      await expectNoPageOverflow(page);
    }

    expect(errors).toEqual([]);
  });

  test('CRUD screens and report table fit desktop and mobile layouts', async ({ page }) => {
    const errors = trackErrors(page);
    await loginAsAdmin(page);

    const pages = [
      { path: '/admin/categories', heading: 'Kategori Produk', add: 'Tambah Kategori' },
      { path: '/admin/customers', heading: 'Daftar Pelanggan', add: 'Tambah Pelanggan' },
      { path: '/admin/coupons', heading: 'Kode Promo & Kupon', add: 'Tambah Kupon' },
      { path: '/admin/reports', heading: 'Laporan Operasional' },
    ];

    for (const viewport of [VIEWPORTS[0], VIEWPORTS[4]]) {
      await page.setViewportSize(viewport);
      for (const target of pages) {
        await page.goto(target.path);
        await expect(page.getByRole('heading', { name: target.heading })).toBeVisible();
        await expectNoPageOverflow(page);

        if (target.add) {
          await page.getByRole('button', { name: target.add }).click();
          await expect(page.getByRole('dialog')).toBeVisible();
          await expectNoPageOverflow(page);
          await page.getByRole('button', { name: 'Batal' }).click();
        } else {
          await expect(page.getByRole('link', { name: /Export Excel/ })).toBeVisible();
          await expect(page.getByRole('heading', { name: 'Detail transaksi yang dilaporkan' })).toBeVisible();
        }
      }
    }

    expect(errors).toEqual([]);
  });

  test('store settings are validated and persisted', async ({ page }) => {
    const keys = ['store_name', 'notification_email', 'support_whatsapp'];
    const previousSettings = await db.storeSetting.findMany({ where: { key: { in: keys } } });
    const startedAt = new Date();

    try {
      await page.setViewportSize(VIEWPORTS[4]);
      await loginAsAdmin(page);
      await page.goto('/admin/settings/store');

      await page.getByLabel('Nama Webstore *').fill('Digital Atelier QA');
      await page.getByLabel('Email Pengirim Notifikasi *').fill('invalid-email');
      await page.getByRole('button', { name: 'Simpan Pengaturan' }).click();
      await expect(page.getByText('Periksa kembali data pengaturan toko.', { exact: true })).toBeVisible();

      const errors = trackErrors(page);
      await page.getByLabel('Email Pengirim Notifikasi *').fill('qa@digital-atelier.test');
      await page.getByLabel('WhatsApp Dukungan Pembeli').fill('+62 812-3456-7890');
      await page.getByRole('button', { name: 'Simpan Pengaturan' }).click();
      await expect(page.getByRole('status')).toContainText('Pengaturan toko berhasil disimpan.');

      const savedSettings = await db.storeSetting.findMany({ where: { key: { in: keys } } });
      expect(Object.fromEntries(savedSettings.map((setting) => [setting.key, setting.value]))).toMatchObject({
        store_name: 'Digital Atelier QA',
        notification_email: 'qa@digital-atelier.test',
        support_whatsapp: '+62 812-3456-7890',
      });
      await expectNoPageOverflow(page);
      expect(errors).toEqual([]);
    } finally {
      await db.$transaction(async (tx) => {
        await tx.storeSetting.deleteMany({ where: { key: { in: keys } } });
        if (previousSettings.length > 0) {
          await tx.storeSetting.createMany({
            data: previousSettings.map(({ key, value }) => ({ key, value })),
          });
        }
        await tx.auditLog.deleteMany({
          where: { action: 'STORE_SETTINGS_UPDATED', createdAt: { gte: startedAt } },
        });
      });
    }
  });

  test('payment proof opens in an invoice detail dialog on mobile', async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize(VIEWPORTS[4]);
    await loginAsAdmin(page);
    await page.goto('/admin/orders');

    const orderLinks = await page.locator('a[href^="/admin/orders/"]').evaluateAll((links) =>
      Array.from(new Set(links.map((link) => (link as HTMLAnchorElement).getAttribute('href')).filter(Boolean))) as string[],
    );

    let opened = false;
    for (const orderLink of orderLinks.slice(0, 25)) {
      await page.goto(orderLink);
      const proofButton = page.getByRole('button', { name: 'Lihat Detail Bukti' }).first();
      if ((await proofButton.count()) === 0) continue;
      await proofButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      const proofImage = page.getByRole('img', { name: /Bukti pembayaran/ });
      await expect(proofImage).toBeVisible();
      await expect.poll(
        () => proofImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
        { timeout: 15_000 },
      ).toBe(true);
      await expect(page.getByText('Buka di Queue Verifikasi')).toHaveCount(0);
      await expectNoPageOverflow(page);
      opened = true;
      break;
    }

    expect(opened, 'Expected at least one order with a payment proof in the local MySQL data').toBe(true);
    expect(errors).toEqual([]);
  });

  test('admin can persist a QRIS image and customers can load it', async ({ page }) => {
    const keys = [
      'qris_image_url',
      'qris_image_data',
      'qris_image_mime',
      'qris_image_filename',
      'qris_image_hash',
      'qris_image_version',
    ];
    const previousSettings = await db.storeSetting.findMany({ where: { key: { in: keys } } });
    const startedAt = new Date();
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    const errors = trackErrors(page);

    try {
      await page.setViewportSize(VIEWPORTS[4]);
      await loginAsAdmin(page);
      await page.goto('/admin/settings/payment');

      const fileInput = page.locator('#qris-image');
      await expect(fileInput).toHaveCount(1);
      const saveButton = page.getByRole('button', { name: 'Simpan Gambar QRIS' });
      await expect(saveButton).toBeDisabled();

      await fileInput.setInputFiles({ name: 'qa-qris.png', mimeType: 'image/png', buffer: png });
      await expect(page.getByText('qa-qris.png', { exact: true })).toBeVisible();
      await expect(saveButton).toBeEnabled();
      await saveButton.click();

      await expect(page.getByRole('status')).toContainText('Gambar QRIS berhasil disimpan.');
      const saved = await db.storeSetting.findUniqueOrThrow({ where: { key: 'qris_image_url' } });
      expect(saved.value).toBe('/api/qris-image');

      const imageResponse = await page.request.get('/api/qris-image');
      expect(imageResponse.status()).toBe(200);
      expect(imageResponse.headers()['content-type']).toBe('image/png');
      expect(Buffer.from(await imageResponse.body())).toEqual(png);
      await expectNoPageOverflow(page);
      expect(errors).toEqual([]);
    } finally {
      await db.$transaction(async (tx) => {
        await tx.storeSetting.deleteMany({ where: { key: { in: keys } } });
        if (previousSettings.length > 0) {
          await tx.storeSetting.createMany({
            data: previousSettings.map(({ key, value }) => ({ key, value })),
          });
        }
        await tx.auditLog.deleteMany({
          where: { action: 'QRIS_IMAGE_UPDATED', createdAt: { gte: startedAt } },
        });
      });
    }
  });
});
