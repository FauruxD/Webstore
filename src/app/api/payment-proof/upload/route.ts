import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { saveFileToStorage } from '@/lib/storage';
import { assertValidStatusTransition, OrderStatus } from '@/lib/services/order-state';
import crypto from 'crypto';
import { getCustomerSession } from '@/lib/customer-auth';
import { ensureConversation } from '@/lib/services/messaging';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Akses pelanggan tidak valid' }, { status: 401 });
    }

    const formData = await req.formData();
    const invoice = formData.get('invoice') as string;
    const senderName = formData.get('senderName') as string;
    const amountStr = formData.get('amount') as string;
    const paidAtStr = formData.get('paidAt') as string;
    const note = formData.get('note') as string | null;
    const file = formData.get('proofFile') as File | null;

    if (!invoice || !senderName || !amountStr || !file) {
      return NextResponse.json(
        { success: false, error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    const order = await db.order.findFirst({
      where: { invoice, customerAccessId: session.id },
      include: { proofs: { where: { status: 'ACTIVE' } } },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    assertValidStatusTransition(order.status as OrderStatus, 'WAITING_VERIFICATION');

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Format file harus JPG, PNG, atau WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file bukti maksimal 5 MB' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const validSignature =
      (file.type === 'image/jpeg' && buffer[0] === 0xff && buffer[1] === 0xd8) ||
      (file.type === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
      (file.type === 'image/webp' && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP');
    if (!validSignature) {
      return NextResponse.json({ success: false, error: 'Isi file tidak sesuai format gambar' }, { status: 400 });
    }

    const parsedAmount = Number.parseInt(amountStr, 10);
    if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Nominal pembayaran tidak valid' }, { status: 400 });
    }
    const cleanSenderName = senderName.trim();
    if (cleanSenderName.length < 2 || cleanSenderName.length > 120) {
      return NextResponse.json({ success: false, error: 'Nama pengirim tidak valid' }, { status: 400 });
    }
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    const saved = await saveFileToStorage({
      buffer,
      originalName: file.name,
      mimeType: file.type,
    });

    await db.$transaction(async (tx) => {
      const fileAsset = await tx.fileAsset.create({
        data: {
          originalName: file.name.slice(0, 255),
          storageKey: saved.storageKey,
          mimeType: file.type,
          size: saved.size,
          hash: fileHash,
          isPrivate: true,
        },
      });

      await tx.paymentProof.updateMany({
        where: { orderId: order.id, status: 'ACTIVE' },
        data: { status: 'SUPERSEDED' },
      });
      const proof = await tx.paymentProof.create({
        data: {
          orderId: order.id,
          fileId: fileAsset.id,
          senderName: cleanSenderName,
          amount: parsedAmount,
          paidAt: paidAtStr ? new Date(paidAtStr) : new Date(),
          note: note?.trim().slice(0, 1000) || null,
          fileHash,
          status: 'ACTIVE',
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'WAITING_VERIFICATION',
          paymentProofSubmittedAt: new Date(),
        },
      });
      const conversation = await ensureConversation(tx, {
        orderId: order.id,
        customerAccessId: order.customerAccessId,
      });
      await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'SYSTEM',
          kind: 'SYSTEM',
          body: `Bukti pembayaran untuk pesanan ${order.invoice} telah dikirim dan menunggu verifikasi admin.`,
          dedupeKey: `order:${order.id}:proof:${proof.id}:submitted`,
        },
      });
      await tx.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
    });

    return NextResponse.json({
      success: true,
      message: 'Bukti pembayaran berhasil diunggah. Admin akan segera memverifikasi.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengunggah bukti pembayaran';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
