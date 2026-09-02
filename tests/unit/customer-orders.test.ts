import { describe, expect, it } from 'vitest';
import {
  getCustomerOrderPrimaryAction,
  getCustomerOrderStatusMeta,
  matchesCustomerOrderFilter,
  parseCustomerOrderFilter,
} from '../../src/lib/orders/customer-order';

describe('customer order presentation', () => {
  it('parses only supported filters', () => {
    expect(parseCustomerOrderFilter('action')).toBe('action');
    expect(parseCustomerOrderFilter(['completed', 'all'])).toBe('completed');
    expect(parseCustomerOrderFilter('unknown')).toBe('all');
    expect(parseCustomerOrderFilter(undefined)).toBe('all');
  });

  it('groups statuses into customer-facing filters', () => {
    expect(matchesCustomerOrderFilter('PENDING_PAYMENT', 'action')).toBe(true);
    expect(matchesCustomerOrderFilter('PAYMENT_REJECTED', 'action')).toBe(true);
    expect(matchesCustomerOrderFilter('PAYMENT_APPROVED', 'process')).toBe(true);
    expect(matchesCustomerOrderFilter('PRODUCT_SENT', 'sent')).toBe(true);
    expect(matchesCustomerOrderFilter('COMPLETED', 'completed')).toBe(true);
    expect(matchesCustomerOrderFilter('CANCELLED', 'completed')).toBe(false);
  });

  it('returns the correct primary action for each order state', () => {
    expect(getCustomerOrderPrimaryAction('PENDING_PAYMENT', 'INV-1', false)).toEqual({
      href: '/payment/INV-1',
      label: 'Bayar Sekarang',
    });
    expect(getCustomerOrderPrimaryAction('PAYMENT_REJECTED', 'INV-2', false).label).toBe('Upload Bukti Baru');
    expect(getCustomerOrderPrimaryAction('PRODUCT_SENT', 'INV-3', true)).toEqual({
      href: '/order/INV-3#downloads',
      label: 'Unduh Produk',
    });
    expect(getCustomerOrderPrimaryAction('COMPLETED', 'INV-4', false).label).toBe('Buka Pesanan');
  });

  it('exposes an accessible label and progress stage for every state', () => {
    expect(getCustomerOrderStatusMeta('PAYMENT_REJECTED')).toMatchObject({
      label: 'Pembayaran ditolak',
      progress: 2,
      tone: 'danger',
    });
    expect(getCustomerOrderStatusMeta('COMPLETED').progress).toBe(5);
  });
});
