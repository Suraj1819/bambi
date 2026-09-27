export default function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 dark:border-surface-border dark:bg-white/[0.03] sm:px-5 sm:py-4">
      <p
        className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400"
        style={{ letterSpacing: '0.2em' }}
      >
        {label}
      </p>
      <p className="mt-1.5 text-[15px] font-semibold text-slate-900 dark:text-white sm:mt-2 sm:text-[16px]">
        {value}
      </p>
    </div>
  );
}
