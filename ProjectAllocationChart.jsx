// data: [{ name, percent, barColor }]
export default function ProjectAllocationChart({ data }) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5">
      <p className="font-bold mb-4">프로젝트별 투입 비중</p>

      <div className="h-4 rounded-full overflow-hidden flex mb-4">
        {data.map((d) => (
          <div key={d.name} style={{ width: `${d.percent}%`, backgroundColor: d.barColor }} title={`${d.name} ${d.percent}%`} />
        ))}
      </div>

      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.barColor }} />
              {d.name}
            </span>
            <span className="font-semibold">{d.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
