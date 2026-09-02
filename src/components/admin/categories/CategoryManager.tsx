'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, FolderTree, Plus, Trash2 } from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/dialog';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import {
  DeleteResourceDialog,
  RESOURCE_ERROR_CLASS,
  RESOURCE_INPUT_CLASS,
  RESOURCE_LABEL_CLASS,
  ResourceFormError,
  ResourceSubmitFooter,
} from '@/components/admin/resources/ResourceDialogParts';

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

const EMPTY_FORM: FormState = { name: '', slug: '', description: '', imageUrl: '' };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const slugTouched = useRef(false);
  const [editing, setEditing] = useState<CategoryRow | null | 'new'>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => {
    slugTouched.current = false;
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError(null);
    setEditing('new');
  };

  const openEdit = (category: CategoryRow) => {
    slugTouched.current = true;
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
    });
    setFieldErrors({});
    setFormError(null);
    setEditing(category);
  };

  const closeEditor = () => {
    if (!busy) setEditing(null);
  };

  const submit = async () => {
    if (!editing) return;
    setBusy(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const isNew = editing === 'new';
      const response = await fetch(
        isNew ? '/api/admin/categories' : `/api/admin/categories/${editing.id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
      );
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
      };
      if (!response.ok || !data.success) {
        setFieldErrors(data.fieldErrors || {});
        throw new Error(data.error || 'Gagal menyimpan kategori.');
      }
      setEditing(null);
      router.refresh();
    } catch (cause: unknown) {
      setFormError(cause instanceof Error ? cause.message : 'Gagal menyimpan kategori.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="admin-surface w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2D9] p-4 sm:p-5">
          <div>
            <p className="text-sm font-semibold text-[#111111]">{categories.length} kategori katalog</p>
            <p className="mt-1 text-[11px] text-[#686660]">Kategori dengan produk aktif dilindungi dari penghapusan.</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#6657E8] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#5244D2] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-2">
            <Plus className="h-4 w-4" /> Tambah Kategori
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>Nama Kategori</th><th>Slug</th><th>Deskripsi</th><th>Produk</th><th className="text-right">Aksi</th></tr></thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={5} className="p-4"><AdminEmptyState title="Belum Ada Kategori" description="Buat kategori pertama untuk mengelompokkan produk storefront." icon={FolderTree} /></td></tr>
              ) : categories.map((category) => (
                <tr key={category.id}>
                  <td><span className="admin-cell-title">{category.name}</span></td>
                  <td className="font-mono text-[#686660]">{category.slug}</td>
                  <td className="max-w-[420px] text-[#686660]"><span className="line-clamp-2">{category.description || '-'}</span></td>
                  <td className="whitespace-nowrap font-mono font-semibold text-[#6657E8]">{category.productCount} produk</td>
                  <td className="whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button type="button" onClick={() => openEdit(category)} aria-label={`Edit ${category.name}`} className="rounded-lg border border-[#E5E2D9] bg-white p-2 text-[#686660] transition-colors hover:border-[#6657E8] hover:text-[#6657E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8]"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => setDeleting(category)} disabled={category.productCount > 0} aria-label={`Hapus ${category.name}`} title={category.productCount > 0 ? 'Pindahkan produk sebelum menghapus kategori' : 'Hapus kategori'} className="rounded-lg border border-[#E5E2D9] bg-white p-2 text-[#686660] transition-colors hover:border-[#B42318] hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318] disabled:cursor-not-allowed disabled:opacity-35"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ResponsiveDialog
        open={Boolean(editing)}
        onClose={closeEditor}
        surface="admin"
        size="md"
        dismissible={!busy}
        title={editing === 'new' ? 'Tambah Kategori' : 'Edit Kategori'}
        description="Kategori digunakan untuk struktur katalog dan filter produk di storefront."
        footer={<ResourceSubmitFooter busy={busy} onCancel={closeEditor} onSubmit={submit} submitLabel={editing === 'new' ? 'Buat Kategori' : 'Simpan Perubahan'} />}
      >
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }} noValidate>
          <ResourceFormError message={formError} />
          <div><label htmlFor="category-name" className={RESOURCE_LABEL_CLASS}>Nama kategori</label><input id="category-name" value={form.name} onChange={(event) => { const name = event.target.value; setForm((current) => ({ ...current, name, slug: slugTouched.current ? current.slug : slugify(name) })); }} className={RESOURCE_INPUT_CLASS} disabled={busy} autoFocus />{fieldErrors.name && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.name}</p>}</div>
          <div><label htmlFor="category-slug" className={RESOURCE_LABEL_CLASS}>Slug URL</label><input id="category-slug" value={form.slug} onChange={(event) => { slugTouched.current = true; setForm((current) => ({ ...current, slug: slugify(event.target.value) })); }} className={`${RESOURCE_INPUT_CLASS} font-mono`} disabled={busy} />{fieldErrors.slug && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.slug}</p>}</div>
          <div><label htmlFor="category-description" className={RESOURCE_LABEL_CLASS}>Deskripsi</label><textarea id="category-description" rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={`${RESOURCE_INPUT_CLASS} resize-y leading-5`} disabled={busy} />{fieldErrors.description && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.description}</p>}</div>
          <div><label htmlFor="category-image" className={RESOURCE_LABEL_CLASS}>URL gambar (opsional)</label><input id="category-image" type="url" value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="/images/categories/ui-kits.jpg" className={RESOURCE_INPUT_CLASS} disabled={busy} />{fieldErrors.imageUrl && <p className={RESOURCE_ERROR_CLASS}>{fieldErrors.imageUrl}</p>}</div>
        </form>
      </ResponsiveDialog>

      {deleting && <DeleteResourceDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onDeleted={() => router.refresh()} endpoint={`/api/admin/categories/${deleting.id}`} resourceLabel={deleting.name} description="Kategori akan dihapus dari struktur katalog. Produk tidak ikut terhapus." />}
    </>
  );
}
