import React from 'react';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { FileArchive, Shield } from 'lucide-react';

export default async function AdminFilesPage() {
  const files = await db.fileAsset.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 w-full min-w-0 font-sans">
      <AdminPageHeader
        eyebrow="PENYIMPANAN PRIVATE"
        title="Berkas File Digital"
        description="Repositori aset file terlindungi yang disimpan secara terenkripsi dan diunduh via token."
      />

      <div className="admin-surface w-full min-w-0">
        <div className="overflow-x-auto w-full">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama File Original</th>
                <th>Storage Key (Encrypted)</th>
                <th>Format MIME</th>
                <th>Ukuran Berkas</th>
                <th>Tipe Akses</th>
              </tr>
            </thead>
            <tbody>
              {files.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4">
                    <AdminEmptyState
                      title="Belum Ada Berkas File Digital"
                      description="File digital versi produk akan muncul di sini setelah diunggah."
                      icon={FileArchive}
                    />
                  </td>
                </tr>
              ) : (
                files.map((file: (typeof files)[number]) => (
                  <tr key={file.id}>
                    <td className="font-display font-semibold text-base text-[#111111] tracking-tight">
                      {file.originalName}
                    </td>
                    <td className="font-mono text-[11px] text-[#686660] truncate max-w-[200px]">
                      {file.storageKey}
                    </td>
                    <td className="font-mono text-[#686660]">{file.mimeType}</td>
                    <td className="font-mono text-[#111111]">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#187A4A]/10 text-[#187A4A]">
                        <Shield className="w-3 h-3" />
                        <span>Private Storage</span>
                      </span>
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
