import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/lib/services/audit';
import { CustomerPayloadSchema, zodFieldErrors } from '@/lib/validation/admin-resources';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const parsed = CustomerPayloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Periksa kembali data pelanggan.', fieldErrors: zodFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const existing = await db.customerAccess.findFirst({
    where: { emailNormalized: parsed.data.emailNormalized, NOT: { id } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'Email pelanggan sudah terdaftar.', fieldErrors: { emailNormalized: 'Email sudah terdaftar' } },
      { status: 409 },
    );
  }

  const current = await db.customerAccess.findUnique({
    where: { id },
    include: { account: { select: { id: true } } },
  });
  if (!current) return NextResponse.json({ success: false, error: 'Pelanggan tidak ditemukan.' }, { status: 404 });

  const customer = await db.$transaction(async (tx) => {
    if (current.account) {
      await tx.account.update({
        where: { id: current.account.id },
        data: { emailNormalized: parsed.data.emailNormalized },
      });
    }
    return tx.customerAccess.update({ where: { id }, data: parsed.data });
  });
  await recordAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: 'CUSTOMER_UPDATED',
    entity: 'CustomerAccess',
    entityId: customer.id,
    details: {
      previousEmail: current.emailNormalized,
      email: customer.emailNormalized,
      name: customer.displayName,
      historicalInvoicesPreserved: true,
    },
  });
  return NextResponse.json({ success: true, customer });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const customer = await db.customerAccess.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      emailNormalized: true,
      account: { select: { id: true } },
      _count: { select: { orders: true, conversations: true, notifications: true } },
    },
  });
  if (!customer) return NextResponse.json({ success: false, error: 'Pelanggan tidak ditemukan.' }, { status: 404 });

  if (customer.account) {
    return NextResponse.json(
      { success: false, error: 'Akun pelanggan terdaftar tidak boleh dihapus dari daftar pelanggan.' },
      { status: 409 },
    );
  }

  const relatedCount = customer._count.orders + customer._count.conversations + customer._count.notifications;
  if (relatedCount > 0) {
    return NextResponse.json(
      { success: false, error: 'Pelanggan memiliki riwayat transaksi atau pesan dan tidak boleh dihapus.' },
      { status: 409 },
    );
  }

  await db.customerAccess.delete({ where: { id } });
  await recordAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: 'CUSTOMER_DELETED',
    entity: 'CustomerAccess',
    entityId: id,
    details: { email: customer.emailNormalized, name: customer.displayName },
  });
  return NextResponse.json({ success: true });
}
