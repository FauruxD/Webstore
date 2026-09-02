import { expect, test, type Page } from '@playwright/test';

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
  await page.goto('/login?next=/admin');
  await page.locator('input[type="email"]').fill('admin@webstore.local');
  await page.locator('input[type="password"]').fill('AdminSecret123!');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await page.waitForURL('/admin');
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
      await expect.poll(() => proofImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(page.getByText('Buka di Queue Verifikasi')).toHaveCount(0);
      await expectNoPageOverflow(page);
      opened = true;
      break;
    }

    expect(opened, 'Expected at least one order with a payment proof in the local MySQL data').toBe(true);
    expect(errors).toEqual([]);
  });
});
