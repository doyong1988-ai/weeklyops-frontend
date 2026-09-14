function hexToTint(hex, alpha) {
  const safe = /^#?[0-9a-fA-F]{6}$/.test(hex) ? hex.replace('#', '') : '94A3B8';
  const n = parseInt(safe, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function DayCard({ day, onClick }) {
  const slots = Array.isArray(day.slots) ? day.slots : [];
  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border border-surface-200 bg-white p-3 hover:border-primary-300 hover:shadow-sm transition-all"
      title="클릭 시 상세보기 (읽기전용)"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-navy-900">
          {day.day ?? '-'} {day.date ?? ''}
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-100">{day.progress ?? 0}%</span>
      </div>
      {slots.length === 0 ? (
        <p className="text-[11px] text-navy-400">작성된 업무가 없습니다</p>
      ) : (
        <div className="space-y-1">
          {slots.map((s, i) => (
            <div key={i}>
              <p className="text-[10px] font-semibold text-primary-600">
                {s.startTime}~{s.endTime}
              </p>
              <p className="text-[11px] text-navy-500 leading-snug">{s.summary || '-'}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-[9px] font-semibold text-primary-500 mt-1.5">🔍 클릭 시 상세보기(읽기전용)</p>
    </button>
  );
}

export default function WeeklyTimelineCard({ project, onOpenDay }) {
  if (!project) return null; // defensive: never render on a missing project object

  const days = Array.isArray(project.days) ? project.days : [];
  const share = project.share ?? 0;
  const overall = project.overall ?? 0;
  const colorHex = /^#?[0-9a-fA-F]{6}$/.test(project.colorHex) ? project.colorHex : '#475569';

  return (
    <div className="rounded-xl bg-surface-100 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: hexToTint(colorHex, 0.14), color: colorHex }}
        >
          {project.name ?? '이름 없는 프로젝트'}
        </span>
        <span className="text-xs text-navy-500">
          주간 투입비중 <b className="text-navy-800">{share}%</b>
        </span>
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <span className="text-xs text-navy-500 shrink-0">전체 진행률</span>
          <div className="flex-1 h-1.5 rounded-full bg-surface-200 max-w-[140px]">
            <div className="h-full rounded-full bg-primary-500" style={{ width: `${overall}%` }} />
          </div>
          <span className="text-xs font-bold">{overall}%</span>
        </div>
      </div>

      <div className="rounded-lg bg-white border border-surface-200 p-3">
        <p className="text-[11px] font-semibold text-primary-600 mb-1">★ 금주 총평 및 주요 성과 (AI 요약)</p>
        <p className="text-xs text-navy-700 leading-relaxed">
          {project.aiSummary || '아직 집계된 요약이 없습니다.'}
        </p>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-navy-500 mb-2">일별 업무 내역 (월~금)</p>
        {days.length === 0 ? (
          <div className="rounded-lg border border-dashed border-surface-200 bg-white py-6 text-center">
            <p className="text-xs text-navy-400">작성된 일일보고가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {days.map((d, i) => (
              <DayCard key={`${d?.day ?? i}-${d?.date ?? i}`} day={d ?? {}} onClick={() => onOpenDay?.(d?.isoDate)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
