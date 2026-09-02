import { db } from '@/lib/db';
import { generateInvoiceNumber } from '@/lib/utils/invoice';
import { generateSecureToken, hashToken } from '@/lib/utils/token';
import { validateCoupon } from './coupon';

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  items: Array<{
    productId: string;
  }>;
  couponCode?: string;
  idempotencyKey?: string;
  customerAccessId?: string;
}

export interface LineItemCreateInput {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  license: string;
  productSnapshot: string;
}

export async function createOrder(input: CreateOrderInput) {
  const {
    customerName,
    customerEmail,
    customerWhatsapp,
    items,
    couponCode,
    idempotencyKey,
    customerAccessId,
  } = input;

  if (!items || items.length === 0) {
    throw new Error('Order items cannot be empty');
  }

  // Idempotency check
  if (idempotencyKey) {
    const existingOrder = await db.order.findUnique({
      where: { idempotencyKey },
      include: { items: true },
    });
    if (existingOrder) {
      if (!customerAccessId || existingOrder.customerAccessId !== customerAccessId) {
        throw new Error('Idempotency key has already been used by another customer session');
      }
      return {
        order: existingOrder,
        rawSecureToken: null,
        customerAccessId: existingOrder.customerAccessId,
      };
    }
  }

  // Fetch product data & calculate subtotal
  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: {
      id: { in: productIds },
      status: 'PUBLISHED',
    },
    include: {
      versions: {
        orderBy: { publishedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (products.length !== items.length) {
    throw new Error('One or more selected products are invalid or no longer available');
  }

  let subtotal = 0;
  const lineItemData: LineItemCreateInput[] = [];

  for (const prod of products) {
    const activePrice = prod.salePrice ?? prod.price;
    subtotal += activePrice;

    lineItemData.push({
      productId: prod.id,
      productName: prod.name,
      unitPrice: activePrice,
      quantity: 1,
      license: prod.license,
      productSnapshot: JSON.stringify({
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        price: prod.price,
        salePrice: prod.salePrice,
        license: prod.license,
        version: prod.versions[0]?.version || '1.0.0',
      }),
    });
  }

  // Validate coupon if provided
  let discountAmount = 0;
  let appliedCouponId: string | undefined;

  if (couponCode) {
    const couponRes = await validateCoupon({ code: couponCode, subtotal, customerEmail });
    if (couponRes.valid) {
      discountAmount = couponRes.discountAmount;
      appliedCouponId = couponRes.coupon?.id;
    }
  }

  const total = Math.max(0, subtotal - discountAmount);

  // Generate unique high entropy secret token for tracking
  const rawSecureToken = generateSecureToken(32);
  const secureTokenHash = hashToken(rawSecureToken);

  const invoice = generateInvoiceNumber();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours default

  // Execute database creation inside transaction
  const order = await db.$transaction(async (tx) => {
    const customerAccess = customerAccessId
      ? await tx.customerAccess.update({
          where: { id: customerAccessId },
          data: {
            emailNormalized: customerEmail.trim().toLowerCase(),
            displayName: customerName.trim(),
            whatsapp: customerWhatsapp.trim(),
          },
        })
      : await tx.customerAccess.create({
          data: {
            emailNormalized: customerEmail.trim().toLowerCase(),
            displayName: customerName.trim(),
            whatsapp: customerWhatsapp.trim(),
          },
        });

    const createdOrder = await tx.order.create({
      data: {
        invoice,
        status: 'PENDING_PAYMENT',
        customerName,
        customerEmail,
        customerWhatsapp,
        subtotal,
        discount: discountAmount,
        total,
        couponCode: couponCode ? couponCode.toUpperCase() : null,
        idempotencyKey: idempotencyKey || null,
        secureTokenHash,
        customerAccessId: customerAccess.id,
        expiresAt,
        items: {
          create: lineItemData,
        },
      },
      include: { items: true },
    });

    await tx.conversation.create({
      data: {
        orderId: createdOrder.id,
        customerAccessId: customerAccess.id,
        messages: {
          create: {
            senderType: 'SYSTEM',
            kind: 'SYSTEM',
            body: `Percakapan untuk pesanan ${createdOrder.invoice} telah dibuat. Silakan hubungi penjual jika membutuhkan bantuan.`,
            dedupeKey: `order:${createdOrder.id}:conversation-created`,
          },
        },
      },
    });

    if (appliedCouponId) {
      await tx.couponUsage.create({
        data: {
          couponId: appliedCouponId,
          orderId: createdOrder.id,
          customerEmail,
        },
      });

      await tx.coupon.update({
        where: { id: appliedCouponId },
        data: { currentUsage: { increment: 1 } },
      });
    }

    return createdOrder;
  });

  return {
    order,
    rawSecureToken,
    customerAccessId: order.customerAccessId,
  };
}
