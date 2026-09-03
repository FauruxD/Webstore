import { describe, expect, it } from 'vitest';
import {
  InvalidQrisImageError,
  MAX_QRIS_IMAGE_BYTES,
  validateQrisImage,
} from '../../src/lib/qris-image';

describe('QRIS image validation', () => {
  it('accepts a PNG whose content matches its MIME type', () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    const result = validateQrisImage(png, 'image/png', 'qris.png');

    expect(result).toMatchObject({ mimeType: 'image/png', originalName: 'qris.png', size: png.length });
    expect(result.base64).toBe(png.toString('base64'));
    expect(result.hash).toHaveLength(64);
  });

  it('rejects MIME spoofing, unsafe SVG, and oversized files', () => {
    expect(() => validateQrisImage(Buffer.from('not a png'), 'image/png', 'fake.png'))
      .toThrow(InvalidQrisImageError);
    expect(() => validateQrisImage(
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
      'image/svg+xml',
      'unsafe.svg',
    )).toThrow(InvalidQrisImageError);
    expect(() => validateQrisImage(
      Buffer.alloc(MAX_QRIS_IMAGE_BYTES + 1),
      'image/png',
      'large.png',
    )).toThrow('Ukuran gambar QRIS maksimal 2 MB.');
  });
});
