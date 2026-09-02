import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const unreadOnly = req.nextUrl.searchParams.get('filter') === 'unread';
  const conversations = await db.conversation.findMany({
    where: unreadOnly
      ? { messages: { some: { senderType: 'CUSTOMER', readAt: null } } }
      : undefined,
    orderBy: { updatedAt: 'desc' },
    include: {
      order: { include: { items: { select: { productName: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: {
        select: { messages: { where: { senderType: 'CUSTOMER', readAt: null } } },
      },
    },
  });

  return NextResponse.json({ conversations });
}

