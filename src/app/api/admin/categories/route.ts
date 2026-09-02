import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/lib/services/audit';
import { CategoryPayloadSchema, zodFieldErrors } from '@/lib/validation/admin-resources';

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const parsed = CategoryPayloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Periksa kembali data kategori.', fieldErrors: zodFieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const category = await db.category.create({ data: parsed.data });
    await recordAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: 'CATEGORY_CREATED',
      entity: 'Category',
      entityId: category.id,
      details: { name: category.name, slug: category.slug },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Slug kategori sudah digunakan.', fieldErrors: { slug: 'Slug kategori sudah digunakan' } },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: false, error: 'Gagal membuat kategori.' }, { status: 500 });
  }
}
