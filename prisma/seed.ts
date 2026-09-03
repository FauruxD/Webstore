import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const prisma = new PrismaClient();

const EMPTY_ZIP = Buffer.from('UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==', 'base64');

async function ensureSeedArchive(storageKey: string) {
  const storageRoot = path.resolve(process.env.LOCAL_STORAGE_PATH || './storage/private');
  await mkdir(storageRoot, { recursive: true });
  const target = path.join(storageRoot, storageKey);
  try {
    await access(target);
  } catch {
    await writeFile(target, EMPTY_ZIP);
  }
}

async function main() {
  console.log('🌱 Seeding Webstore database...');
  await Promise.all([
    ensureSeedArchive('seed-lumina-dashboard.zip'),
    ensureSeedArchive('seed-saas-starter.zip'),
    ensureSeedArchive('seed-3d-icons.zip'),
  ]);

  // 1. Shared admin account + operational admin profile
  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@webstore.local').trim().toLowerCase();
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminSecret123!';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { name: 'FaRu Admin', status: 'ACTIVE' },
    create: {
      name: 'FaRu Admin',
      email: adminEmail,
      status: 'ACTIVE',
    },
  });
  await prisma.account.upsert({
    where: { emailNormalized: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: 'SUPERADMIN',
      adminUserId: admin.id,
      customerAccessId: null,
    },
    create: {
      emailNormalized: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'SUPERADMIN',
      adminUserId: admin.id,
    },
  });
  console.log('👤 Admin created:', admin.email);

  const customerEmail = (process.env.DEFAULT_CUSTOMER_EMAIL || 'buyer@webstore.local').trim().toLowerCase();
  const customerPassword = process.env.DEFAULT_CUSTOMER_PASSWORD || 'BuyerSecret123!';
  const customerPasswordHash = await bcrypt.hash(customerPassword, 12);
  const existingCustomerAccount = await prisma.account.findUnique({
    where: { emailNormalized: customerEmail },
    include: { customerAccess: true },
  });
  if (existingCustomerAccount && existingCustomerAccount.role !== 'CUSTOMER') {
    throw new Error(`DEFAULT_CUSTOMER_EMAIL ${customerEmail} sudah digunakan akun admin.`);
  }
  const customerAccess = existingCustomerAccount?.customerAccess
    || await prisma.customerAccess.findFirst({
      where: { emailNormalized: customerEmail, account: null },
      orderBy: { createdAt: 'asc' },
    })
    || await prisma.customerAccess.create({
      data: {
        emailNormalized: customerEmail,
        displayName: 'Pelanggan Digital Atelier',
        whatsapp: '08123456789',
      },
    });
  const customerAccount = await prisma.account.upsert({
    where: { emailNormalized: customerEmail },
    update: {
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      customerAccessId: customerAccess.id,
      adminUserId: null,
    },
    create: {
      emailNormalized: customerEmail,
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      customerAccessId: customerAccess.id,
    },
  });
  console.log('Customer account created:', customerAccount.emailNormalized);

  // 2. Categories
  const catTemplates = await prisma.category.upsert({
    where: { slug: 'ui-templates' },
    update: {},
    create: {
      name: 'UI Templates & Kits',
      slug: 'ui-templates',
      description: 'Premium Figma & Web design kits for modern digital products.',
    },
  });

  const catAssets = await prisma.category.upsert({
    where: { slug: '3d-assets-presets' },
    update: {},
    create: {
      name: '3D Assets & Presets',
      slug: '3d-assets-presets',
      description: 'High-res 3D icons, mockups, and Lightroom color presets.',
    },
  });

  const catSource = await prisma.category.upsert({
    where: { slug: 'source-code' },
    update: {},
    create: {
      name: 'Source Code & Boilerplates',
      slug: 'source-code',
      description: 'Production-ready Next.js, React, and SaaS starter codebases.',
    },
  });

  // 3. File Assets & Products
  const file1 = await prisma.fileAsset.upsert({
    where: { storageKey: 'seed-lumina-dashboard.zip' },
    update: { size: EMPTY_ZIP.length },
    create: {
      originalName: 'lumina-dashboard-v1.2.zip',
      storageKey: 'seed-lumina-dashboard.zip',
      mimeType: 'application/zip',
      size: EMPTY_ZIP.length,
    },
  });

  const prod1 = await prisma.product.upsert({
    where: { slug: 'lumina-ui-kit' },
    update: {
      // Reseed refreshes the hero collage configuration in place.
      isFeatured: true,
      heroOrder: 1,
    },
    create: {
      name: 'Lumina Design System & UI Kit',
      slug: 'lumina-ui-kit',
      status: 'PUBLISHED',
      description: 'Comprehensive editorial UI kit featuring 200+ components, dark/light modes, and dark glassmorphism variants.',
      price: 249000,
      salePrice: 199000,
      license: 'Personal License',
      isFeatured: true,
      heroOrder: 1,
      categoryId: catTemplates.id,
      media: {
        create: [
          {
            url: '/images/products/ui-kit-dashboard.svg',
            altText: 'Lumina UI Kit dashboard preview',
            position: 0,
          },
          {
            url: '/images/products/mobile-app-frame.svg',
            altText: 'Lumina UI Kit mobile screen preview',
            position: 1,
          },
        ],
      },
      versions: {
        create: [
          {
            version: '1.2.0',
            fileId: file1.id,
            changelog: 'Added 40+ new components and auto-layout v5 updates.',
          },
        ],
      },
    },
  });

  const file2 = await prisma.fileAsset.upsert({
    where: { storageKey: 'seed-saas-starter.zip' },
    update: { size: EMPTY_ZIP.length },
    create: {
      originalName: 'saas-starter-pro.zip',
      storageKey: 'seed-saas-starter.zip',
      mimeType: 'application/zip',
      size: EMPTY_ZIP.length,
    },
  });

  const prod2 = await prisma.product.upsert({
    where: { slug: 'nextjs-saas-boilerplate' },
    update: {
      isFeatured: true,
      heroOrder: 2,
    },
    create: {
      name: 'Next.js 15 SaaS Production Boilerplate',
      slug: 'nextjs-saas-boilerplate',
      status: 'PUBLISHED',
      description: 'Complete SaaS starter with Auth.js, Prisma, Tailwind CSS, Stripe/QRIS adapter, and automated tests.',
      price: 499000,
      salePrice: 399000,
      license: 'Commercial Single Site',
      isFeatured: true,
      heroOrder: 2,
      categoryId: catSource.id,
      media: {
        create: [
          {
            url: '/images/products/saas-code-editor.svg',
            altText: 'Next.js SaaS boilerplate source code preview',
            position: 0,
          },
        ],
      },
      versions: {
        create: [
          {
            version: '2.0.1',
            fileId: file2.id,
            changelog: 'Upgraded to React 19 and Next.js 15 App Router.',
          },
        ],
      },
    },
  });

  const file3 = await prisma.fileAsset.upsert({
    where: { storageKey: 'seed-3d-icons.zip' },
    update: { size: EMPTY_ZIP.length },
    create: {
      originalName: 'cyber-3d-icons.zip',
      storageKey: 'seed-3d-icons.zip',
      mimeType: 'application/zip',
      size: EMPTY_ZIP.length,
    },
  });

  const prod3 = await prisma.product.upsert({
    where: { slug: '3d-cyberpunk-icon-pack' },
    update: {
      isFeatured: true,
      heroOrder: 3,
    },
    create: {
      name: '3D Cyberpunk Tech Icon Pack',
      slug: '3d-cyberpunk-icon-pack',
      status: 'PUBLISHED',
      description: '50 high-resolution 4K 3D icons rendered with Blender Cycles. Transparent PNG + Blend source files included.',
      price: 149000,
      salePrice: 99000,
      license: 'Commercial Unlimited',
      isFeatured: true,
      heroOrder: 3,
      categoryId: catAssets.id,
      media: {
        create: [
          {
            url: '/images/products/3d-asset-cube.svg',
            altText: '3D icon pack preview',
            position: 0,
          },
        ],
      },
      versions: {
        create: [
          {
            version: '1.0.0',
            fileId: file3.id,
            changelog: 'Initial release of 50 icons.',
          },
        ],
      },
    },
  });

  // 3b. Hero collage previews
  // `upsert.update` above never touches nested media, so a database seeded
  // before these local assets existed would keep its old remote URLs. Repoint
  // the primary media row explicitly to keep reseeding idempotent.
  async function setPrimaryMedia(productId: string, url: string, altText: string) {
    const existing = await prisma.productMedia.findFirst({
      where: { productId, position: 0 },
      orderBy: { createdAt: 'asc' },
    });
    if (existing) {
      await prisma.productMedia.update({
        where: { id: existing.id },
        data: { url, altText, type: 'IMAGE' },
      });
      return;
    }
    await prisma.productMedia.create({
      data: { productId, url, altText, type: 'IMAGE', position: 0 },
    });
  }

  await setPrimaryMedia(
    prod1.id,
    '/images/products/ui-kit-dashboard.svg',
    'Lumina UI Kit dashboard preview',
  );
  await setPrimaryMedia(
    prod2.id,
    '/images/products/saas-code-editor.svg',
    'Next.js SaaS boilerplate source code preview',
  );
  await setPrimaryMedia(
    prod3.id,
    '/images/products/3d-asset-cube.svg',
    '3D icon pack preview',
  );

  // 4. Coupons
  await prisma.coupon.upsert({
    where: { code: 'DISKON10' },
    update: {},
    create: {
      code: 'DISKON10',
      type: 'PERCENTAGE',
      value: 10,
      minPurchase: 100000,
      maxUsage: 50,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'EXPIRED20' },
    update: {},
    create: {
      code: 'EXPIRED20',
      type: 'PERCENTAGE',
      value: 20,
      startsAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      isActive: false,
    },
  });

  // 5. Store Settings
  const settings = [
    { key: 'store_name', value: 'Digital Atelier' },
    { key: 'merchant_name', value: 'FA RUX DIGITAL STORE' },
    { key: 'operating_hours', value: '08:00 - 22:00 WIB' },
    { key: 'verification_sla', value: 'Maksimal 2 Jam pada Jam Operasional' },
    // Must match the asset that actually ships in `public/images`.
    { key: 'qris_image_url', value: '/images/qris-demo.svg' },
    { key: 'order_expiry_hours', value: '24' },
  ];

  for (const s of settings) {
    await prisma.storeSetting.upsert({
      where: { key: s.key },
      // Deployment seeds must not replace settings already selected by an admin.
      update: {},
      create: s,
    });
  }

  // 6. Homepage Hero Content
  // Mirrors HERO_FALLBACK in src/lib/queries/hero.ts. Keyed on the eyebrow so
  // reseeding refreshes the row instead of stacking duplicates.
  const heroEyebrow = 'Curated Digital Goods · For Creators & Builders';
  const heroData = {
    eyebrow: heroEyebrow,
    headlineLead: 'Aset Digital',
    headlineItalic: 'untuk Karya yang Lebih Baik',
    subtitle: 'Dirancang untuk Membantu Ide Tumbuh.',
    description:
      'Temukan UI kit, template, source code, dan aset kreatif yang dikurasi untuk mempercepat workflow pembuatan produk digital tanpa mengorbankan kualitas.',
    primaryCtaLabel: 'Jelajahi Koleksi',
    primaryCtaUrl: '/products',
    secondaryCtaLabel: 'Lacak Pesanan',
    secondaryCtaUrl: '/track-order',
    imageUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
    imageAlt: 'Curated UI Kit Asset Showcase',
    collectionLabel: 'Collection',
    collectionValue: '50+ Premium Assets',
    formatLabel: 'Format',
    formatValue: 'Figma · Next.js · React',
    licenseLabel: 'License',
    licenseValue: 'Personal & Commercial',
    isActive: true,
  };

  const existingHero = await prisma.heroContent.findFirst({
    where: { eyebrow: heroEyebrow },
  });

  if (existingHero) {
    await prisma.heroContent.update({ where: { id: existingHero.id }, data: heroData });
  } else {
    await prisma.heroContent.create({ data: heroData });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
