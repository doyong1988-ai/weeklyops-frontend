export default function WorkloadAnalysisCard({ items }) {
  return (
    <div className="rounded-2xl bg-navy-800 text-white p-5 flex-1">
      <p className="font-bold text-sm mb-1">팀원별 주요 업무 비중 분석</p>
      <p className="text-xs text-white/55 mb-4">조회 기간 기준, 각 팀원이 가장 많은 시간을 투입한 프로젝트</p>
      <div className="space-y-3.5">
        {items.length === 0 && <p className="text-white/50 text-sm py-2">표시할 데이터가 없습니다</p>}
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-2.5">
            <span className="w-12 text-xs font-semibold shrink-0">{item.name}</span>
            <div className="flex-1 h-[22px] rounded bg-white/12 relative overflow-hidden">
              <div
                className="h-full rounded bg-primary-500 flex items-center px-2"
                style={{ width: `${Math.max(15, item.share)}%` }}
              >
                <span className="text-[10px] font-semibold truncate">{item.projectName}</span>
              </div>
            </div>
            <span className="w-9 text-right text-xs font-bold shrink-0">{item.share}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
