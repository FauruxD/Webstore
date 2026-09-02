import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/lib/services/audit';
import { CategoryPayloadSchema, zodFieldErrors } from '@/lib/validation/admin-resources';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const parsed = CategoryPayloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Periksa kembali data kategori.', fieldErrors: zodFieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const category = await db.category.update({ where: { id }, data: parsed.data });
    await recordAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: 'CATEGORY_UPDATED',
      entity: 'Category',
      entityId: category.id,
      details: { name: category.name, slug: category.slug },
    });
    return NextResponse.json({ success: true, category });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Slug kategori sudah digunakan.', fieldErrors: { slug: 'Slug kategori sudah digunakan' } },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: false, error: 'Gagal memperbarui kategori.' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const category = await db.category.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
  });
  if (!category) return NextResponse.json({ success: false, error: 'Kategori tidak ditemukan.' }, { status: 404 });
  if (category._count.products > 0) {
    return NextResponse.json(
      { success: false, error: 'Kategori masih digunakan produk. Pindahkan produknya sebelum menghapus kategori.' },
      { status: 409 },
    );
  }

  await db.category.delete({ where: { id } });
  await recordAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: 'CATEGORY_DELETED',
    entity: 'Category',
    entityId: id,
    details: { name: category.name, slug: category.slug },
  });
  return NextResponse.json({ success: true });
}
