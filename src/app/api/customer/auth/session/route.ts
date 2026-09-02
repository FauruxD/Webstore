import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getCustomerSession();
  return NextResponse.json(
    {
      customer: session
        ? {
            displayName: session.displayName,
            email: session.emailNormalized,
            whatsapp: session.whatsapp,
            isRegistered: session.isRegistered,
          }
        : null,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
