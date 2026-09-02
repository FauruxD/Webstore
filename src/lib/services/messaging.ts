import { MessageKind, MessageSenderType, NotificationType, Prisma } from '@prisma/client';

const MESSAGE_LIMIT = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const rateBuckets = new Map<string, number[]>();

export function normalizeMessageBody(input: unknown, attachmentName?: string): string {
  if (typeof input !== 'string' && !attachmentName) throw new Error('Pesan wajib berupa teks');
  const normalized = (typeof input === 'string' ? input : '')
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
  if (!normalized && attachmentName) return `Lampiran: ${attachmentName}`;
  if (!normalized) throw new Error('Pesan tidak boleh kosong');
  if (normalized.length > MESSAGE_LIMIT) {
    throw new Error(`Pesan maksimal ${MESSAGE_LIMIT} karakter`);
  }
  return normalized;
}

export function assertMessageRateLimit(identity: string, now = Date.now()): void {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = (rateBuckets.get(identity) || []).filter((timestamp) => timestamp > cutoff);
  if (recent.length >= RATE_LIMIT_MAX) {
    throw new Error('Terlalu banyak pesan. Tunggu sebentar sebelum mengirim lagi.');
  }
  recent.push(now);
  rateBuckets.set(identity, recent);
}

export function resetMessageRateLimitsForTests(): void {
  rateBuckets.clear();
}

interface EnsureConversationInput {
  orderId: string;
  customerAccessId: string;
}

export async function ensureConversation(
  tx: Prisma.TransactionClient,
  { orderId, customerAccessId }: EnsureConversationInput,
) {
  return tx.conversation.upsert({
    where: { orderId },
    update: {},
    create: { orderId, customerAccessId },
  });
}

interface SystemEventInput {
  orderId: string;
  customerAccessId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  actionUrl: string;
  dedupeKey: string;
  actionLabel?: string;
  messageKind?: MessageKind;
}

export async function createSystemEvent(
  tx: Prisma.TransactionClient,
  input: SystemEventInput,
): Promise<void> {
  const conversation = await ensureConversation(tx, input);

  await tx.message.upsert({
    where: { dedupeKey: input.dedupeKey },
    update: {},
    create: {
      conversationId: conversation.id,
      senderType: MessageSenderType.SYSTEM,
      kind: input.messageKind ?? MessageKind.SYSTEM,
      body: input.body,
      actionLabel: input.actionLabel,
      actionUrl: input.actionUrl,
      dedupeKey: input.dedupeKey,
    },
  });

  await tx.notification.upsert({
    where: { dedupeKey: input.dedupeKey },
    update: {},
    create: {
      customerAccessId: input.customerAccessId,
      orderId: input.orderId,
      type: input.notificationType,
      title: input.title,
      body: input.body,
      actionUrl: input.actionUrl,
      dedupeKey: input.dedupeKey,
    },
  });

  await tx.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });
}

export async function createChatMessage(
  tx: Prisma.TransactionClient,
  input: {
    conversationId: string;
    senderType: MessageSenderType;
    senderId: string;
    body: string;
    attachment?: {
      originalName: string;
      storageKey: string;
      mimeType: string;
      size: number;
      hash: string;
    };
  },
) {
  const fileAsset = input.attachment
    ? await tx.fileAsset.create({
        data: {
          ...input.attachment,
          isPrivate: true,
        },
      })
    : null;
  const message = await tx.message.create({
    data: {
      conversationId: input.conversationId,
      senderType: input.senderType,
      senderId: input.senderId,
      body: input.body,
      kind: fileAsset ? MessageKind.ATTACHMENT : MessageKind.TEXT,
      attachments: fileAsset
        ? {
            create: { fileId: fileAsset.id },
          }
        : undefined,
    },
    include: { attachments: { include: { fileAsset: true } } },
  });
  await tx.conversation.update({
    where: { id: input.conversationId },
    data: { updatedAt: message.createdAt },
  });
  return message;
}
