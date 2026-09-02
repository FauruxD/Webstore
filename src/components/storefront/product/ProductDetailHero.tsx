'use client';

import React, { useMemo, useRef, useState } from 'react';
import { CheckoutDialog, type CheckoutLineItem } from '@/components/commerce/checkout/CheckoutDialog';
import { ProductGallery, type ProductGalleryItem } from './ProductGallery';
import { ProductPurchasePanel, type ProductSpecRow } from './ProductPurchasePanel';

export interface ProductDetailHeroProps {
  productId: string;
  name: string;
  categoryName: string;
  summary: string;
  price: number;
  salePrice?: number | null;
  license: string;
  media: ProductGalleryItem[];
  specs: ProductSpecRow[];
  qrisUrl: string;
  merchantName: string;
}

/**
 * Client shell for the hero. It owns the gallery selection and the checkout
 * dialog so the surrounding page stays a server component and keeps reading
 * every figure straight from the database.
 */
export function ProductDetailHero({
  productId,
  name,
  categoryName,
  summary,
  price,
  salePrice,
  license,
  media,
  specs,
  qrisUrl,
  merchantName,
}: ProductDetailHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const videoIndex = media.findIndex((item) => item.type === 'VIDEO');

  const checkoutItems = useMemo<CheckoutLineItem[]>(
    () => [{ id: productId, name, license, price, salePrice }],
    [productId, name, license, price, salePrice],
  );

  const handlePreview = () => {
    if (videoIndex < 0) return;
    setActiveIndex(videoIndex);
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      {/*
        One stagger container for both columns, so the gallery and the purchase
        panel arrive as a single coordinated move rather than two unrelated
        reveals. Above the fold, so it plays on load.
      */}
      <div
        data-reveal-stagger="panel"
        className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-14"
      >
        <div ref={galleryRef} data-reveal-item className="lg:col-span-7">
          <ProductGallery
            items={media}
            productName={name}
            categoryName={categoryName}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          />
        </div>

        <div data-reveal-item className="lg:col-span-5 lg:sticky lg:top-28">
          <ProductPurchasePanel
            categoryName={categoryName}
            name={name}
            summary={summary}
            price={price}
            salePrice={salePrice}
            license={license}
            specs={specs}
            onPreview={videoIndex >= 0 ? handlePreview : undefined}
            buyPhase={checkoutOpen ? 'open' : 'idle'}
            onBuy={() => setCheckoutOpen(true)}
          />
        </div>
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={checkoutItems}
        qrisUrl={qrisUrl}
        merchantName={merchantName}
      />
    </>
  );
}
