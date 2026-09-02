import React from 'react';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { CustomerManager } from '@/components/admin/customers/CustomerManager';

export default async function AdminCustomersPage() {
  const customers = await db.customerAccess.findMany({
    include: {
      orders: { select: { total: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
      account: { select: { id: true } },
      _count: { select: { conversations: true, notifications: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="space-y-6 w-full min-w-0 font-sans">
      <AdminPageHeader
        eyebrow="IDENTITAS PELANGGAN"
        title="Daftar Pelanggan"
        description="Ringkasan akun terdaftar dan identitas pembeli yang dibuat melalui guest checkout."
      />

      <CustomerManager customers={customers.map((customer) => ({
        id: customer.id,
        displayName: customer.displayName,
        emailNormalized: customer.emailNormalized,
        whatsapp: customer.whatsapp,
        orderCount: customer.orders.length,
        totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
        lastOrderAt: customer.orders[0]?.createdAt.toISOString() || null,
        isRegistered: Boolean(customer.account),
        canDelete: !customer.account && customer.orders.length === 0 && customer._count.conversations === 0 && customer._count.notifications === 0,
      }))} />
    </div>
  );
}
