import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/lib/services/audit';
import { CouponPayloadSchema, zodFieldErrors } from '@/lib/validation/admin-resources';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const parsed = CouponPayloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Periksa kembali data kupon.', fieldErrors: zodFieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const current = await db.coupon.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ success: false, error: 'Kupon tidak ditemukan.' }, { status: 404 });
    if (parsed.data.maxUsage < current.currentUsage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batas penggunaan tidak boleh lebih kecil dari penggunaan saat ini.',
          fieldErrors: { maxUsage: `Minimal ${current.currentUsage}` },
        },
        { status: 400 },
      );
    }

    const coupon = await db.coupon.update({ where: { id }, data: parsed.data });
    await recordAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: 'COUPON_UPDATED',
      entity: 'Coupon',
      entityId: coupon.id,
      details: { code: coupon.code, type: coupon.type, value: coupon.value, isActive: coupon.isActive },
    });
    return NextResponse.json({ success: true, coupon });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Kode kupon sudah digunakan.', fieldErrors: { code: 'Kode kupon sudah digunakan' } },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: false, error: 'Gagal memperbarui kupon.' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const coupon = await db.coupon.findUnique({
    where: { id },
    select: { id: true, code: true, currentUsage: true, _count: { select: { usages: true } } },
  });
  if (!coupon) return NextResponse.json({ success: false, error: 'Kupon tidak ditemukan.' }, { status: 404 });
  if (coupon.currentUsage > 0 || coupon._count.usages > 0) {
    return NextResponse.json(
      { success: false, error: 'Kupon yang sudah digunakan tidak boleh dihapus. Nonaktifkan kupon melalui menu edit.' },
      { status: 409 },
    );
  }

  await db.coupon.delete({ where: { id } });
  await recordAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: 'COUPON_DELETED',
    entity: 'Coupon',
    entityId: id,
    details: { code: coupon.code },
  });
  return NextResponse.json({ success: true });
}
