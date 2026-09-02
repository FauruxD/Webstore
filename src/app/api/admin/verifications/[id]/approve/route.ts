import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { approvePayment } from '@/lib/services/verification';

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

    const result = await approvePayment({
      orderId,
      adminId: session.id,
      adminEmail: session.email,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Approval failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
