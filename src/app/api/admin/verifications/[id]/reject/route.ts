import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { rejectPayment } from '@/lib/services/verification';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;
    const { rejectionReason, internalNote } = await req.json();

    if (!rejectionReason) {
      return NextResponse.json({ success: false, error: 'Alasan penolakan wajib diisi' }, { status: 400 });
    }

    const result = await rejectPayment({
      orderId,
      adminId: session.id,
      adminEmail: session.email,
      rejectionReason,
      internalNote,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Rejection failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
