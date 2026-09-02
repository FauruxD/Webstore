import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/lib/services/audit';
import { CustomerPayloadSchema, zodFieldErrors } from '@/lib/validation/admin-resources';

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const parsed = CustomerPayloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Periksa kembali data pelanggan.', fieldErrors: zodFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const existing = await db.customerAccess.findFirst({
    where: { emailNormalized: parsed.data.emailNormalized },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'Email pelanggan sudah terdaftar.', fieldErrors: { emailNormalized: 'Email sudah terdaftar' } },
      { status: 409 },
    );
  }

  const customer = await db.customerAccess.create({ data: parsed.data });
  await recordAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: 'CUSTOMER_CREATED',
    entity: 'CustomerAccess',
    entityId: customer.id,
    details: { email: customer.emailNormalized, name: customer.displayName },
  });
  return NextResponse.json({ success: true, customer }, { status: 201 });
}
