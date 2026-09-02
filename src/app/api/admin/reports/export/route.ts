import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/services/audit';
import { buildSalesReportXlsx } from '@/lib/reports/xlsx';
import { getReportOrders, parseReportFilters } from '@/lib/reports/reporting';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const filters = parseReportFilters({
    q: request.nextUrl.searchParams.get('q') || undefined,
    status: request.nextUrl.searchParams.get('status') || undefined,
    from: request.nextUrl.searchParams.get('from') || undefined,
    to: request.nextUrl.searchParams.get('to') || undefined,
  });
  const orders = await getReportOrders(filters, 10_000);
  const workbook = buildSalesReportXlsx(orders, filters);
  const responseBody = Uint8Array.from(workbook).buffer;
  const filename = `laporan-penjualan-${filters.from}-${filters.to}.xlsx`;

  await recordAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: 'REPORT_EXPORTED',
    entity: 'Order',
    details: { filters, rowCount: orders.length, format: 'XLSX' },
  });

  return new NextResponse(responseBody, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
