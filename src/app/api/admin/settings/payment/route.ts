import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { InvalidQrisImageError, MAX_QRIS_IMAGE_BYTES, validateQrisImage } from '@/lib/qris-image';
import { recordAuditLog } from '@/lib/services/audit';

const MAX_REQUEST_BYTES = MAX_QRIS_IMAGE_BYTES + 256 * 1024;

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ success: false, error: 'Ukuran gambar QRIS maksimal 2 MB.' }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Pilih gambar QRIS terlebih dahulu.' }, { status: 400 });
    }

    const validated = validateQrisImage(
      Buffer.from(await file.arrayBuffer()),
      file.type,
      file.name,
    );
    const version = Date.now().toString();

    await db.$transaction([
      db.storeSetting.upsert({
        where: { key: 'qris_image_url' },
        update: { value: '/api/qris-image' },
        create: { key: 'qris_image_url', value: '/api/qris-image' },
      }),
      db.storeSetting.upsert({
        where: { key: 'qris_image_data' },
        update: { value: validated.base64 },
        create: { key: 'qris_image_data', value: validated.base64 },
      }),
      db.storeSetting.upsert({
        where: { key: 'qris_image_mime' },
        update: { value: validated.mimeType },
        create: { key: 'qris_image_mime', value: validated.mimeType },
      }),
      db.storeSetting.upsert({
        where: { key: 'qris_image_filename' },
        update: { value: validated.originalName },
        create: { key: 'qris_image_filename', value: validated.originalName },
      }),
      db.storeSetting.upsert({
        where: { key: 'qris_image_hash' },
        update: { value: validated.hash },
        create: { key: 'qris_image_hash', value: validated.hash },
      }),
      db.storeSetting.upsert({
        where: { key: 'qris_image_version' },
        update: { value: version },
        create: { key: 'qris_image_version', value: version },
      }),
    ]);

    await recordAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: 'QRIS_IMAGE_UPDATED',
      entity: 'StoreSetting',
      entityId: 'qris_image_url',
      details: {
        fileName: validated.originalName,
        mimeType: validated.mimeType,
        size: validated.size,
        hash: validated.hash,
      },
    });

    return NextResponse.json({
      success: true,
      imageUrl: `/api/qris-image?v=${version}`,
      fileName: validated.originalName,
      message: 'Gambar QRIS berhasil disimpan.',
    });
  } catch (cause: unknown) {
    if (cause instanceof InvalidQrisImageError) {
      return NextResponse.json({ success: false, error: cause.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Gagal menyimpan gambar QRIS.' }, { status: 500 });
  }
}
