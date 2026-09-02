'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = 'Salin' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F1EA] hover:bg-[#E8E4FF] text-[11px] font-semibold text-[#111111] hover:text-[#6657E8] transition-colors border border-[#DAD6CD]"
      title={label}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[#187A4A]" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? 'Tersalin!' : label}</span>
    </button>
  );
}
