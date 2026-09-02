import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getFileFromStorage } from '@/lib/storage';

/**
 * Serves product preview images. Private assets (the paid deliverables) are
 * never reachable here; those stay behind the entitlement download route.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storageKey: string }> },
) {
  const { storageKey } = await params;

  const asset = await db.fileAsset.findUnique({ where: { storageKey } });
  if (!asset || asset.isPrivate) {
    return NextResponse.json({ error: 'Media tidak ditemukan' }, { status: 404 });
  }

  try {
    const buffer = await getFileFromStorage(asset.storageKey);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': asset.mimeType,
        'Content-Length': String(asset.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Media tidak ditemukan' }, { status: 404 });
  }
}
