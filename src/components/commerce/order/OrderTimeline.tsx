import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface OrderTimelineProps {
  status: string;
  createdAt?: Date | string | null;
  proofSubmittedAt?: Date | string | null;
  approvedAt?: Date | string | null;
  rejectedAt?: Date | string | null;
  productSentAt?: Date | string | null;
  completedAt?: Date | string | null;
  rejectionReason?: string | null;
}

function formatTimestamp(value?: Date | string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function OrderTimeline(props: OrderTimelineProps) {
  const steps = [
    { key: 'PENDING_PAYMENT', label: 'Pesanan Dibuat', time: props.createdAt },
    { key: 'WAITING_VERIFICATION', label: 'Bukti Pembayaran Dikirim', time: props.proofSubmittedAt },
    {
      key: 'PAYMENT_APPROVED',
      label: props.status === 'PAYMENT_REJECTED' ? 'Pembayaran Ditolak' : 'Pembayaran Disetujui',
      time: props.status === 'PAYMENT_REJECTED' ? props.rejectedAt : props.approvedAt,
    },
    { key: 'PRODUCT_SENT', label: 'Produk Dikirim', time: props.productSentAt },
    { key: 'COMPLETED', label: 'Pesanan Selesai', time: props.completedAt },
  ];
  const flow = ['PENDING_PAYMENT', 'WAITING_VERIFICATION', 'PAYMENT_APPROVED', 'PRODUCT_SENT', 'COMPLETED'];
  const effectiveStatus = props.status === 'PAYMENT_REJECTED' ? 'PAYMENT_APPROVED' : props.status;
  const currentIndex = flow.indexOf(effectiveStatus);

  return (
    <div className="rounded-2xl border border-[#DAD6CD] bg-white p-6">
      <h3 className="mb-6 text-base font-semibold text-[#111111]">Timeline Pesanan</h3>
      <div className="grid gap-5 sm:grid-cols-5 sm:gap-2">
        {steps.map((step, index) => {
          const rejected = props.status === 'PAYMENT_REJECTED' && step.key === 'PAYMENT_APPROVED';
          const completed = !rejected && currentIndex >= index && currentIndex >= 0;
          const current = !rejected && currentIndex === index;
          return (
            <div key={step.key} className="relative flex gap-3 sm:flex-col sm:items-center sm:text-center">
              <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${rejected ? 'border-[#B42318] bg-[#B42318] text-white' : completed ? 'border-[#187A4A] bg-[#187A4A] text-white' : current ? 'border-[#6657E8] bg-[#6657E8] text-white' : 'border-[#DAD6CD] bg-[#F4F1EA] text-[#686660]'}`}>
                {rejected ? <XCircle className="h-4 w-4" /> : completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              <div>
                <p className="text-[11px] font-semibold leading-4 text-[#111111]">{step.label}</p>
                {formatTimestamp(step.time) && <p className="mt-1 text-[9px] leading-4 text-[#686660]">{formatTimestamp(step.time)}</p>}
                {rejected && props.rejectionReason && <p className="mt-1 text-[9px] leading-4 text-[#B42318]">{props.rejectionReason}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

