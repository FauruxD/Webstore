import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { hashToken } from '@/lib/utils/token';
import { getFileFromStorage } from '@/lib/storage';

const entitlementArgs = Prisma.validator<Prisma.EntitlementDefaultArgs>()({
  include: {
    order: true,
    fileAsset: true,
    orderItem: {
      include: {
        product: {
          include: {
            versions: {
              orderBy: { publishedAt: 'desc' },
              take: 1,
              include: { fileAsset: true },
            },
          },
        },
      },
    },
  },
});

type EntitlementWithAsset = Prisma.EntitlementGetPayload<typeof entitlementArgs>;

interface DownloadContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyDownloadOptions extends DownloadContext {
  rawToken: string;
}

export interface VerifyEntitlementOptions extends DownloadContext {
  entitlementId: string;
}

async function consumeEntitlement(
  entitlement: EntitlementWithAsset | null,
  { ipAddress = '127.0.0.1', userAgent = 'Unknown' }: DownloadContext,
) {
  const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex').slice(0, 16);
  if (!entitlement) return { error: 'Access token invalid or expired', code: 404 } as const;

  if (!['PRODUCT_SENT', 'COMPLETED'].includes(entitlement.order.status)) {
    await db.downloadEvent.create({
      data: { entitlementId: entitlement.id, ipHash, userAgent, result: 'INVALID_STATUS' },
    });
    return { error: 'Produk belum dikirim', code: 403 } as const;
  }
  if (entitlement.revokedAt) {
    await db.downloadEvent.create({
      data: { entitlementId: entitlement.id, ipHash, userAgent, result: 'REVOKED' },
    });
    return { error: 'Akses file telah dicabut admin', code: 403 } as const;
  }
  if (new Date() > entitlement.expiresAt) {
    await db.downloadEvent.create({
      data: { entitlementId: entitlement.id, ipHash, userAgent, result: 'EXPIRED' },
    });
    return { error: 'Masa berlaku akses unduhan telah habis', code: 410 } as const;
  }
  if (entitlement.downloadCount >= entitlement.maxDownloads) {
    await db.downloadEvent.create({
      data: { entitlementId: entitlement.id, ipHash, userAgent, result: 'LIMIT_REACHED' },
    });
    return { error: 'Batas maksimum unduhan telah tercapai', code: 429 } as const;
  }

  const latestVersion = entitlement.orderItem.product.versions[0];
  const fileAsset = entitlement.fileAsset ?? latestVersion?.fileAsset;
  if (!fileAsset) return { error: 'File produk tidak ditemukan', code: 404 } as const;
  const buffer = await getFileFromStorage(fileAsset.storageKey);

  const consumed = await db.$transaction(async (tx) => {
    const updated = await tx.entitlement.updateMany({
      where: {
        id: entitlement.id,
        revokedAt: null,
        downloadCount: { lt: entitlement.maxDownloads },
        expiresAt: { gt: new Date() },
      },
      data: { downloadCount: { increment: 1 } },
    });
    if (updated.count !== 1) return false;
    await tx.downloadEvent.create({
      data: { entitlementId: entitlement.id, ipHash, userAgent, result: 'ALLOWED' },
    });
    return true;
  });
  if (!consumed) return { error: 'Akses unduhan sudah tidak tersedia', code: 409 } as const;

  return {
    buffer,
    filename: fileAsset.originalName,
    mimeType: fileAsset.mimeType,
    size: buffer.length,
  };
}

export async function verifyAndFetchDownload(options: VerifyDownloadOptions) {
  const entitlement = await db.entitlement.findUnique({
    where: { tokenHash: hashToken(options.rawToken) },
    ...entitlementArgs,
  });
  return consumeEntitlement(entitlement, options);
}

export async function verifyAndFetchEntitlement(options: VerifyEntitlementOptions) {
  const entitlement = await db.entitlement.findUnique({
    where: { id: options.entitlementId },
    ...entitlementArgs,
  });
  return consumeEntitlement(entitlement, options);
}
