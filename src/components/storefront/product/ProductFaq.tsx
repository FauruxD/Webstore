import React from 'react';
import { Plus } from 'lucide-react';

export interface ProductFaqEntry {
  question: string;
  answer: string;
}

/**
 * Native `details` disclosure so the FAQ needs no client JavaScript and still
 * gets keyboard and screen-reader behaviour for free.
 */
export function ProductFaq({ entries }: { entries: ProductFaqEntry[] }) {
  return (
    <div className="divide-y divide-[#DAD6CD] border-y border-[#DAD6CD]">
      {entries.map((entry) => (
        <details key={entry.question} className="group py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-sm font-semibold text-[#111111] transition-colors marker:content-none hover:text-[#6657E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657E8] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F8F6F0]">
            <span>{entry.question}</span>
            <Plus
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-[#686660] transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
            />
          </summary>
          {/*
            Closed answers are `display: none`, so the animation restarts each
            time the disclosure opens. Height is left to the browser, which
            keeps the native behaviour and avoids measuring anything.
          */}
          <p className="motion-fade-up mt-3 max-w-[68ch] text-sm leading-relaxed text-[#686660]">
            {entry.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
