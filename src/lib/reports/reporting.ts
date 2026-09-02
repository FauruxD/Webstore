import { OrderStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export const REPORT_STATUSES = Object.values(OrderStatus);
export const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PAYMENT_APPROVED,
  OrderStatus.PRODUCT_SENT,
  OrderStatus.COMPLETED,
];

export interface ReportFilters {
  q: string;
  status: OrderStatus | '';
  from: string;
  to: string;
}

export const reportOrderInclude = {
  items: { select: { id: true, productName: true, quantity: true, unitPrice: true } },
  entitlements: { select: { downloadCount: true } },
} satisfies Prisma.OrderInclude;

export type ReportOrder = Prisma.OrderGetPayload<{ include: typeof reportOrderInclude }>;

function validDateInput(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function jakartaDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function parseReportFilters(input: {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
}): ReportFilters {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const status = REPORT_STATUSES.includes(input.status as OrderStatus)
    ? (input.status as OrderStatus)
    : '';

  return {
    q: (input.q || '').trim().slice(0, 120),
    status,
    from: validDateInput(input.from) ? input.from : jakartaDateString(thirtyDaysAgo),
    to: validDateInput(input.to) ? input.to : jakartaDateString(now),
  };
}

export function buildReportWhere(filters: ReportFilters): Prisma.OrderWhereInput {
  const start = new Date(`${filters.from}T00:00:00+07:00`);
  const endExclusive = new Date(`${filters.to}T00:00:00+07:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);

  return {
    createdAt: { gte: start, lt: endExclusive },
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { invoice: { contains: filters.q } },
            { customerName: { contains: filters.q } },
            { customerEmail: { contains: filters.q } },
            { items: { some: { productName: { contains: filters.q } } } },
          ],
        }
      : {}),
  };
}

export async function getReportOrders(filters: ReportFilters, take?: number): Promise<ReportOrder[]> {
  return db.order.findMany({
    where: buildReportWhere(filters),
    include: reportOrderInclude,
    orderBy: { createdAt: 'desc' },
    ...(take ? { take } : {}),
  });
}

export function summarizeReport(orders: ReportOrder[]) {
  return orders.reduce(
    (summary, order) => {
      summary.checkout += 1;
      summary.discount += order.discount;
      if (REVENUE_STATUSES.includes(order.status)) summary.revenue += order.total;
      if (order.status === OrderStatus.PRODUCT_SENT || order.status === OrderStatus.COMPLETED) {
        summary.delivered += 1;
      }
      summary.downloads += order.entitlements.reduce((total, item) => total + item.downloadCount, 0);
      return summary;
    },
    { checkout: 0, revenue: 0, discount: 0, delivered: 0, downloads: 0 },
  );
}

export function reportFilterQuery(filters: ReportFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  params.set('from', filters.from);
  params.set('to', filters.to);
  return params.toString();
}
