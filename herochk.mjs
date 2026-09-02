import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const featured = await db.product.findMany({
  where: { status: 'PUBLISHED', isFeatured: true },
  orderBy: [{ heroOrder: 'asc' }],
  select: {
    slug: true,
    heroOrder: true,
    category: { select: { name: true } },
    media: {
      where: { type: 'IMAGE' },
      orderBy: { position: 'asc' },
      take: 1,
      select: { url: true, altText: true },
    },
  },
});
console.log(JSON.stringify(featured, null, 1));
const counts = {
  products: await db.product.count(),
  published: await db.product.count({ where: { status: 'PUBLISHED' } }),
  orders: await db.order.count(),
};
console.log(counts);
await db.$disconnect();
