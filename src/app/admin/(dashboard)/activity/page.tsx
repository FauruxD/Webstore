import React from 'react';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { Activity } from 'lucide-react';

export default async function AdminActivityLogsPage() {
  const auditLogs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6 w-full min-w-0 font-sans">
      <AdminPageHeader
        eyebrow="REKAM JEJAK SISTEM"
        title="Audit Logs Operasional"
        description="Log append-only yang mencatat seluruh tindakan administratif seperti verifikasi, penolakan, dan perubahan konfigurasi."
      />

      <div className="admin-surface w-full min-w-0">
        <div className="overflow-x-auto w-full">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Waktu & Tanggal</th>
                <th>Admin Actor</th>
                <th>Aksi Audit</th>
                <th>Entitas</th>
                <th>Deskripsi / Metadata</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4">
                    <AdminEmptyState
                      title="Belum Ada Log Audit"
                      description="Setiap tindakan admin akan tercatat secara otomatis di sini."
                      icon={Activity}
                    />
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-[#686660] font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="font-bold text-[#111111]">{log.actorEmail}</td>
                    <td>
                      <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#ECE8DE] text-[#111111]">
                        {log.action}
                      </span>
                    </td>
                    <td className="font-semibold text-[#686660]">{log.entity}</td>
                    <td className="text-[#686660] max-w-md truncate font-mono text-[11px]">
                      {log.detailsJson || `- (ID: ${log.entityId})`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
