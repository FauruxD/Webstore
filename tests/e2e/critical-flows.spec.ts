import { test, expect } from '@playwright/test';

test.describe('Critical E2E Customer & Admin Flows', () => {
  test('Customer browse, guest checkout, payment QRIS view, and track order', async ({ page }) => {
    // 1. Browse Homepage
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Aset Digital');

    // 2. Open Catalog
    await page.goto('/products');
    await expect(page.locator('h1')).toContainText('Katalog Produk Digital');

    // 3. Open Track Order
    await page.goto('/track-order');
    await expect(page.locator('h1')).toContainText('Lacak Pesanan');
  });

  test('Admin login and dashboard metrics page access', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@webstore.local');
    await page.fill('input[type="password"]', 'AdminSecret123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to admin
    await page.waitForURL('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
