import { NextRequest, NextResponse } from 'next/server';
import { verifyAndFetchDownload } from '@/lib/services/download';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    const result = await verifyAndFetchDownload({
      rawToken: token,
      ipAddress: ip,
      userAgent,
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(result.filename)}"`,
        'Content-Length': String(result.size),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Download error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
