import { describe, it, expect } from 'vitest';
import { formatRupiah, generateInvoiceNumber } from '../../src/lib/utils/invoice';
import { generateSecureToken, hashToken, verifyToken } from '../../src/lib/utils/token';
import { isValidStatusTransition } from '../../src/lib/services/order-state';

describe('Business Rules & Utility Unit Tests', () => {
  describe('Money & Rupiah Formatting', () => {
    it('should format integer minor IDR correctly without floating point artifacts', () => {
      expect(formatRupiah(199000)).toContain('199.000');
      expect(formatRupiah(0)).toContain('0');
      expect(formatRupiah(5000)).toContain('5.000');
    });
  });

  describe('Invoice Generation', () => {
    it('should generate valid INV-YYYYMMDD-XXXX pattern', () => {
      const invoice = generateInvoiceNumber(new Date('2026-08-01'));
      expect(invoice).toMatch(/^INV-20260801-[0-9A-F]{4}$/);
    });
  });

  describe('Secure Token & Hashing', () => {
    it('should generate high entropy token and verify SHA256 hash', () => {
      const rawToken = generateSecureToken(32);
      expect(rawToken).toHaveLength(64); // 32 bytes hex = 64 chars

      const tokenHash = hashToken(rawToken);
      expect(tokenHash).toHaveLength(64);
      expect(verifyToken(rawToken, tokenHash)).toBe(true);
      expect(verifyToken('wrong-token', tokenHash)).toBe(false);
    });
  });

  describe('Order State Machine Transitions', () => {
    it('should allow valid transitions according to PRD', () => {
      expect(isValidStatusTransition('PENDING_PAYMENT', 'WAITING_VERIFICATION')).toBe(true);
      expect(isValidStatusTransition('WAITING_VERIFICATION', 'PAYMENT_APPROVED')).toBe(true);
      expect(isValidStatusTransition('WAITING_VERIFICATION', 'PAYMENT_REJECTED')).toBe(true);
      expect(isValidStatusTransition('PAYMENT_REJECTED', 'WAITING_VERIFICATION')).toBe(true);
      expect(isValidStatusTransition('PAYMENT_APPROVED', 'PRODUCT_SENT')).toBe(true);
      expect(isValidStatusTransition('PRODUCT_SENT', 'COMPLETED')).toBe(true);
    });

    it('should reject invalid illegal state jumps', () => {
      expect(isValidStatusTransition('PENDING_PAYMENT', 'PRODUCT_SENT')).toBe(false);
      expect(isValidStatusTransition('PAYMENT_APPROVED', 'COMPLETED')).toBe(false);
      expect(isValidStatusTransition('EXPIRED', 'PAYMENT_APPROVED')).toBe(false);
    });
  });
});
