import { describe, expect, it } from 'vitest';
import { relativeRedirect } from '../../src/lib/relative-redirect';

describe('deployment-safe relative redirects', () => {
  it('keeps logout navigation on the active public origin', () => {
    const response = relativeRedirect('/login');

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/login');
  });

  it('rejects external and malformed redirect targets', () => {
    expect(() => relativeRedirect('https://evil.example')).toThrow();
    expect(() => relativeRedirect('//evil.example')).toThrow();
    expect(() => relativeRedirect('/\\evil.example')).toThrow();
  });
});
