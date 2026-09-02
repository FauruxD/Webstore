import type { OrderStatus } from '@prisma/client';

export type CustomerOrderFilter = 'all' | 'action' | 'process' | 'sent' | 'completed';
export type CustomerOrderTone = 'neutral' | 'warning' | 'danger' | 'info' | 'success';

export interface CustomerOrderStatusMeta {
  label: string;
  description: string;
  progress: number;
  tone: CustomerOrderTone;
}

export const CUSTOMER_ORDER_FILTERS: Array<{ value: CustomerOrderFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'action', label: 'Perlu Tindakan' },
  { value: 'process', label: 'Diproses' },
  { value: 'sent', label: 'Produk Dikirim' },
  { value: 'completed', label: 'Selesai' },
];

const STATUS_META: Record<OrderStatus, CustomerOrderStatusMeta> = {
  PENDING_PAYMENT: {
    label: 'Menunggu pembayaran',
    description: 'Selesaikan pembayaran sebelum batas waktu pesanan.',
    progress: 1,
    tone: 'warning',
  },
  WAITING_VERIFICATION: {
    label: 'Menunggu verifikasi',
    description: 'Bukti pembayaran sedang diperiksa oleh admin.',
    progress: 2,
    tone: 'info',
  },
  PAYMENT_REJECTED: {
    label: 'Pembayaran ditolak',
    description: 'Unggah bukti pembayaran pengganti untuk melanjutkan.',
    progress: 2,
    tone: 'danger',
  },
  PAYMENT_APPROVED: {
    label: 'Pembayaran disetujui',
    description: 'Pembayaran telah disetujui dan produk sedang disiapkan.',
    progress: 3,
    tone: 'success',
  },
  PRODUCT_SENT: {
    label: 'Produk dikirim',
    description: 'Akses unduhan produk sudah tersedia.',
    progress: 4,
    tone: 'success',
  },
  COMPLETED: {
    label: 'Pesanan selesai',
    description: 'Pesanan dan akses produk telah diselesaikan.',
    progress: 5,
    tone: 'success',
  },
  EXPIRED: {
    label: 'Pesanan kedaluwarsa',
    description: 'Batas waktu pembayaran pesanan telah berakhir.',
    progress: 1,
    tone: 'neutral',
  },
  CANCELLED: {
    label: 'Pesanan dibatalkan',
    description: 'Pesanan ini sudah dibatalkan.',
    progress: 1,
    tone: 'neutral',
  },
  REFUNDED: {
    label: 'Dana dikembalikan',
    description: 'Pengembalian dana untuk pesanan telah diproses.',
    progress: 3,
    tone: 'neutral',
  },
};

export function parseCustomerOrderFilter(value: string | string[] | undefined): CustomerOrderFilter {
  const candidate = Array.isArray(value) ? value[0] : value;
  return CUSTOMER_ORDER_FILTERS.some((filter) => filter.value === candidate)
    ? (candidate as CustomerOrderFilter)
    : 'all';
}

export function matchesCustomerOrderFilter(status: OrderStatus, filter: CustomerOrderFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'action') return status === 'PENDING_PAYMENT' || status === 'PAYMENT_REJECTED';
  if (filter === 'process') return status === 'WAITING_VERIFICATION' || status === 'PAYMENT_APPROVED';
  if (filter === 'sent') return status === 'PRODUCT_SENT';
  return status === 'COMPLETED';
}

export function getCustomerOrderStatusMeta(status: OrderStatus): CustomerOrderStatusMeta {
  return STATUS_META[status];
}

export function getCustomerOrderPrimaryAction(
  status: OrderStatus,
  invoice: string,
  hasDownload: boolean,
): { href: string; label: string } {
  if (status === 'PENDING_PAYMENT') {
    return { href: `/payment/${invoice}`, label: 'Bayar Sekarang' };
  }
  if (status === 'PAYMENT_REJECTED') {
    return { href: `/payment/${invoice}`, label: 'Upload Bukti Baru' };
  }
  if (hasDownload && (status === 'PRODUCT_SENT' || status === 'COMPLETED')) {
    return { href: `/order/${invoice}#downloads`, label: 'Unduh Produk' };
  }
  return { href: `/order/${invoice}`, label: 'Buka Pesanan' };
}
