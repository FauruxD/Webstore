import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const settings = await db.storeSetting.findMany({
    where: { key: { in: ['qris_image_data', 'qris_image_mime', 'qris_image_hash'] } },
    select: { key: true, value: true },
  });
  const values = new Map(settings.map((setting) => [setting.key, setting.value]));
  const base64 = values.get('qris_image_data');
  const mimeType = values.get('qris_image_mime');
  const hash = values.get('qris_image_hash');

  if (!base64 || !mimeType) {
    return new NextResponse(null, { status: 307, headers: { Location: '/images/qris-demo.svg' } });
  }

  const etag = hash ? `"${hash}"` : null;
  if (etag && request.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  try {
    const image = Buffer.from(base64, 'base64');
    return new NextResponse(new Uint8Array(image), {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(image.length),
        'Cache-Control': 'public, max-age=300, must-revalidate',
        ...(etag ? { ETag: etag } : {}),
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Gambar QRIS tidak tersedia.' }, { status: 500 });
  }
}
