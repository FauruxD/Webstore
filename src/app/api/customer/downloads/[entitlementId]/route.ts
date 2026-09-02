import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import { verifyAndFetchEntitlement } from '@/lib/services/download';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entitlementId: string }> },
) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { entitlementId } = await params;
  const owned = await db.entitlement.count({
    where: { id: entitlementId, order: { customerAccessId: session.id } },
  });
  if (owned !== 1) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });

  const result = await verifyAndFetchEntitlement({
    entitlementId,
    ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: req.headers.get('user-agent') || 'Unknown',
  });
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.code });
  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      'Content-Type': result.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(result.filename)}"`,
      'Content-Length': String(result.size),
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
}

