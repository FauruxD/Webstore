import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { formatRupiah } from '@/lib/utils/invoice';
import { AdminPageHeader } from '@/components/admin/ui/AdminHeader';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { SalesLineChart, type SalesChartPoint } from '@/components/admin/dashboard/SalesLineChart';

const REVENUE_STATUSES = new Set(['PAYMENT_APPROVED', 'PRODUCT_SENT', 'COMPLETED']);

function chartDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export default async function AdminDashboardPage() {
  const chartStart = new Date();
  chartStart.setHours(0, 0, 0, 0);
  chartStart.setDate(chartStart.getDate() - 13);

  const [
    totalOrders,
    waitingVerificationCount,
    deliveredCount,
    revenueResult,
    recentOrders,
    priorityQueue,
    chartOrders,
  ] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: 'WAITING_VERIFICATION' } }),
    db.order.count({ where: { status: { in: ['PRODUCT_SENT', 'COMPLETED'] } } }),
    db.order.aggregate({
      where: { status: { in: ['PAYMENT_APPROVED', 'PRODUCT_SENT', 'COMPLETED'] } },
      _sum: { total: true },
    }),
    db.order.findMany({ take: 6, orderBy: { createdAt: 'desc' }, include: { items: true } }),
    db.order.findMany({
      where: { status: 'WAITING_VERIFICATION' },
      orderBy: { updatedAt: 'asc' },
      take: 4,
    }),
    db.order.findMany({
      where: { createdAt: { gte: chartStart } },
      select: { createdAt: true, status: true, total: true },
    }),
  ]);

  const totalRevenue = revenueResult._sum.total || 0;
  const deliveryRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 100;

  const chartMap = new Map<string, SalesChartPoint>();
  for (let offset = 0; offset < 14; offset += 1) {
    const date = new Date(chartStart);
    date.setDate(chartStart.getDate() + offset);
    const key = chartDateKey(date);
    chartMap.set(key, {
      date: key,
      label: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' }).format(date),
      orders: 0,
      revenue: 0,
    });
  }
  for (const order of chartOrders) {
    const point = chartMap.get(chartDateKey(order.createdAt));
    if (!point) continue;
    point.orders += 1;
    if (REVENUE_STATUSES.has(order.status)) point.revenue += order.total;
  }
  const chartData = Array.from(chartMap.values());

  // One row of stats, one shape. Keeps the grid readable when a value grows long.
  const kpis = [
    {
      label: 'Total Pendapatan',
      value: formatRupiah(totalRevenue),
      caption: 'Terverifikasi Sah',
      icon: DollarSign,
      iconClass: 'text-[#6657E8]',
      valueClass: 'text-[#111111]',
      trend: true,
    },
    {
      label: 'Menunggu Verifikasi',
      value: String(waitingVerificationCount),
      caption: 'SLA Target ≤ 2 Jam',
      icon: Clock,
      iconClass: 'text-[#9A6000]',
      valueClass: 'text-[#9A6000]',
      trend: false,
    },
    {
      label: 'Total Order Masuk',
      value: String(totalOrders),
      caption: 'Aktivitas Guest Checkout',
      icon: ShoppingBag,
      iconClass: 'text-[#6657E8]',
      valueClass: 'text-[#111111]',
      trend: false,
    },
    {
      label: 'Successful Delivery',
      value: `${deliveryRate}%`,
      caption: 'Produk Terkirim Tanpa Hambatan',
      icon: CheckCircle2,
      iconClass: 'text-[#187A4A]',
      valueClass: 'text-[#187A4A]',
      trend: false,
    },
  ];

  return (
    <div className="space-y-8 w-full min-w-0 font-sans">
      {/* Dashboard Editorial Header */}
      <AdminPageHeader
        eyebrow="RINGKASAN OPERASIONAL"
        title="Dashboard"
        description="Pantau pendapatan, antrean verifikasi pembayaran, dan performa pengiriman produk digital secara real-time."
      />

      {/* Action Required Banner */}
      {waitingVerificationCount > 0 && (
        <div className="p-5 bg-[#6657E8]/10 border border-[#6657E8]/20 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-[#6657E8]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold block text-sm">
                Ada {waitingVerificationCount} Bukti Pembayaran Menunggu Verifikasi
              </span>
              <span className="font-normal text-xs text-[#6657E8]/80">Segera periksa bukti transfer untuk mengaktifkan akses produk pembeli.</span>
            </div>
          </div>
          <Link
            href="/admin/verifications"
            className="px-4 py-2 bg-[#6657E8] text-white text-xs font-semibold rounded-xl hover:bg-[#5244D2] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Buka Antrean Verifikasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full min-w-0">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="admin-surface min-w-0 p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="admin-eyebrow truncate">{kpi.label}</span>
              <kpi.icon className={`h-4 w-4 shrink-0 ${kpi.iconClass}`} strokeWidth={1.6} />
            </div>
            <div
              className={`mt-4 font-display text-[30px] font-medium leading-none tracking-[-0.03em] tabular-nums truncate ${kpi.valueClass}`}
            >
              {kpi.value}
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] text-[#686660]">
              {kpi.trend && <TrendingUp className="h-3 w-3 shrink-0 text-[#187A4A]" strokeWidth={1.8} />}
              <span className={kpi.trend ? 'font-medium text-[#187A4A]' : ''}>{kpi.caption}</span>
            </div>
          </div>
        ))}
      </div>

      <SalesLineChart data={chartData} />

      {/* Dashboard Detail Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full min-w-0">
        {/* Recent Orders Table (8 Cols) */}
        <div className="admin-surface lg:col-span-8 min-w-0">
          <div className="p-5 border-b border-[#E5E2D9] flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#111111] tracking-tight">Pesanan Terbaru</h3>
            <Link href="/admin/orders" className="text-xs text-[#6657E8] font-semibold hover:underline">
              Lihat Semua
            </Link>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Pembeli</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#686660]">
                      Belum ada pesanan masuk.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="font-mono font-medium whitespace-nowrap text-[#6657E8]">{ord.invoice}</td>
                      <td className="font-medium">{ord.customerName}</td>
                      <td className="font-sans font-semibold tabular-nums whitespace-nowrap">{formatRupiah(ord.total)}</td>
                      <td className="whitespace-nowrap">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#ECE8DE] text-[#111111]">
                          {ord.status}
                        </span>
                      </td>
                      <td className="text-[#686660] whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Verification Queue (4 Cols) */}
        <div className="admin-surface lg:col-span-4 min-w-0 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#111111] tracking-tight">Antrean Paling Lama</h3>
            <span className="text-xs text-[#9A6000] font-bold bg-[#9A6000]/10 px-2 py-0.5 rounded-full">
              {waitingVerificationCount} Pending
            </span>
          </div>

          {priorityQueue.length === 0 ? (
            <div className="text-center py-8 space-y-2 text-[#686660]">
              <CheckCircle2 className="w-8 h-8 text-[#187A4A] mx-auto" />
              <p className="text-xs">Tidak ada antrean pending saat ini.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {priorityQueue.map((item) => (
                <div key={item.id} className="p-3.5 bg-[#F8F6F0] rounded-xl border border-[#E5E2D9] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#111111]">{item.invoice}</span>
                    <span className="text-[10px] text-[#9A6000] font-semibold">Waiting</span>
                  </div>
                  <div className="text-xs text-[#686660]">
                    <span>{item.customerName}</span> • <span className="font-sans font-semibold text-[#111111]">{formatRupiah(item.total)}</span>
                  </div>
                  <Link
                    href={`/admin/verifications?order=${item.id}`}
                    className="block text-center text-xs font-semibold text-white bg-[#6657E8] py-2 rounded-lg hover:bg-[#5244D2] transition-colors"
                  >
                    Verifikasi Sekarang
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
