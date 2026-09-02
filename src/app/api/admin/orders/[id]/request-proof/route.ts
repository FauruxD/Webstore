import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { requestReplacementProof } from '@/lib/services/verification';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const { reason, internalNote } = await req.json();
    return NextResponse.json(await requestReplacementProof({
      orderId: id,
      adminId: session.id,
      adminEmail: session.email,
      rejectionReason: reason,
      internalNote,
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal meminta bukti baru' }, { status: 400 });
  }
}

