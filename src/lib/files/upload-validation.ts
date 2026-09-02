import path from 'path';

export type UploadPurpose = 'CHAT_ATTACHMENT' | 'ORDER_DELIVERY';

const CHAT_MAX_BYTES = 10 * 1024 * 1024;
const DELIVERY_MAX_BYTES = 100 * 1024 * 1024;

const CHAT_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.zip', '.txt',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
]);

const DELIVERY_EXTENSIONS = new Set([
  ...CHAT_EXTENSIONS,
  '.rar', '.7z', '.fig', '.sketch', '.psd', '.ai', '.xd', '.mp4', '.mov',
]);

const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.msi', '.bat', '.cmd', '.com', '.scr', '.ps1', '.js', '.mjs', '.cjs',
  '.html', '.htm', '.svg', '.php', '.jar',
]);

export interface ValidatedUpload {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  isImage: boolean;
}

function cleanOriginalName(input: string): string {
  const baseName = path.basename(input.replace(/\\/g, '/'))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();
  if (!baseName) throw new Error('Nama file tidak valid');
  return baseName.slice(0, 180);
}

function startsWith(buffer: Buffer, bytes: number[]): boolean {
  return buffer.length >= bytes.length && bytes.every((byte, index) => buffer[index] === byte);
}

function detectSafeMime(buffer: Buffer, extension: string): { mimeType: string; isImage: boolean } | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return { mimeType: 'image/jpeg', isImage: true };
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mimeType: 'image/png', isImage: true };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mimeType: 'image/webp', isImage: true };
  }
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a') {
    return { mimeType: 'image/gif', isImage: true };
  }
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return { mimeType: 'application/pdf', isImage: false };
  if (startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) || startsWith(buffer, [0x50, 0x4b, 0x05, 0x06])) {
    const officeMimes: Record<string, string> = {
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    return { mimeType: officeMimes[extension] || 'application/zip', isImage: false };
  }
  if (startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0])) {
    const legacyOfficeMimes: Record<string, string> = {
      '.doc': 'application/msword',
      '.xls': 'application/vnd.ms-excel',
      '.ppt': 'application/vnd.ms-powerpoint',
    };
    return { mimeType: legacyOfficeMimes[extension] || 'application/octet-stream', isImage: false };
  }
  if (extension === '.rar' && buffer.subarray(0, 7).toString('hex').startsWith('526172211a07')) {
    return { mimeType: 'application/vnd.rar', isImage: false };
  }
  if (extension === '.7z' && startsWith(buffer, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) {
    return { mimeType: 'application/x-7z-compressed', isImage: false };
  }
  if (extension === '.txt' && !buffer.includes(0)) return { mimeType: 'text/plain', isImage: false };
  return null;
}

export async function validateUpload(file: File, purpose: UploadPurpose): Promise<ValidatedUpload> {
  if (!(file instanceof File) || file.size === 0) throw new Error('Pilih file yang akan diunggah');

  const originalName = cleanOriginalName(file.name);
  const extension = path.extname(originalName).toLowerCase();
  const allowedExtensions = purpose === 'CHAT_ATTACHMENT' ? CHAT_EXTENSIONS : DELIVERY_EXTENSIONS;
  const maxBytes = purpose === 'CHAT_ATTACHMENT' ? CHAT_MAX_BYTES : DELIVERY_MAX_BYTES;

  if (!extension || DANGEROUS_EXTENSIONS.has(extension) || !allowedExtensions.has(extension)) {
    throw new Error(
      purpose === 'CHAT_ATTACHMENT'
        ? 'Lampiran harus berupa gambar, PDF, ZIP, TXT, atau dokumen Office'
        : 'Format file produk tidak didukung',
    );
  }
  if (file.size > maxBytes) {
    throw new Error(
      purpose === 'CHAT_ATTACHMENT'
        ? 'Ukuran lampiran maksimal 10 MB'
        : 'Ukuran file produk maksimal 100 MB',
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectSafeMime(buffer, extension);
  const opaqueDeliveryExtension = ['.fig', '.sketch', '.psd', '.ai', '.xd', '.mp4', '.mov'].includes(extension);
  if (!detected && !(purpose === 'ORDER_DELIVERY' && opaqueDeliveryExtension)) {
    throw new Error('Isi file tidak sesuai dengan format atau ekstensi file');
  }

  return {
    buffer,
    originalName,
    mimeType: detected?.mimeType || 'application/octet-stream',
    size: buffer.length,
    isImage: detected?.isImage ?? false,
  };
}

export function normalizeDeliveryNote(input: unknown): string | null {
  if (input === null || input === undefined) return null;
  if (typeof input !== 'string') throw new Error('Catatan pengiriman tidak valid');
  const note = input
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
  if (note.length > 1000) throw new Error('Catatan pengiriman maksimal 1.000 karakter');
  return note || null;
}

export function isPreviewableImageMime(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType);
}
