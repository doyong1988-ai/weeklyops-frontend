import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import TimesheetRow from '../components/TimesheetRow';

export default function DailyLogPage() {
  const rows = useAppStore((s) => s.timesheetRows);
  const projects = useAppStore((s) => s.projects);
  const loading = useAppStore((s) => s.timesheetLoading);
  const error = useAppStore((s) => s.timesheetError);
  const fetchTimesheet = useAppStore((s) => s.fetchTimesheet);
  const updateRow = useAppStore((s) => s.updateTimesheetRow);
  const setRowProjectByName = useAppStore((s) => s.setRowProjectByName);
  const submitDailyReport = useAppStore((s) => s.submitDailyReport);

  useEffect(() => {
    fetchTimesheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    const res = await submitDailyReport();
    if (!res.ok) {
      alert(res.message ?? '제출에 실패했습니다.');
      return;
    }
    alert('일일 보고가 제출되었습니다.');
  }

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900">일일 업무 입력 (Daily Log)</h2>
          <p className="text-sm text-navy-500 mt-1">시간 단위로 오늘 수행한 업무를 기록하세요 (09:00 ~ 18:00)</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="px-4 py-2 rounded-lg border border-surface-200 text-sm font-semibold hover:bg-surface-100">
            임시 저장
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600"
          >
            일일 보고 제출
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-700 mb-4">{error}</div>
      )}

      <div className="rounded-xl border border-surface-200 bg-white overflow-hidden">
        <div className="hidden md:flex px-5 py-3 bg-surface-100 text-xs font-semibold text-navy-500 gap-4">
          <span className="w-16">시간</span>
          <span className="w-40">프로젝트명 (직접 입력)</span>
          <span className="flex-1">진행 상황 요약</span>
          <span className="w-32">진행률</span>
        </div>
        <div className="divide-y divide-surface-200">
          {loading && rows.length === 0 ? (
            <p className="px-5 py-8 text-sm text-navy-400 text-center">불러오는 중…</p>
          ) : (
            rows.map((row) => (
              <TimesheetRow
                key={row.id}
                row={row}
                projects={projects}
                onChange={updateRow}
                onCommitProjectName={setRowProjectByName}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
