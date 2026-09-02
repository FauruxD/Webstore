import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession, setCustomerSessionCookie } from '@/lib/customer-auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const invoice = searchParams.get('invoice');
  const email = searchParams.get('email');

  if (!invoice || !email) {
    return NextResponse.json({ success: false, error: 'Invoice dan email wajib diisi' }, { status: 400 });
  }

  const order = await db.order.findFirst({
    where: {
      invoice: invoice.trim(),
      customerEmail: {
        equals: email.trim().toLowerCase(),
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { success: false, error: 'Pesanan tidak ditemukan atau email tidak sesuai' },
      { status: 404 }
    );
  }

  const currentSession = await getCustomerSession();
  if (currentSession?.isRegistered && currentSession.id !== order.customerAccessId) {
    return NextResponse.json(
      { success: false, error: 'Keluar dari akun saat ini sebelum membuka pesanan milik sesi pelanggan lain.' },
      { status: 409 },
    );
  }

  const response = NextResponse.json({
    success: true,
    orderUrl: `/order/${order.invoice}`,
  });
  setCustomerSessionCookie(response, order.customerAccessId);
  return response;
}
