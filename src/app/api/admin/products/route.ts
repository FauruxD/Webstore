import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getAdminSession } from '@/lib/auth';
import { createProduct, type ProductAssetInput } from '@/lib/services/product';
import { recordAuditLog } from '@/lib/services/audit';
import {
  DIGITAL_FILE_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_PRODUCT_FILE_BYTES,
  ProductPayloadSchema,
} from '@/lib/validation/product';

/** Maps a Zod issue list to `{ field: message }` for inline form errors. */
function fieldErrors(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

async function readAsset(file: File): Promise<ProductAssetInput> {
  const arrayBuffer = await file.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
  };
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Sesi admin tidak valid. Silakan login ulang.' },
      { status: 401 },
    );
  }

  try {
    const formData = await req.formData();

    const parsed = ProductPayloadSchema.safeParse({
      name: formData.get('name'),
      slug: formData.get('slug'),
      categoryId: formData.get('categoryId'),
      license: formData.get('license'),
      description: formData.get('description'),
      price: formData.get('price'),
      salePrice: formData.get('salePrice'),
      version: formData.get('version'),
      downloadPolicy: formData.get('downloadPolicy'),
      changelog: formData.get('changelog') ?? '',
      status: formData.get('status'),
      isFeatured: formData.get('isFeatured') ?? 'false',
      heroOrder: formData.get('heroOrder') ?? '0',
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Periksa kembali isian form.',
          fieldErrors: fieldErrors(parsed.error),
        },
        { status: 400 },
      );
    }

    const digitalFile = formData.get('digitalFile');
    const thumbnail = formData.get('thumbnail');

    if (!(digitalFile instanceof File) || digitalFile.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'File produk digital wajib diunggah.',
          fieldErrors: { digitalFile: 'File produk digital wajib diunggah' },
        },
        { status: 400 },
      );
    }

    if (digitalFile.size > MAX_PRODUCT_FILE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: 'File produk terlalu besar.',
          fieldErrors: { digitalFile: 'Ukuran file produk maksimal 200 MB' },
        },
        { status: 400 },
      );
    }

    if (digitalFile.type && !DIGITAL_FILE_MIME_TYPES.includes(digitalFile.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format file produk tidak didukung.',
          fieldErrors: { digitalFile: 'Gunakan ZIP, RAR, 7z, atau PDF' },
        },
        { status: 400 },
      );
    }

    let thumbnailAsset: ProductAssetInput | null = null;
    if (thumbnail instanceof File && thumbnail.size > 0) {
      if (!IMAGE_MIME_TYPES.includes(thumbnail.type)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Format thumbnail tidak didukung.',
            fieldErrors: { thumbnail: 'Gunakan JPG, PNG, WebP, atau AVIF' },
          },
          { status: 400 },
        );
      }
      if (thumbnail.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: 'Thumbnail terlalu besar.',
            fieldErrors: { thumbnail: 'Ukuran thumbnail maksimal 5 MB' },
          },
          { status: 400 },
        );
      }
      thumbnailAsset = await readAsset(thumbnail);
    }

    const product = await createProduct({
      ...parsed.data,
      thumbnail: thumbnailAsset,
      digitalFile: await readAsset(digitalFile),
    });

    await recordAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product.id,
      details: {
        name: product.name,
        slug: product.slug,
        status: product.status,
        isFeatured: product.isFeatured,
        heroOrder: product.heroOrder,
      },
    });

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        status: product.status,
        isFeatured: product.isFeatured,
        heroOrder: product.heroOrder,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan produk';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
