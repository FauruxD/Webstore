import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { sendProductAccess } from '@/lib/services/verification';
import { normalizeDeliveryNote, validateUpload } from '@/lib/files/upload-validation';
import { deleteFileFromStorage, saveFileToStorage } from '@/lib/storage';
import { db } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let savedStorageKey: string | null = null;
  try {
    const { id } = await params;
    const existingOrder = await db.order.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existingOrder) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (existingOrder.status === 'PRODUCT_SENT' || existingOrder.status === 'COMPLETED') {
      return NextResponse.json({ success: true, message: 'Akses produk sudah pernah dikirim' });
    }
    const formData = await req.formData();
    const fileEntry = formData.get('deliveryFile');
    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: 'Pilih file produk yang akan dikirim' }, { status: 400 });
    }
    const validated = await validateUpload(fileEntry, 'ORDER_DELIVERY');
    const deliveryNote = normalizeDeliveryNote(formData.get('deliveryNote'));
    const saved = await saveFileToStorage({
      buffer: validated.buffer,
      originalName: validated.originalName,
      mimeType: validated.mimeType,
    });
    savedStorageKey = saved.storageKey;

    const result = await sendProductAccess({
      orderId: id,
      adminId: session.id,
      adminEmail: session.email,
      deliveryNote,
      deliveryFile: {
        originalName: validated.originalName,
        storageKey: saved.storageKey,
        mimeType: validated.mimeType,
        size: saved.size,
        hash: saved.hash,
      },
    });
    if (!result.fileConsumed) {
      await deleteFileFromStorage(saved.storageKey);
      savedStorageKey = null;
    }
    return NextResponse.json(result);
  } catch (error) {
    if (savedStorageKey) await deleteFileFromStorage(savedStorageKey);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal mengirim produk' }, { status: 400 });
  }
}
