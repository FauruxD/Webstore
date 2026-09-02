import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/lib/services/audit';
import { CouponPayloadSchema, zodFieldErrors } from '@/lib/validation/admin-resources';

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const parsed = CouponPayloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Periksa kembali data kupon.', fieldErrors: zodFieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const coupon = await db.coupon.create({ data: parsed.data });
    await recordAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: 'COUPON_CREATED',
      entity: 'Coupon',
      entityId: coupon.id,
      details: { code: coupon.code, type: coupon.type, value: coupon.value },
    });
    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Kode kupon sudah digunakan.', fieldErrors: { code: 'Kode kupon sudah digunakan' } },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: false, error: 'Gagal membuat kupon.' }, { status: 500 });
  }
}
