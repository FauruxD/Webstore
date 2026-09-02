import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { createOrder } from '@/lib/services/checkout';
import { approvePayment, completeOrder, rejectPayment, sendProductAccess } from '@/lib/services/verification';
import { createChatMessage } from '@/lib/services/messaging';

const runDatabaseTests = process.env.RUN_DB_TESTS === '1';

describe.runIf(runDatabaseTests)('MySQL order lifecycle', () => {
  let admin: { id: string; email: string };
  let productId: string;
  const orderIds: string[] = [];
  const accessIds: string[] = [];

  beforeAll(async () => {
    const adminRow = await db.adminUser.findFirstOrThrow();
    const product = await db.product.findFirstOrThrow({ where: { status: 'PUBLISHED' } });
    admin = { id: adminRow.id, email: adminRow.email };
    productId = product.id;
  });

  async function createWaitingOrder(label: string) {
    const result = await createOrder({
      customerName: `Integration ${label}`,
      customerEmail: `integration-${label}-${Date.now()}@example.test`,
      customerWhatsapp: '081234567890',
      items: [{ productId }],
      idempotencyKey: `integration-${label}-${crypto.randomUUID()}`,
    });
    orderIds.push(result.order.id);
    accessIds.push(result.customerAccessId);
    const file = await db.fileAsset.create({
      data: {
        originalName: `${label}.png`,
        storageKey: `integration/${crypto.randomUUID()}.png`,
        mimeType: 'image/png',
        size: 8,
        isPrivate: true,
      },
    });
    await db.paymentProof.create({
      data: {
        orderId: result.order.id,
        fileId: file.id,
        senderName: 'Integration Buyer',
        amount: result.order.total,
        paidAt: new Date(),
      },
    });
    await db.order.update({
      where: { id: result.order.id },
      data: { status: 'WAITING_VERIFICATION', paymentProofSubmittedAt: new Date() },
    });
    return result.order.id;
  }

  afterAll(async () => {
    if (orderIds.length) await db.order.deleteMany({ where: { id: { in: orderIds } } });
    if (accessIds.length) await db.customerAccess.deleteMany({ where: { id: { in: accessIds } } });
    await db.fileAsset.deleteMany({ where: { storageKey: { startsWith: 'integration/' } } });
  });

  it('approves, sends product, and completes exactly once', async () => {
    const orderId = await createWaitingOrder('complete');
    await approvePayment({ orderId, adminId: admin.id, adminEmail: admin.email });
    expect((await db.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe('PAYMENT_APPROVED');

    await sendProductAccess({
      orderId,
      adminId: admin.id,
      adminEmail: admin.email,
      deliveryNote: 'Gunakan file ini sebagai paket final.',
      deliveryFile: {
        originalName: 'integration-delivery.zip',
        storageKey: `integration/${crypto.randomUUID()}.zip`,
        mimeType: 'application/zip',
        size: 22,
        hash: crypto.randomUUID(),
      },
    });
    expect((await db.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe('PRODUCT_SENT');
    expect(await db.entitlement.count({ where: { orderId } })).toBeGreaterThan(0);
    expect(
      await db.entitlement.count({ where: { orderId, fileAssetId: { not: null } } }),
    ).toBeGreaterThan(0);

    await completeOrder({ orderId, adminId: admin.id, adminEmail: admin.email });
    await completeOrder({ orderId, adminId: admin.id, adminEmail: admin.email });
    const completed = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).not.toBeNull();
    expect(await db.notification.count({ where: { orderId, type: 'ORDER_COMPLETED' } })).toBe(1);
    expect(await db.auditLog.count({ where: { entityId: orderId, action: 'COMPLETE_ORDER' } })).toBe(1);
  });

  it('rejects with a reason and allows a replacement-proof transition', async () => {
    const orderId = await createWaitingOrder('reject');
    await rejectPayment({
      orderId,
      adminId: admin.id,
      adminEmail: admin.email,
      rejectionReason: 'Nominal pada bukti tidak sesuai.',
    });
    const rejected = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(rejected.status).toBe('PAYMENT_REJECTED');
    expect(rejected.rejectionReason).toContain('Nominal');
    expect(await db.notification.count({ where: { orderId, type: 'PAYMENT_REJECTED' } })).toBe(1);

    await db.order.update({ where: { id: orderId }, data: { status: 'WAITING_VERIFICATION' } });
    expect((await db.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe('WAITING_VERIFICATION');
  });

  it('does not expose another customer conversation by access reference', async () => {
    const firstOrderId = await createWaitingOrder('owner-a');
    const secondOrderId = await createWaitingOrder('owner-b');
    const first = await db.order.findUniqueOrThrow({ where: { id: firstOrderId } });
    const secondConversation = await db.conversation.findUniqueOrThrow({
      where: { orderId: secondOrderId },
    });
    const attachedMessage = await db.$transaction((tx) =>
      createChatMessage(tx, {
        conversationId: secondConversation.id,
        senderType: 'CUSTOMER',
        senderId: secondConversation.customerAccessId,
        body: 'Lampiran: integration-note.pdf',
        attachment: {
          originalName: 'integration-note.pdf',
          storageKey: `integration/${crypto.randomUUID()}.pdf`,
          mimeType: 'application/pdf',
          size: 12,
          hash: crypto.randomUUID(),
        },
      }),
    );
    expect(attachedMessage.attachments).toHaveLength(1);

    const leaked = await db.conversation.findFirst({
      where: { orderId: secondOrderId, customerAccessId: first.customerAccessId },
    });
    expect(leaked).toBeNull();
    const leakedAttachment = await db.messageAttachment.findFirst({
      where: {
        id: attachedMessage.attachments[0].id,
        message: { conversation: { customerAccessId: first.customerAccessId } },
      },
    });
    expect(leakedAttachment).toBeNull();
  });
});
