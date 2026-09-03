import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_PATH || './storage/private');

async function ensureStorageDir() {
  try {
    await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create local storage directory:', err);
  }
}

export interface SaveFileOptions {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  isPrivate?: boolean;
}

export interface SavedFileInfo {
  storageKey: string;
  size: number;
  hash: string;
}

export async function saveFileToStorage({
  buffer,
  originalName,
}: SaveFileOptions): Promise<SavedFileInfo> {
  await ensureStorageDir();

  const ext = path.extname(originalName) || '.bin';
  const randomKey = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`;
  const filePath = path.join(LOCAL_STORAGE_DIR, randomKey);

  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  await fs.writeFile(filePath, buffer);

  return {
    storageKey: randomKey,
    size: buffer.length,
    hash,
  };
}

export async function getFileFromStorage(storageKey: string): Promise<Buffer> {
  const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);
  try {
    return await fs.readFile(filePath);
  } catch {
    throw new Error(`File not found in storage: ${storageKey}`);
  }
}

export async function deleteFileFromStorage(storageKey: string): Promise<void> {
  const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.warn(`File deletion warning for key ${storageKey}:`, err);
  }
}
