import { MessageKind, NotificationType, OrderStatus as PrismaOrderStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { generateSecureToken, hashToken } from '@/lib/utils/token';
import { assertValidStatusTransition, OrderStatus } from './order-state';
import { createSystemEvent } from './messaging';
import { normalizeDeliveryNote } from '@/lib/files/upload-validation';

interface AdminActionOptions {
  orderId: string;
  adminId: string;
  adminEmail: string;
}

export interface SendProductAccessOptions extends AdminActionOptions {
  deliveryFile: {
    originalName: string;
    storageKey: string;
    mimeType: string;
    size: number;
    hash: string;
  };
  deliveryNote?: string | null;
}

async function lockOrder(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM \`Order\` WHERE id = ${orderId} FOR UPDATE`;
}

export interface ApprovePaymentOptions extends AdminActionOptions {}

export interface RejectPaymentOptions extends AdminActionOptions {
  rejectionReason: string;
  internalNote?: string;
}

function cleanReason(reason: string): string {
  const value = reason.trim().replace(/[\u0000-\u001F\u007F]/g, ' ');
  if (value.length < 3) throw new Error('Alasan wajib diisi minimal 3 karakter');
  if (value.length > 1000) throw new Error('Alasan maksimal 1000 karakter');
  return value;
}

export async function approvePayment(options: ApprovePaymentOptions) {
  return db.$transaction(async (tx) => {
    await lockOrder(tx, options.orderId);
    const order = await tx.order.findUnique({
      where: { id: options.orderId },
      include: { proofs: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!order) throw new Error('Order not found');

    if (['PAYMENT_APPROVED', 'PRODUCT_SENT', 'COMPLETED'].includes(order.status)) {
      return { success: true, message: 'Pembayaran sudah disetujui', order };
    }
    if (!order.proofs[0]) throw new Error('Bukti pembayaran aktif tidak ditemukan');
    assertValidStatusTransition(order.status as OrderStatus, 'PAYMENT_APPROVED');

    const now = new Date();
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: PrismaOrderStatus.PAYMENT_APPROVED,
        paymentApprovedAt: now,
        paymentRejectedAt: null,
      },
    });
    await tx.paymentProof.update({
      where: { id: order.proofs[0].id },
      data: { status: 'APPROVED', reviewedAt: now },
    });

    await createSystemEvent(tx, {
      orderId: order.id,
      customerAccessId: order.customerAccessId,
      notificationType: NotificationType.PAYMENT_APPROVED,
      title: 'Pembayaran disetujui',
      body: `Pembayaran untuk pesanan ${order.invoice} telah disetujui.`,
      actionUrl: `/order/${order.invoice}`,
      actionLabel: 'Buka Pesanan',
      dedupeKey: `order:${order.id}:proof:${order.proofs[0].id}:approved`,
    });

    await tx.auditLog.create({
      data: {
        actorId: options.adminId,
        actorEmail: options.adminEmail,
        action: 'APPROVE_PAYMENT',
        entity: 'Order',
        entityId: order.id,
        detailsJson: JSON.stringify({ invoice: order.invoice, total: order.total }),
      },
    });

    return { success: true, order: updatedOrder };
  });
}

async function rejectOrRequestProof(
  options: RejectPaymentOptions,
  notificationType: NotificationType,
) {
  const reason = cleanReason(options.rejectionReason);

  return db.$transaction(async (tx) => {
    await lockOrder(tx, options.orderId);
    const order = await tx.order.findUnique({
      where: { id: options.orderId },
      include: { proofs: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!order) throw new Error('Order not found');

    const proof = order.proofs[0];
    if (order.status === 'PAYMENT_REJECTED' && !proof) {
      return { success: true, message: 'Permintaan bukti pengganti sudah dikirim' };
    }
    if (!proof) throw new Error('Bukti pembayaran aktif tidak ditemukan');
    assertValidStatusTransition(order.status as OrderStatus, 'PAYMENT_REJECTED');

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: PrismaOrderStatus.PAYMENT_REJECTED,
        paymentRejectedAt: new Date(),
        rejectionReason: reason,
        internalNote: options.internalNote?.trim() || order.internalNote,
      },
    });
    await tx.paymentProof.update({
      where: { id: proof.id },
      data: { status: 'REJECTED', rejectionReason: reason, reviewedAt: new Date() },
    });

    const isRequest = notificationType === NotificationType.PAYMENT_PROOF_REQUIRED;
    await createSystemEvent(tx, {
      orderId: order.id,
      customerAccessId: order.customerAccessId,
      notificationType,
      title: isRequest ? 'Bukti pembayaran baru diperlukan' : 'Pembayaran ditolak',
      body: isRequest
        ? `Admin meminta bukti pembayaran baru: ${reason}`
        : `Bukti pembayaran ditolak: ${reason}`,
      actionUrl: `/payment/${order.invoice}`,
      actionLabel: 'Upload Bukti Baru',
      dedupeKey: `order:${order.id}:proof:${proof.id}:${isRequest ? 'required' : 'rejected'}`,
    });

    await tx.auditLog.create({
      data: {
        actorId: options.adminId,
        actorEmail: options.adminEmail,
        action: isRequest ? 'REQUEST_PAYMENT_PROOF' : 'REJECT_PAYMENT',
        entity: 'Order',
        entityId: order.id,
        detailsJson: JSON.stringify({ invoice: order.invoice, reason }),
      },
    });

    return { success: true };
  });
}

