import { beforeEach, describe, expect, it } from 'vitest';
import {
  assertMessageRateLimit,
  normalizeMessageBody,
  resetMessageRateLimitsForTests,
} from '@/lib/services/messaging';
import { createCustomerSessionToken, verifyCustomerSessionToken } from '@/lib/customer-auth';
import { validateUpload } from '@/lib/files/upload-validation';

describe('message input security', () => {
  beforeEach(() => resetMessageRateLimitsForTests());

  it('normalizes line endings and strips unsafe control characters', () => {
    expect(normalizeMessageBody('  Halo\r\nadmin\u0000  ')).toBe('Halo\nadmin');
  });

  it('rejects empty and oversized messages', () => {
    expect(() => normalizeMessageBody('   ')).toThrow(/tidak boleh kosong/i);
    expect(() => normalizeMessageBody('x'.repeat(2001))).toThrow(/maksimal 2000/i);
  });

  it('allows an attachment-only message while retaining a useful preview', () => {
    expect(normalizeMessageBody('', 'brief.pdf')).toBe('Lampiran: brief.pdf');
  });

  it('validates attachment signatures and rejects executable extensions', async () => {
    const png = new File(
      [Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      'preview.png',
      { type: 'image/png' },
    );
    await expect(validateUpload(png, 'CHAT_ATTACHMENT')).resolves.toMatchObject({
      mimeType: 'image/png',
      isImage: true,
    });
    const executable = new File([Uint8Array.from([0x4d, 0x5a])], 'payload.exe');
    await expect(validateUpload(executable, 'CHAT_ATTACHMENT')).rejects.toThrow(/harus berupa/i);
  });

  it('rate limits the thirteenth message in one minute', () => {
    for (let index = 0; index < 12; index += 1) {
      expect(() => assertMessageRateLimit('customer:test', 1000 + index)).not.toThrow();
    }
    expect(() => assertMessageRateLimit('customer:test', 2000)).toThrow(/terlalu banyak pesan/i);
  });
});

describe('signed customer session', () => {
  it('accepts an authentic token and rejects a tampered token', () => {
    const token = createCustomerSessionToken('customer-access-id');
    expect(verifyCustomerSessionToken(token)?.customerAccessId).toBe('customer-access-id');
    expect(verifyCustomerSessionToken(`${token}tampered`)).toBeNull();
  });
});
