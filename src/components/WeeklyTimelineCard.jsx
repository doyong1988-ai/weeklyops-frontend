import { useState } from 'react';

function hexToTint(hex, alpha) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function DayCard({ day }) {
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-navy-900">
          {day.day} {day.date}
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-100">{day.progress}%</span>
      </div>
      <p className="text-[11px] text-navy-500 leading-snug">{day.summary || '-'}</p>
    </div>
  );
}

const FEEDBACK_LABEL = {
  approved: { text: '✓ 승인됨', className: 'bg-emerald-100 text-emerald-700' },
  feedback_requested: { text: '피드백 요청됨', className: 'bg-amber-100 text-amber-700' },
  pending: { text: '검토 대기', className: 'bg-surface-200 text-navy-500' },
};

export default function WeeklyTimelineCard({ project, onApprove, onRequestFeedback }) {
  const [busy, setBusy] = useState(false);
  const feedbackMeta = FEEDBACK_LABEL[project.feedbackStatus] ?? FEEDBACK_LABEL.pending;
  const isApproved = project.feedbackStatus === 'approved';

  async function handleApprove() {
    if (!onApprove || busy) return;
    setBusy(true);
    await onApprove(project.weeklySummaryId);
    setBusy(false);
  }

  async function handleRequestFeedback() {
    if (!onRequestFeedback || busy) return;
    const comment = window.prompt('어떤 부분에 대한 피드백인가요?');
    if (!comment) return;
    setBusy(true);
    await onRequestFeedback(project.weeklySummaryId, comment);
    setBusy(false);
  }

  return (
    <div className="rounded-xl bg-surface-100 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: hexToTint(project.colorHex ?? '#94A3B8', 0.14), color: project.colorHex ?? '#475569' }}
        >
          {project.name}
        </span>
        <span className="text-xs text-navy-500">
          주간 투입비중 <b className="text-navy-800">{project.share}%</b>
        </span>
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <span className="text-xs text-navy-500 shrink-0">전체 진행률</span>
          <div className="flex-1 h-1.5 rounded-full bg-surface-200 max-w-[140px]">
            <div className="h-full rounded-full bg-primary-500" style={{ width: `${project.overall}%` }} />
          </div>
          <span className="text-xs font-bold">{project.overall}%</span>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${feedbackMeta.className}`}>
          {feedbackMeta.text}
        </span>
      </div>

      <div className="rounded-lg bg-white border border-surface-200 p-3">
        <p className="text-[11px] font-semibold text-primary-600 mb-1">★ 금주 총평 및 주요 성과 (AI 요약)</p>
        <p className="text-xs text-navy-700 leading-relaxed">{project.aiSummary}</p>
        {project.feedbackComment && (
          <p className="text-[11px] text-amber-700 mt-2 pt-2 border-t border-surface-100">
            💬 팀장 피드백: {project.feedbackComment}
          </p>
        )}
      </div>

      <div>
        <p className="text-[11px] font-semibold text-navy-500 mb-2">일별 업무 내역 (월~금)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {project.days.map((d) => (
            <DayCard key={`${d.day}-${d.date}`} day={d} />
          ))}
        </div>
      </div>

      {(onApprove || onRequestFeedback) && (
        <div className="flex justify-end gap-2">
          <button
            onClick={handleRequestFeedback}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs font-semibold hover:bg-surface-100 disabled:opacity-50"
          >
            피드백 남기기
          </button>
          <button
            onClick={handleApprove}
            disabled={busy || isApproved}
            className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:bg-surface-300 disabled:text-navy-500"
          >
            {isApproved ? '✓ 승인됨' : '승인'}
          </button>
        </div>
      )}
    </div>
  );
}
