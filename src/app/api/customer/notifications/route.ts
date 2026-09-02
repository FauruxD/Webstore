import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { db } from '@/lib/db';

const PAGE_SIZE = 30;

export async function GET(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const beforeValue = req.nextUrl.searchParams.get('before');
  const before = beforeValue ? new Date(beforeValue) : null;
  if (before && Number.isNaN(before.getTime())) {
    return NextResponse.json({ error: 'Cursor tidak valid' }, { status: 400 });
  }
  const rows = await db.notification.findMany({
    where: { customerAccessId: session.id, ...(before ? { createdAt: { lt: before } } : {}) },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    include: { order: { select: { invoice: true } } },
  });
  return NextResponse.json({ notifications: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE });
}

