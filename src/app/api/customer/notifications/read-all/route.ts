import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { db } from '@/lib/db';

export async function POST() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await db.notification.updateMany({
    where: { customerAccessId: session.id, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ success: true });
}

