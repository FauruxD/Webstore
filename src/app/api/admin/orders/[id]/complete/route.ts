import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { completeOrder } from '@/lib/services/verification';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    return NextResponse.json(await completeOrder({ orderId: id, adminId: session.id, adminEmail: session.email }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal menyelesaikan pesanan' }, { status: 400 });
  }
}

