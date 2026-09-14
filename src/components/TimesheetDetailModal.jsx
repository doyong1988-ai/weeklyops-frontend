import useAppStore from '../store/useAppStore';
import TimesheetRow from './TimesheetRow';

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const KR = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${KR[d.getDay()]})`;
}

export default function TimesheetDetailModal() {
  const detail = useAppStore((s) => s.timesheetDetail);
  const projects = useAppStore((s) => s.projects);
  const updateRow = useAppStore((s) => s.updateTimesheetDetailRow);
  const setRowProjectByName = useAppStore((s) => s.setDetailRowProjectByName);
  const closeModal = useAppStore((s) => s.closeTimesheetDetail);

  if (!detail.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

      <div className="relative w-full sm:max-w-2xl h-full bg-surface-50 shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white border-b border-surface-200 shrink-0">
          <div>
            <p className="text-xs font-semibold text-primary-600 mb-0.5">타임시트 상세 · 조회 및 수정</p>
            <h2 className="text-lg font-bold text-navy-900">{formatDateLabel(detail.date)}</h2>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-navy-400 hover:text-navy-700"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {detail.error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-700 mb-4">
              {detail.error}
            </div>
          )}

          {detail.loading ? (
            <p className="text-sm text-navy-400 text-center py-12">불러오는 중…</p>
          ) : detail.rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-200 bg-white py-12 text-center">
              <p className="text-sm text-navy-400">이 날짜에는 작성된 타임시트가 없습니다.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-surface-200 bg-white overflow-hidden">
              <div className="hidden md:flex px-5 py-3 bg-surface-100 text-xs font-semibold text-navy-500 gap-4">
                <span className="w-16">시간</span>
                <span className="w-40">프로젝트명 (직접 입력)</span>
                <span className="flex-1">진행 상황 요약</span>
                <span className="w-32">진행률</span>
              </div>
              <div className="divide-y divide-surface-200">
                {detail.rows.map((row) => (
                  <TimesheetRow
                    key={row.id}
                    row={row}
                    projects={projects}
                    onChange={updateRow}
                    onCommitProjectName={setRowProjectByName}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 py-4 bg-white border-t border-surface-200 shrink-0 flex justify-end">
          <button
            onClick={closeModal}
            className="px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
