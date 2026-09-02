import { expect, test } from '@playwright/test';
import { db } from '../../src/lib/db';

test.describe('Pesanan Saya', () => {
  test.describe.configure({ timeout: 90_000 });

  test('shows only orders owned by the active customer session', async ({ page }) => {
    const stamp = Date.now();
    const email = `qa-orders-${stamp}@example.test`;
    const password = 'Atelier123';
    const invoice = `INV-QA-${stamp}`;
    const foreignInvoice = `INV-FOREIGN-${stamp}`;
    let customerAccessId: string | null = null;
    let foreignCustomerAccessId: string | null = null;
    const errors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('/favicon.ico')) errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/orders');
      await expect(page.getByRole('heading', { name: 'Pesanan Saya' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Masuk ke Akun', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

      await page.goto('/register?next=/orders');
      await page.getByLabel('Nama lengkap').fill('Pelanggan QA Pesanan');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.getByLabel('Konfirmasi password').fill(password);
      await page.getByRole('button', { name: 'Buat Akun' }).click();
      await page.waitForURL('/orders');

      const account = await db.account.findUniqueOrThrow({
        where: { emailNormalized: email },
        select: { customerAccessId: true },
      });
      if (!account.customerAccessId) throw new Error('Akun QA pelanggan tidak terhubung ke CustomerAccess.');
      customerAccessId = account.customerAccessId;

      await db.order.create({
        data: {
          invoice,
          status: 'PAYMENT_REJECTED',
          customerAccessId,
          customerName: 'Pelanggan QA Pesanan',
          customerEmail: email,
          customerWhatsapp: '081234567890',
          subtotal: 125_000,
          total: 125_000,
          secureTokenHash: `qa-hash-${stamp}`,
          rejectionReason: 'Nominal pada bukti belum sesuai.',
          paymentProofSubmittedAt: new Date(),
          paymentRejectedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const foreignCustomer = await db.customerAccess.create({
        data: {
          displayName: 'Pelanggan Lain',
          emailNormalized: `qa-foreign-${stamp}@example.test`,
        },
      });
      foreignCustomerAccessId = foreignCustomer.id;
      await db.order.create({
        data: {
          invoice: foreignInvoice,
          customerAccessId: foreignCustomer.id,
          customerName: 'Pelanggan Lain',
          customerEmail: foreignCustomer.emailNormalized,
          customerWhatsapp: '081200000000',
          subtotal: 99_000,
          total: 99_000,
          secureTokenHash: `qa-foreign-hash-${stamp}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await page.goto('/orders');
      await expect(page.getByText(invoice, { exact: true })).toBeVisible();
      await expect(page.getByText('Pembayaran ditolak', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Upload Bukti Baru' })).toBeVisible();
      await expect(page.getByText(foreignInvoice, { exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

      await page.locator('a[href="/orders?status=action"]').click();
      await page.waitForURL('/orders?status=action');
      await expect(page.getByText(invoice, { exact: true })).toBeVisible();

      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/orders?status=completed');
      await expect(page.getByRole('heading', { name: 'Tidak ada pesanan di status ini.' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await db.order.deleteMany({ where: { invoice: { in: [invoice, foreignInvoice] } } });
      if (customerAccessId) await db.customerAccess.delete({ where: { id: customerAccessId } });
      if (foreignCustomerAccessId) await db.customerAccess.delete({ where: { id: foreignCustomerAccessId } });
    }
  });
});
