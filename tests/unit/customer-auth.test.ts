import { beforeEach, describe, expect, it } from 'vitest';
import {
  CustomerLoginSchema,
  CustomerRegisterSchema,
  safeAdminRedirect,
  safeCustomerRedirect,
  safeLoginIntent,
} from '../../src/lib/validation/customer-auth';
import {
  assertCustomerAuthRateLimit,
  CustomerAuthRateLimitError,
  resetCustomerAuthRateLimitsForTests,
} from '../../src/lib/services/customer-auth-rate-limit';

describe('Customer account validation', () => {
  it('normalizes a valid registration payload', () => {
    const result = CustomerRegisterSchema.parse({
      displayName: ' Naufal Hilmi ',
      email: 'NAUFAL@EXAMPLE.COM ',
      whatsapp: ' 0812 3456 7890 ',
      password: 'Atelier123',
      next: '/account',
    });
    expect(result).toMatchObject({
      displayName: 'Naufal Hilmi',
      email: 'naufal@example.com',
      whatsapp: '0812 3456 7890',
    });
  });

  it('rejects weak passwords and invalid login email', () => {
    expect(CustomerRegisterSchema.safeParse({
      displayName: 'Naufal',
      email: 'naufal@example.com',
      whatsapp: '',
      password: 'password',
    }).success).toBe(false);
    expect(CustomerLoginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false);
  });

  it('allows only same-origin relative redirects', () => {
    expect(safeCustomerRedirect('/messages?conversation=abc')).toBe('/messages?conversation=abc');
    expect(safeCustomerRedirect('https://evil.example')).toBe('/account');
    expect(safeCustomerRedirect('//evil.example')).toBe('/account');
    expect(safeCustomerRedirect('/\\evil.example')).toBe('/account');
    expect(safeCustomerRedirect('/admin/orders')).toBe('/account');
    expect(safeAdminRedirect('/admin/orders')).toBe('/admin/orders');
    expect(safeAdminRedirect('/orders')).toBe('/admin');
    expect(safeLoginIntent('/admin')).toBe('/admin');
  });
});

describe('Customer auth rate limiting', () => {
  beforeEach(() => resetCustomerAuthRateLimitsForTests());

  it('blocks attempts after the configured limit', () => {
    for (let index = 0; index < 3; index += 1) {
      assertCustomerAuthRateLimit('login:local:test@example.com', { maxAttempts: 3, windowMs: 60_000 }, index);
    }
    expect(() => assertCustomerAuthRateLimit(
      'login:local:test@example.com',
      { maxAttempts: 3, windowMs: 60_000 },
      3,
    )).toThrow(CustomerAuthRateLimitError);
  });
});
