import crypto from 'node:crypto';

export const MAX_QRIS_IMAGE_BYTES = 2 * 1024 * 1024;

const MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
]);

export class InvalidQrisImageError extends Error {}

function hasPrefix(buffer: Buffer, signature: number[]): boolean {
  return signature.every((byte, index) => buffer[index] === byte);
}

function isValidBinaryImage(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/png') {
    return hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (mimeType === 'image/jpeg') return hasPrefix(buffer, [0xff, 0xd8, 0xff]);
  if (mimeType === 'image/webp') {
    return buffer.length >= 12
      && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

function isSafeSvg(buffer: Buffer): boolean {
  const source = buffer.toString('utf8').replace(/^\uFEFF/, '').trim();
  const containsSvgRoot = /^(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(source);
  const unsafeMarkup = /<script\b|<foreignObject\b|<!doctype\b|<!entity\b|\bon[a-z]+\s*=|javascript:|data:text\/html/i;
  return containsSvgRoot && !unsafeMarkup.test(source);
}

export interface ValidatedQrisImage {
  base64: string;
  hash: string;
  mimeType: string;
  originalName: string;
  size: number;
}

export function validateQrisImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): ValidatedQrisImage {
  if (buffer.length === 0) throw new InvalidQrisImageError('File QRIS kosong.');
  if (buffer.length > MAX_QRIS_IMAGE_BYTES) {
    throw new InvalidQrisImageError('Ukuran gambar QRIS maksimal 2 MB.');
  }
  if (!MIME_TYPES.has(mimeType)) {
    throw new InvalidQrisImageError('Format QRIS harus PNG, JPG, WebP, atau SVG.');
  }

  const contentIsValid = mimeType === 'image/svg+xml'
    ? isSafeSvg(buffer)
    : isValidBinaryImage(buffer, mimeType);
  if (!contentIsValid) {
    throw new InvalidQrisImageError('Isi file tidak sesuai dengan format gambar yang dipilih.');
  }

  return {
    base64: buffer.toString('base64'),
    hash: crypto.createHash('sha256').update(buffer).digest('hex'),
    mimeType,
    originalName: originalName.trim().slice(0, 190) || 'qris-image',
    size: buffer.length,
  };
}
