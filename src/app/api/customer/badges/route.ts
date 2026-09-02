import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ messages: 0, notifications: 0 });
  const [messages, notifications] = await Promise.all([
    db.message.count({
      where: {
        conversation: { customerAccessId: session.id },
        senderType: { in: ['ADMIN', 'SYSTEM'] },
        readAt: null,
      },
    }),
    db.notification.count({ where: { customerAccessId: session.id, readAt: null } }),
  ]);
  return NextResponse.json({ messages, notifications });
}

