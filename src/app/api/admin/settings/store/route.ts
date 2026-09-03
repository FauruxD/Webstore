import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';

const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2, 'Nama webstore minimal 2 karakter.').max(80),
  notificationEmail: z.string().trim().email('Email notifikasi tidak valid.').max(191),
  supportWhatsapp: z
    .string()
    .trim()
    .max(24)
    .refine(
      (value) => value === '' || /^\+?[0-9][0-9\s-]{7,22}$/.test(value),
      'Nomor WhatsApp tidak valid.',
    ),
});

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parsed = storeSettingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Periksa kembali data pengaturan toko.',
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { storeName, notificationEmail, supportWhatsapp } = parsed.data;
    await db.$transaction([
      db.storeSetting.upsert({
        where: { key: 'store_name' },
        update: { value: storeName },
        create: { key: 'store_name', value: storeName },
      }),
      db.storeSetting.upsert({
        where: { key: 'notification_email' },
        update: { value: notificationEmail },
        create: { key: 'notification_email', value: notificationEmail },
      }),
      db.storeSetting.upsert({
        where: { key: 'support_whatsapp' },
        update: { value: supportWhatsapp },
        create: { key: 'support_whatsapp', value: supportWhatsapp },
      }),
      db.auditLog.create({
        data: {
          actorId: session.id,
          actorEmail: session.email,
          action: 'STORE_SETTINGS_UPDATED',
          entity: 'StoreSetting',
          entityId: 'store_profile',
          detailsJson: JSON.stringify({ storeName, notificationEmail, supportWhatsapp }),
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Pengaturan toko berhasil disimpan.' });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan pengaturan toko.' },
      { status: 500 },
    );
  }
}
