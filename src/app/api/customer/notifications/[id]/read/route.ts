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
  const updated = await db.notification.updateMany({
    where: { id, customerAccessId: session.id },
    data: { readAt: new Date() },
  });
  if (updated.count !== 1) return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ success: true });
}

