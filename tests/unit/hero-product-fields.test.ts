import { describe, expect, it } from 'vitest';
import {
  HERO_SLOT_COUNT,
  MAX_HERO_ORDER,
  ProductFormSchema,
  ProductPayloadSchema,
} from '@/lib/validation/product';

/** Minimal valid create payload, as the admin route receives it from FormData. */
function payload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Lumina Design System',
    slug: 'lumina-design-system',
    categoryId: 'cat_1',
    license: 'Commercial License',
    description: 'A complete design system with 120 components and usage guides.',
    price: '249000',
    salePrice: '',
    version: '1.0.0',
    downloadPolicy: '7_DAYS_5_DOWNLOADS',
    changelog: '',
    status: 'PUBLISHED',
    isFeatured: 'false',
    heroOrder: '0',
    ...overrides,
  };
}

/** Minimal valid form state, as react-hook-form holds it. */
function formValues(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Lumina Design System',
    slug: 'lumina-design-system',
    categoryId: 'cat_1',
    license: 'Commercial License',
    description: 'A complete design system with 120 components and usage guides.',
    price: '249000',
    salePrice: '',
    version: '1.0.0',
    downloadPolicy: '7_DAYS_5_DOWNLOADS',
    changelog: '',
    isFeatured: false,
    heroOrder: '',
    ...overrides,
  };
}

describe('hero collage product fields', () => {
  describe('ProductPayloadSchema.isFeatured', () => {
    it("reads the FormData string 'false' as false", () => {
      // `z.coerce.boolean()` would read any non-empty string as true, which
      // would silently feature every product the admin creates.
      const parsed = ProductPayloadSchema.parse(payload({ isFeatured: 'false' }));
      expect(parsed.isFeatured).toBe(false);
    });

    it("accepts 'true' and the checkbox default 'on'", () => {
      expect(ProductPayloadSchema.parse(payload({ isFeatured: 'true' })).isFeatured).toBe(true);
      expect(ProductPayloadSchema.parse(payload({ isFeatured: 'on' })).isFeatured).toBe(true);
    });
  });

  describe('ProductPayloadSchema.heroOrder', () => {
    it('treats an untouched field as slot 0 rather than failing', () => {
      expect(ProductPayloadSchema.parse(payload({ heroOrder: '' })).heroOrder).toBe(0);
    });

    it('coerces a numeric string to an integer', () => {
      expect(ProductPayloadSchema.parse(payload({ heroOrder: '2' })).heroOrder).toBe(2);
    });

    it('accepts every slot in the visible range', () => {
      for (let order = 1; order <= HERO_SLOT_COUNT; order += 1) {
        expect(ProductPayloadSchema.parse(payload({ heroOrder: String(order) })).heroOrder).toBe(
          order,
        );
      }
    });

    it('rejects a negative order', () => {
      expect(ProductPayloadSchema.safeParse(payload({ heroOrder: '-1' })).success).toBe(false);
    });

    it('rejects a fractional order', () => {
      expect(ProductPayloadSchema.safeParse(payload({ heroOrder: '1.5' })).success).toBe(false);
    });

    it('rejects an order past the cap', () => {
      const result = ProductPayloadSchema.safeParse(
        payload({ heroOrder: String(MAX_HERO_ORDER + 1) }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects a non-numeric order', () => {
      expect(ProductPayloadSchema.safeParse(payload({ heroOrder: 'first' })).success).toBe(false);
    });
  });

  describe('ProductFormSchema', () => {
    it('accepts an empty hero order, which means "use the next free slot"', () => {
      const result = ProductFormSchema.safeParse(formValues({ heroOrder: '' }));
      expect(result.success).toBe(true);
    });

    it('rejects a non-numeric hero order before the request is sent', () => {
      const result = ProductFormSchema.safeParse(formValues({ heroOrder: 'satu' }));
      expect(result.success).toBe(false);
    });

    it('rejects a hero order past the cap before the request is sent', () => {
      const result = ProductFormSchema.safeParse(
        formValues({ heroOrder: String(MAX_HERO_ORDER + 1) }),
      );
      expect(result.success).toBe(false);
    });

    it('keeps isFeatured a real boolean so the checkbox binds directly', () => {
      const result = ProductFormSchema.safeParse(formValues({ isFeatured: 'true' }));
      expect(result.success).toBe(false);
      expect(ProductFormSchema.safeParse(formValues({ isFeatured: true })).success).toBe(true);
    });
  });
});
