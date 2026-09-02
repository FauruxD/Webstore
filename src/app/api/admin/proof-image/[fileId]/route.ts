import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getFileFromStorage } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = await params;
    const fileAsset = await db.fileAsset.findUnique({
      where: { id: fileId },
    });

    if (!fileAsset) {
      return NextResponse.json({ error: 'Proof image asset not found' }, { status: 404 });
    }

    const buffer = await getFileFromStorage(fileAsset.storageKey);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': fileAsset.mimeType,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error serving proof image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
