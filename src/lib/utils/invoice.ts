/**
 * Generate human-readable invoice code: INV-YYYYMMDD-XXXX
 * Example: INV-20260801-9A3F
 */
export function generateInvoiceNumber(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomHex = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0').toUpperCase();
  return `INV-${year}${month}${day}-${randomHex}`;
}

/**
 * Format integer minor Rupiah amount to standard IDR string.
 * Example: 150000 -> "Rp 150.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
