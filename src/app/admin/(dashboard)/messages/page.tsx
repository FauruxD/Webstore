import { Suspense } from 'react';
import { MessageCenter } from '@/components/messaging/MessageCenter';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';

export default function AdminMessagesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader eyebrow="KOMUNIKASI" title="Pusat Pesan" description="Kelola percakapan privat yang terhubung langsung dengan setiap pesanan pelanggan." />
      <Suspense fallback={<div className="admin-surface h-[680px] animate-pulse" />}>
        <MessageCenter mode="admin" />
      </Suspense>
    </div>
  );
}