export function rejectPayment(options: RejectPaymentOptions) {
  return rejectOrRequestProof(options, NotificationType.PAYMENT_REJECTED);
}

export function requestReplacementProof(options: RejectPaymentOptions) {
  return rejectOrRequestProof(options, NotificationType.PAYMENT_PROOF_REQUIRED);
}

export async function sendProductAccess(options: SendProductAccessOptions) {
  const deliveryNote = normalizeDeliveryNote(options.deliveryNote);
  return db.$transaction(async (tx) => {
    await lockOrder(tx, options.orderId);
    const order = await tx.order.findUnique({
      where: { id: options.orderId },
      include: { items: true, entitlements: true },
    });
    if (!order) throw new Error('Order not found');
    if (['PRODUCT_SENT', 'COMPLETED'].includes(order.status)) {
      return { success: true, message: 'Akses produk sudah pernah dikirim', order, fileConsumed: false };
    }
    assertValidStatusTransition(order.status as OrderStatus, 'PRODUCT_SENT');

    const deliveryAsset = await tx.fileAsset.create({
      data: {
        ...options.deliveryFile,
        isPrivate: true,
      },
    });

    for (const item of order.items) {
      const existingEntitlement = order.entitlements.find(
        (entitlement) => entitlement.orderItemId === item.id,
      );
      if (existingEntitlement) {
        await tx.entitlement.update({
          where: { id: existingEntitlement.id },
          data: { fileAssetId: deliveryAsset.id },
        });
        continue;
      }
      const rawToken = generateSecureToken(32);
      await tx.entitlement.create({
        data: {
          orderId: order.id,
          orderItemId: item.id,
          fileAssetId: deliveryAsset.id,
          tokenHash: hashToken(rawToken),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          maxDownloads: 5,
        },
      });
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: PrismaOrderStatus.PRODUCT_SENT,
        productSentAt: new Date(),
        deliveryNote,
      },
    });

    const deliveryBody = [
      `Produk untuk pesanan ${order.invoice} sudah tersedia untuk diunduh secara aman.`,
      deliveryNote ? `Catatan penjual: ${deliveryNote}` : null,
    ].filter(Boolean).join('\n');

    await createSystemEvent(tx, {
      orderId: order.id,
      customerAccessId: order.customerAccessId,
      notificationType: NotificationType.PRODUCT_SENT,
      title: 'Akses produk telah dikirim',
      body: deliveryBody,
      actionUrl: `/order/${order.invoice}#downloads`,
      actionLabel: 'Unduh Produk',
      messageKind: MessageKind.DOWNLOAD,
      dedupeKey: `order:${order.id}:product-sent`,
    });

    await tx.auditLog.create({
      data: {
        actorId: options.adminId,
        actorEmail: options.adminEmail,
        action: 'SEND_PRODUCT_ACCESS',
        entity: 'Order',
        entityId: order.id,
        detailsJson: JSON.stringify({
          invoice: order.invoice,
          itemCount: order.items.length,
          fileName: deliveryAsset.originalName,
          fileSize: deliveryAsset.size,
          deliveryNote,
        }),
      },
    });

    return { success: true, order: updatedOrder, fileConsumed: true };
  });
}

export async function completeOrder(options: AdminActionOptions) {
  return db.$transaction(async (tx) => {
    await lockOrder(tx, options.orderId);
    const order = await tx.order.findUnique({ where: { id: options.orderId } });
    if (!order) throw new Error('Order not found');
    if (order.status === 'COMPLETED') {
      return { success: true, message: 'Pesanan sudah selesai', order };
    }
    assertValidStatusTransition(order.status as OrderStatus, 'COMPLETED');

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: PrismaOrderStatus.COMPLETED, completedAt: new Date() },
    });
    await createSystemEvent(tx, {
      orderId: order.id,
      customerAccessId: order.customerAccessId,
      notificationType: NotificationType.ORDER_COMPLETED,
      title: 'Pesanan selesai',
      body: `Pesanan ${order.invoice} telah ditandai selesai. Akses unduhan tetap mengikuti masa berlaku yang tercantum.`,
      actionUrl: `/order/${order.invoice}`,
      actionLabel: 'Lihat Pesanan',
      dedupeKey: `order:${order.id}:completed`,
    });
    await tx.auditLog.create({
      data: {
        actorId: options.adminId,
        actorEmail: options.adminEmail,
        action: 'COMPLETE_ORDER',
        entity: 'Order',
        entityId: order.id,
        detailsJson: JSON.stringify({ invoice: order.invoice }),
      },
    });
    return { success: true, order: updatedOrder };
  });
}
