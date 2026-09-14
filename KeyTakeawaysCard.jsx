export default function KeyTakeawaysCard({ items = [] }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 flex-1">
      <p className="font-bold text-sm text-navy-900 mb-1">주요 이슈 및 시사점 (Key Takeaways)</p>
      <p className="text-xs text-navy-400 mb-4">월~금 일일보고에서 도출한 리스크·지연·병목 사항</p>
      <div className="space-y-2.5">
        {items.length === 0 && <p className="text-navy-400 text-sm py-2">특이 이슈가 없습니다</p>}
        {items.map((issue, i) => {
          const isHigh = issue.level === 'high';
          return (
            <div key={i} className={`rounded-lg p-3 flex gap-2.5 ${isHigh ? 'bg-red-50' : 'bg-amber-50'}`}>
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isHigh ? 'bg-red-500' : 'bg-amber-500'}`} />
              <div className="min-w-0">
                <p className={`text-xs font-bold mb-0.5 ${isHigh ? 'text-red-600' : 'text-amber-600'}`}>
                  {issue.project} · {isHigh ? '긴급' : '주의'}
                </p>
                <p className="text-xs text-navy-800 leading-relaxed">{issue.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
