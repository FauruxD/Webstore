import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { db } from '@/lib/db';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const conversation = await db.conversation.findFirst({
    where: { id, customerAccessId: session.id },
    select: { id: true },
  });
  if (!conversation) return NextResponse.json({ error: 'Percakapan tidak ditemukan' }, { status: 404 });
  await db.message.updateMany({
    where: { conversationId: id, senderType: { in: ['ADMIN', 'SYSTEM'] }, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ success: true });
}

