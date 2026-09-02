import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ conversations: [] }, { status: 401 });
  const conversations = await db.conversation.findMany({
    where: { customerAccessId: session.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      order: { include: { items: { select: { productName: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: {
        select: {
          messages: { where: { senderType: { in: ['ADMIN', 'SYSTEM'] }, readAt: null } },
        },
      },
    },
  });
  return NextResponse.json({ conversations });
}

