import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { PrismaClient } from '@prisma/client';

const sqlitePath = process.argv[2] || 'prisma/dev.db';
if (!existsSync(sqlitePath)) {
  throw new Error(`SQLite source not found: ${sqlitePath}`);
}
if (!process.env.DATABASE_URL?.startsWith('mysql://')) {
  throw new Error('DATABASE_URL must point to the target MySQL database.');
}

const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const prisma = new PrismaClient();

const tables = new Set(
  sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name),
);
const rows = (table) => tables.has(table) ? sqlite.prepare(`SELECT * FROM "${table}"`).all() : [];
const date = (value) => value == null ? null : new Date(Number(value));
const bool = (value) => Boolean(value);
const clean = (record) => Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
const createMany = async (model, data) => {
  if (data.length === 0) return;
  await prisma[model].createMany({ data: data.map(clean), skipDuplicates: true });
  console.log(`${model}: ${data.length} row(s) considered`);
};
const accessIdFor = (email) => `legacy-${createHash('sha256').update(email).digest('hex').slice(0, 32)}`;
const statusMap = {
  PAYMENT_VERIFIED: 'PAYMENT_APPROVED',
  PRODUCT_DELIVERED: 'PRODUCT_SENT',
};

async function main() {
  const targetRows = await prisma.order.count();
  if (targetRows > 0 && !process.argv.includes('--merge')) {
    throw new Error('Target MySQL already contains orders. Re-run with --merge only if duplicate skipping is intended.');
  }

  const oldOrders = rows('Order');
  const oldProofs = rows('PaymentProof');
  const latestProofByOrder = new Map();
  for (const proof of oldProofs) {
    const previous = latestProofByOrder.get(proof.orderId);
    if (!previous || Number(previous.createdAt) < Number(proof.createdAt)) latestProofByOrder.set(proof.orderId, proof);
  }

  const accesses = new Map();
  for (const order of oldOrders) {
    const email = String(order.customerEmail).trim().toLowerCase();
    if (!accesses.has(email)) {
      accesses.set(email, {
        id: accessIdFor(email),
        emailNormalized: email,
        displayName: order.customerName,
        whatsapp: order.customerWhatsapp,
        createdAt: date(order.createdAt),
        updatedAt: date(order.updatedAt),
      });
    }
  }

  await createMany('category', rows('Category').map((r) => ({ ...r, createdAt: date(r.createdAt), updatedAt: date(r.updatedAt) })));
  await createMany('fileAsset', rows('FileAsset').map((r) => ({ ...r, isPrivate: bool(r.isPrivate), createdAt: date(r.createdAt) })));
  await createMany('product', rows('Product').map((r) => ({ ...r, isFeatured: bool(r.isFeatured), heroOrder: r.heroOrder ?? 0, createdAt: date(r.createdAt), updatedAt: date(r.updatedAt) })));
  await createMany('productMedia', rows('ProductMedia').map((r) => ({ ...r, createdAt: date(r.createdAt) })));
  await createMany('productVersion', rows('ProductVersion').map((r) => ({ ...r, publishedAt: date(r.publishedAt), createdAt: date(r.createdAt) })));
  await createMany('adminUser', rows('AdminUser').map((r) => ({ ...r, twoFactorEnabled: bool(r.twoFactorEnabled), createdAt: date(r.createdAt), updatedAt: date(r.updatedAt) })));
  await createMany('customerAccess', Array.from(accesses.values()));

  await createMany('order', oldOrders.map((r) => {
    const status = statusMap[r.status] || r.status;
    const latestProof = latestProofByOrder.get(r.id);
    return {
      ...r,
      status,
      customerAccessId: accessIdFor(String(r.customerEmail).trim().toLowerCase()),
      expiresAt: date(r.expiresAt),
      paymentProofSubmittedAt: latestProof ? date(latestProof.createdAt) : null,
      paymentApprovedAt: ['PAYMENT_APPROVED', 'PRODUCT_SENT', 'COMPLETED'].includes(status) ? date(r.updatedAt) : null,
      paymentRejectedAt: status === 'PAYMENT_REJECTED' ? date(r.updatedAt) : null,
      productSentAt: ['PRODUCT_SENT', 'COMPLETED'].includes(status) ? date(r.updatedAt) : null,
      completedAt: status === 'COMPLETED' ? date(r.updatedAt) : null,
      createdAt: date(r.createdAt),
      updatedAt: date(r.updatedAt),
    };
  }));
  await createMany('orderItem', rows('OrderItem').map((r) => ({ ...r, createdAt: date(r.createdAt) })));
  await createMany('paymentProof', oldProofs.map((r) => ({ ...r, paidAt: date(r.paidAt), createdAt: date(r.createdAt) })));
  await createMany('entitlement', rows('Entitlement').map((r) => ({ ...r, expiresAt: date(r.expiresAt), revokedAt: date(r.revokedAt), createdAt: date(r.createdAt), updatedAt: date(r.updatedAt) })));
  await createMany('downloadEvent', rows('DownloadEvent').map((r) => ({ ...r, timestamp: date(r.timestamp) })));
  await createMany('coupon', rows('Coupon').map((r) => ({ ...r, isActive: bool(r.isActive), startsAt: date(r.startsAt), endsAt: date(r.endsAt), createdAt: date(r.createdAt), updatedAt: date(r.updatedAt) })));
  await createMany('couponUsage', rows('CouponUsage').map((r) => ({ ...r, createdAt: date(r.createdAt) })));
  await createMany('auditLog', rows('AuditLog').map((r) => ({ ...r, createdAt: date(r.createdAt) })));
  await createMany('outboundNotification', rows('Notification').map((r) => ({ ...r, sentAt: date(r.sentAt), createdAt: date(r.createdAt) })));
  await createMany('storeSetting', rows('StoreSetting').map((r) => ({ ...r, updatedAt: date(r.updatedAt) })));
  await createMany('heroContent', rows('HeroContent').map((r) => ({ ...r, isActive: bool(r.isActive), createdAt: date(r.createdAt), updatedAt: date(r.updatedAt) })));

  const conversations = oldOrders.map((order) => ({
    id: `legacy-conversation-${order.id}`,
    orderId: order.id,
    customerAccessId: accessIdFor(String(order.customerEmail).trim().toLowerCase()),
    createdAt: date(order.createdAt),
    updatedAt: date(order.updatedAt),
  }));
  await createMany('conversation', conversations);
  await createMany('message', oldOrders.map((order) => ({
    id: `legacy-message-${order.id}`,
    conversationId: `legacy-conversation-${order.id}`,
    senderType: 'SYSTEM',
    kind: 'SYSTEM',
    body: `Percakapan untuk pesanan ${order.invoice} telah dibuat dari data SQLite lama.`,
    dedupeKey: `order:${order.id}:conversation-created`,
    createdAt: date(order.createdAt),
  })));

  console.log('SQLite import completed. Source file was read-only and has not been modified.');
}

main()
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  });

