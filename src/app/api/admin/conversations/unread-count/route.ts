import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ unreadCount: 0 }, { status: 401 });
  const unreadCount = await db.message.count({
    where: { senderType: 'CUSTOMER', readAt: null },
  });
  return NextResponse.json({ unreadCount });
}

