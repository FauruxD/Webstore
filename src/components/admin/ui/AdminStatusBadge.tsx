import React from 'react';

export function AdminStatusBadge({ status }: { status: string }) {
  const getBadgeStyle = (st: string) => {
    switch (st.toUpperCase()) {
      case 'PENDING_PAYMENT':
        return 'bg-[#9A6000]/10 text-[#9A6000] border-[#9A6000]/20';
      case 'WAITING_VERIFICATION':
        return 'bg-[#6657E8]/10 text-[#6657E8] border-[#6657E8]/20 font-bold';
      case 'PAYMENT_APPROVED':
      case 'PRODUCT_SENT':
      case 'COMPLETED':
      case 'PUBLISHED':
      case 'ACTIVE':
        return 'bg-[#187A4A]/10 text-[#187A4A] border-[#187A4A]/20';
      case 'PAYMENT_REJECTED':
      case 'EXPIRED':
      case 'DRAFT':
      case 'INACTIVE':
      case 'REVOKED':
        return 'bg-[#B42318]/10 text-[#B42318] border-[#B42318]/20';
      default:
        return 'bg-[#ECE8DE] text-[#111111] border-[#E5E2D9]';
    }
  };

  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border inline-block whitespace-nowrap font-sans ${getBadgeStyle(
        status
      )}`}
    >
      {status}
    </span>
  );
}
