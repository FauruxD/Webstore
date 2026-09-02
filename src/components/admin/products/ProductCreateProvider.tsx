'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { ProductFormDialog, type HeroSlotUsage, type ProductFormCategory } from './ProductFormDialog';

interface ProductCreateContextValue {
  openProductDialog: () => void;
}

const ProductCreateContext = createContext<ProductCreateContextValue | null>(null);

function useProductCreate(): ProductCreateContextValue {
  const context = useContext(ProductCreateContext);
  if (!context) {
    throw new Error('ProductCreateTrigger must be rendered inside ProductCreateProvider');
  }
  return context;
}

/**
 * Owns the single create dialog for the products page. Both entry points (the
 * page header and the empty state) share this one instance, so there is no
 * duplicated modal state.
 */
export function ProductCreateProvider({
  categories,
  heroSlots,
  children,
}: {
  categories: ProductFormCategory[];
  heroSlots: HeroSlotUsage;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ openProductDialog: () => setOpen(true) }), []);

  return (
    <ProductCreateContext.Provider value={value}>
      {children}
      <ProductFormDialog
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        heroSlots={heroSlots}
      />
    </ProductCreateContext.Provider>
  );
}

interface TriggerProps {
  variant?: 'primary' | 'compact';
  label?: string;
}

export function ProductCreateTrigger({
  variant = 'primary',
  label = 'Tambah Produk Baru',
}: TriggerProps) {
  const { openProductDialog } = useProductCreate();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={openProductDialog}
        className="inline-block rounded-lg bg-[#6657E8] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#5244D2] active:bg-[#4839BD]"
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openProductDialog}
      className="flex items-center gap-2 rounded-xl bg-[#6657E8] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5244D2] active:bg-[#4839BD]"
    >
      <Plus className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
