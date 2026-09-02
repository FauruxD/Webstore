import { expect, test } from '@playwright/test';
import { db } from '../../src/lib/db';

test.describe('Customer login, registration, and logout', () => {
  test.describe.configure({ timeout: 90_000 });

  test('keeps both auth pages usable at the required responsive viewports', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900 },
      { width: 1280, height: 800 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
      { width: 360, height: 800 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      await page.goto('/login');
      await expect(page.getByRole('heading', { name: 'Selamat datang kembali.' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

      await page.goto('/register');
      await expect(page.getByRole('heading', { name: 'Buat akun pelanggan.' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Buat Akun' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    }
  });

  test('registers, logs out, and logs back in across desktop and mobile', async ({ page }) => {
    const email = `qa-browser-auth-${Date.now()}@example.test`;
    const password = 'Atelier123';
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('/favicon.ico')) errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    try {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/register');
      await expect(page.getByRole('heading', { name: 'Buat akun pelanggan.' })).toBeVisible();
      await page.getByLabel('Nama lengkap').fill('QA Browser Customer');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('WhatsApp').fill('081298765432');
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.getByLabel('Konfirmasi password').fill(password);
      await page.getByRole('button', { name: 'Buat Akun' }).click();
      await page.waitForURL('/account');
      await expect(page.getByRole('heading', { name: 'Halo, QA Browser Customer.' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

      await page.getByRole('button', { name: 'Keluar' }).click();
      await page.waitForURL('/');
      await expect.poll(async () => (await page.request.get('/api/customer/auth/session')).json()).toMatchObject({ customer: null });

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/login?next=/account');
      await expect(page.getByRole('heading', { name: 'Selamat datang kembali.' })).toBeVisible();
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Masuk', exact: true }).click();
      await page.waitForURL('/account');
      await expect(page.getByRole('heading', { name: 'Halo, QA Browser Customer.' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      const account = await db.account.findUnique({
        where: { emailNormalized: email },
        select: { customerAccessId: true },
      });
      if (account) {
        await db.account.delete({ where: { emailNormalized: email } });
        if (account.customerAccessId) await db.customerAccess.delete({ where: { id: account.customerAccessId } });
      }
    }
  });

  test('uses the same login page for admin and routes by account role', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForURL('/login?next=/admin');
    await expect(page.getByRole('heading', { name: 'Selamat datang kembali.' })).toBeVisible();
    await page.getByLabel('Email').fill('admin@webstore.local');
    await page.getByLabel('Password', { exact: true }).fill('AdminSecret123!');
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await page.waitForURL('/admin');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});
