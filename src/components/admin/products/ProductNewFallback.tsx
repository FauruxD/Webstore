'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ProductFormDialog,
  type HeroSlotUsage,
  type ProductFormCategory,
} from '@/components/admin/products/ProductFormDialog';

/**
 * Fallback entry point for `/admin/products/new`. Normal admin usage opens the
 * dialog from the products table; this route exists for deep links and renders
 * the very same form, then returns to the table when dismissed.
 */
export function ProductNewFallback({
  categories,
  heroSlots,
}: {
  categories: ProductFormCategory[];
  heroSlots: HeroSlotUsage;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    router.push('/admin/products');
  };

  return (
    <ProductFormDialog
      open={open}
      onClose={handleClose}
      categories={categories}
      heroSlots={heroSlots}
    />
  );
}
