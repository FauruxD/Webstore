import { describe, expect, it } from 'vitest';
import { OrderStatus } from '@prisma/client';
import { strFromU8, unzipSync } from 'fflate';
import {
  CategoryPayloadSchema,
  CouponPayloadSchema,
  CustomerPayloadSchema,
} from '../../src/lib/validation/admin-resources';
import { buildReportWhere, parseReportFilters, type ReportOrder } from '../../src/lib/reports/reporting';
import { buildSalesReportXlsx } from '../../src/lib/reports/xlsx';

describe('Admin resource validation', () => {
  it('normalizes a valid category and rejects unsafe slugs', () => {
    expect(CategoryPayloadSchema.parse({
      name: ' UI Kits ',
      slug: 'UI-KITS',
      description: '',
      imageUrl: '/images/ui-kits.jpg',
    })).toEqual({
      name: 'UI Kits',
      slug: 'ui-kits',
      description: null,
      imageUrl: '/images/ui-kits.jpg',
    });

    expect(CategoryPayloadSchema.safeParse({
      name: 'Unsafe',
      slug: '../unsafe',
      description: '',
      imageUrl: '',
    }).success).toBe(false);
  });

  it('normalizes customer email and validates WhatsApp characters', () => {
    const customer = CustomerPayloadSchema.parse({
      displayName: ' Naufal Hilmi ',
      emailNormalized: 'NAUFAL@EXAMPLE.COM ',
      whatsapp: '+62 812-3456-7890',
    });
    expect(customer.emailNormalized).toBe('naufal@example.com');
    expect(CustomerPayloadSchema.safeParse({
      displayName: 'Naufal Hilmi',
      emailNormalized: 'naufal@example.com',
      whatsapp: '<script>',
    }).success).toBe(false);
  });

  it('rejects invalid coupon percentages and periods', () => {
    const parsed = CouponPayloadSchema.safeParse({
      code: 'PROMO150',
      type: 'PERCENTAGE',
      value: 150,
      minPurchase: 0,
      maxUsage: 10,
      perEmailLimit: 1,
      startsAt: '2026-08-10T10:00',
      endsAt: '2026-08-09T10:00',
      isActive: true,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['value', 'endsAt']),
      );
    }
  });
});

describe('Report filters and Excel export', () => {
  it('normalizes report filters and ignores unknown statuses', () => {
    const filters = parseReportFilters({
      q: '  INV-2026  ',
      status: 'NOT_A_STATUS',
      from: '2026-08-01',
      to: '2026-08-04',
    });
    expect(filters).toEqual({ q: 'INV-2026', status: '', from: '2026-08-01', to: '2026-08-04' });
    expect(buildReportWhere(filters)).toMatchObject({
      createdAt: { gte: expect.any(Date), lt: expect.any(Date) },
      OR: expect.any(Array),
    });
  });

  it('creates a valid XLSX package with typed totals and escaped customer content', () => {
    const order = {
      id: 'order-1',
      invoice: 'INV-20260804-TEST',
      status: OrderStatus.COMPLETED,
      customerName: '<Naufal & Team>',
      customerEmail: 'naufal@example.com',
      customerWhatsapp: '081234567890',
      subtotal: 100_000,
      discount: 10_000,
      uniqueAmount: 0,
      total: 90_000,
      couponCode: 'PROMO10',
      createdAt: new Date('2026-08-04T03:00:00.000Z'),
      paymentApprovedAt: new Date('2026-08-04T03:10:00.000Z'),
      productSentAt: new Date('2026-08-04T03:20:00.000Z'),
      completedAt: new Date('2026-08-04T03:30:00.000Z'),
      items: [{ id: 'item-1', productName: 'UI Kit', quantity: 1, unitPrice: 100_000 }],
      entitlements: [{ downloadCount: 2 }],
    } as unknown as ReportOrder;

    const workbook = buildSalesReportXlsx([order], {
      q: '',
      status: '',
      from: '2026-08-01',
      to: '2026-08-04',
    });
    const archive = unzipSync(workbook);
    expect(Object.keys(archive)).toContain('xl/worksheets/sheet1.xml');
    const sheet = strFromU8(archive['xl/worksheets/sheet1.xml']);
    const styles = strFromU8(archive['xl/styles.xml']);
    expect(sheet).toContain('&lt;Naufal &amp; Team&gt;');
    expect(sheet).toContain('<c r="E2" t="inlineStr" s="7"><is><t xml:space="preserve">081234567890</t></is></c>');
    expect(styles).toContain('numFmtId="49"');
    const orderDateSerial = Number(sheet.match(/<c r="B2" s="3"><v>([^<]+)<\/v><\/c>/)?.[1]);
    expect(orderDateSerial).toBeCloseTo(46_238 + (10 / 24), 6);
    expect(sheet).toContain('<f>SUM(I2:I2)</f><v>90000</v>');
    expect(sheet).toContain('<autoFilter ref="A1:O2"/>');
  });
});
