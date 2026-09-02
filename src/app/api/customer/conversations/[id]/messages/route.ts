import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import { assertMessageRateLimit, createChatMessage } from '@/lib/services/messaging';
import {
  discardPreparedChatAttachment,
  prepareChatPayload,
  type PreparedChatPayload,
} from '@/lib/services/chat-upload';

const PAGE_SIZE = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const conversation = await db.conversation.findFirst({
    where: { id, customerAccessId: session.id },
    include: { order: { include: { items: true } } },
  });
  if (!conversation) return NextResponse.json({ error: 'Percakapan tidak ditemukan' }, { status: 404 });

  const beforeValue = req.nextUrl.searchParams.get('before');
  const before = beforeValue ? new Date(beforeValue) : null;
  if (before && Number.isNaN(before.getTime())) {
    return NextResponse.json({ error: 'Cursor tidak valid' }, { status: 400 });
  }
  const rows = await db.message.findMany({
    where: { conversationId: id, ...(before ? { createdAt: { lt: before } } : {}) },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    include: { attachments: { include: { fileAsset: true } } },
  });
  const hasMore = rows.length > PAGE_SIZE;
  return NextResponse.json({ conversation, messages: rows.slice(0, PAGE_SIZE).reverse(), hasMore });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  let prepared: PreparedChatPayload | null = null;
  try {
    assertMessageRateLimit(`customer:${session.id}`);
    const conversation = await db.conversation.findFirst({
      where: { id, customerAccessId: session.id },
      select: { id: true },
    });
    if (!conversation) return NextResponse.json({ error: 'Percakapan tidak ditemukan' }, { status: 404 });
    prepared = await prepareChatPayload(req);
    const message = await db.$transaction((tx) =>
      createChatMessage(tx, {
        conversationId: conversation.id,
        senderType: 'CUSTOMER',
        senderId: session.id,
        body: prepared!.body,
        attachment: prepared!.attachment,
      }),
    );
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (prepared) await discardPreparedChatAttachment(prepared);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal mengirim pesan' },
      { status: 400 },
    );
  }
}
