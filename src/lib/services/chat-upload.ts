import { deleteFileFromStorage, saveFileToStorage } from '@/lib/storage';
import { validateUpload } from '@/lib/files/upload-validation';
import { normalizeMessageBody } from '@/lib/services/messaging';

export interface PreparedChatAttachment {
  originalName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  hash: string;
}

export interface PreparedChatPayload {
  body: string;
  attachment?: PreparedChatAttachment;
}

export async function prepareChatPayload(req: Request): Promise<PreparedChatPayload> {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    const payload = (await req.json()) as { body?: unknown };
    return { body: normalizeMessageBody(payload.body) };
  }

  const formData = await req.formData();
  const fileEntry = formData.get('attachment');
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  const validated = file ? await validateUpload(file, 'CHAT_ATTACHMENT') : null;
  const body = normalizeMessageBody(formData.get('body'), validated?.originalName);

  if (!validated) return { body };
  const saved = await saveFileToStorage({
    buffer: validated.buffer,
    originalName: validated.originalName,
    mimeType: validated.mimeType,
  });
  return {
    body,
    attachment: {
      originalName: validated.originalName,
      storageKey: saved.storageKey,
      mimeType: validated.mimeType,
      size: saved.size,
      hash: saved.hash,
    },
  };
}

export async function discardPreparedChatAttachment(payload: PreparedChatPayload): Promise<void> {
  if (payload.attachment) await deleteFileFromStorage(payload.attachment.storageKey);
}
