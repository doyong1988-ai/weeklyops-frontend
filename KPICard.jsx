export default function KPICard({ label, value, sub, subTone = 'neutral' }) {
  const toneClass =
    {
      positive: 'text-emerald-600',
      warning: 'text-amber-600',
      neutral: 'text-navy-500',
    }[subTone] ?? 'text-navy-500';

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-4">
      <p className="text-xs font-medium text-navy-500">{label}</p>
      <p className="text-xl sm:text-2xl font-bold mt-1 text-navy-900">{value}</p>
      {sub && <p className={`text-xs font-semibold mt-1 ${toneClass}`}>{sub}</p>}
    </div>
  );
}
