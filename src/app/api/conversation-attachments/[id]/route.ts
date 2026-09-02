import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getCustomerSession } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import { getFileFromStorage } from '@/lib/storage';
import { isPreviewableImageMime } from '@/lib/files/upload-validation';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [adminSession, customerSession] = await Promise.all([
    getAdminSession(),
    getCustomerSession(),
  ]);
  if (!adminSession && !customerSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const attachment = await db.messageAttachment.findFirst({
    where: {
      id,
      ...(adminSession
        ? {}
        : { message: { conversation: { customerAccessId: customerSession!.id } } }),
    },
    include: { fileAsset: true },
  });
  if (!attachment) return NextResponse.json({ error: 'Lampiran tidak ditemukan' }, { status: 404 });

  try {
    const buffer = await getFileFromStorage(attachment.fileAsset.storageKey);
    const forceDownload = req.nextUrl.searchParams.get('download') === '1';
    const canPreview = isPreviewableImageMime(attachment.fileAsset.mimeType) && !forceDownload;
    const encodedName = encodeURIComponent(attachment.fileAsset.originalName);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': canPreview ? attachment.fileAsset.mimeType : 'application/octet-stream',
        'Content-Disposition': `${canPreview ? 'inline' : 'attachment'}; filename*=UTF-8''${encodedName}`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch {
    return NextResponse.json({ error: 'File lampiran tidak tersedia' }, { status: 404 });
  }
}
