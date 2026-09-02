export default function CustomerOrdersLoading() {
  return (
    <div className="mx-auto w-full max-w-[1180px] animate-pulse px-4 py-10 motion-reduce:animate-none sm:px-6 md:px-12 md:py-14" aria-label="Memuat pesanan">
      <div className="h-3 w-28 rounded bg-[#E5E2D9]" />
      <div className="mt-4 h-12 w-64 max-w-full rounded bg-[#DAD6CD]" />
      <div className="mt-3 h-4 w-[480px] max-w-full rounded bg-[#E5E2D9]" />
      <div className="mt-9 flex gap-2 overflow-hidden border-t border-[#DAD6CD] pt-7">
        {[96, 128, 92, 120].map((width) => <div key={width} className="h-9 shrink-0 rounded-xl bg-[#E5E2D9]" style={{ width }} />)}
      </div>
      <div className="mt-8 space-y-4">
        {[1, 2, 3].map((item) => <div key={item} className="h-40 rounded-2xl border border-[#DAD6CD] bg-white" />)}
      </div>
    </div>
  );
}
