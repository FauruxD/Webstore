'use client';

import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatRupiah } from '@/lib/utils/invoice';

export interface SalesChartPoint {
  date: string;
  label: string;
  orders: number;
  revenue: number;
}

interface TooltipEntry {
  dataKey?: string | number;
  value?: number | string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
}

function compactRupiah(value: number): string {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const orders = Number(payload.find((entry) => entry.dataKey === 'orders')?.value || 0);
  const revenue = Number(payload.find((entry) => entry.dataKey === 'revenue')?.value || 0);
  return (
    <div className="min-w-[180px] rounded-xl border border-[#E5E2D9] bg-white p-3 shadow-[0_12px_28px_-18px_rgba(17,17,17,0.45)]">
      <p className="text-[11px] font-semibold text-[#111111]">{label}</p>
      <div className="mt-2 space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between gap-5"><span className="text-[#686660]">Pesanan</span><strong className="font-mono text-[#6657E8]">{orders}</strong></div>
        <div className="flex items-center justify-between gap-5"><span className="text-[#686660]">Omzet sah</span><strong className="font-mono text-[#187A4A]">{formatRupiah(revenue)}</strong></div>
      </div>
    </div>
  );
}

export function SalesLineChart({ data }: { data: SalesChartPoint[] }) {
  return (
    <div className="admin-surface min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2D9] p-5">
        <div>
          <h2 className="text-sm font-semibold text-[#111111]">Tren pesanan dan omzet</h2>
          <p className="mt-1 text-[11px] text-[#686660]">Pergerakan 14 hari terakhir berdasarkan waktu checkout dan pembayaran sah.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[10px] text-[#686660]" aria-label="Legenda grafik">
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded-full bg-[#6657E8]" aria-hidden="true" /> Pesanan</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded-full bg-[#187A4A]" aria-hidden="true" /> Omzet sah</span>
        </div>
      </div>
      <div className="h-[300px] w-full px-2 pb-4 pt-5 sm:h-[340px] sm:px-5" role="img" aria-label="Grafik garis pesanan dan omzet sah selama 14 hari terakhir">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="#E5E2D9" strokeDasharray="3 5" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#686660', fontSize: 10 }} minTickGap={18} />
            <YAxis yAxisId="orders" allowDecimals={false} axisLine={false} tickLine={false} width={32} tick={{ fill: '#686660', fontSize: 10 }} />
            <YAxis yAxisId="revenue" orientation="right" axisLine={false} tickLine={false} width={62} tickFormatter={compactRupiah} tick={{ fill: '#686660', fontSize: 10 }} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#C9C4B7', strokeDasharray: '3 4' }} />
            <Line yAxisId="orders" type="monotone" dataKey="orders" name="Pesanan" stroke="#6657E8" strokeWidth={2.25} dot={false} activeDot={{ r: 4, fill: '#6657E8', stroke: '#FFFFFF', strokeWidth: 2 }} />
            <Line yAxisId="revenue" type="monotone" dataKey="revenue" name="Omzet sah" stroke="#187A4A" strokeWidth={2.25} dot={false} activeDot={{ r: 4, fill: '#187A4A', stroke: '#FFFFFF', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
