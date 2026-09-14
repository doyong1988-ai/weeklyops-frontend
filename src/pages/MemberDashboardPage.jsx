import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import KPICard from '../components/KPICard';
import ProjectAllocationChart from '../components/ProjectAllocationChart';
import TimesheetDetailModal from '../components/TimesheetDetailModal';

const PALETTE = ['#4F46E5', '#A599F8', '#DDD9FD', '#E2E8F0', '#C4BEFB', '#94A3B8'];

const VIEW_MODES = [
  { id: 'month', label: '월' },
  { id: 'week', label: '주' },
  { id: 'day', label: '일' },
];

export default function MemberDashboardPage() {
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);

  const selectedMonth = useAppStore((s) => s.selectedMonth);
  const goToPrevMonth = useAppStore((s) => s.goToPrevMonth);
  const goToNextMonth = useAppStore((s) => s.goToNextMonth);

  const memberWeekStart = useAppStore((s) => s.memberWeekStart);
  const goToPrevMemberWeek = useAppStore((s) => s.goToPrevMemberWeek);
  const goToNextMemberWeek = useAppStore((s) => s.goToNextMemberWeek);
  const getMemberWeekDays = useAppStore((s) => s.getMemberWeekDays);

  const selectedDay = useAppStore((s) => s.selectedDay);
  const goToPrevDay = useAppStore((s) => s.goToPrevDay);
  const goToNextDay = useAppStore((s) => s.goToNextDay);

  const getPeriodRange = useAppStore((s) => s.getPeriodRange);
  const report = useAppStore((s) => s.memberMonthlyReport);
  const loading = useAppStore((s) => s.memberMonthlyLoading);
  const error = useAppStore((s) => s.memberMonthlyError);
  const fetchMemberPeriodReport = useAppStore((s) => s.fetchMemberPeriodReport);
  const openTimesheetDetail = useAppStore((s) => s.openTimesheetDetail);

  useEffect(() => {
    fetchMemberPeriodReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const periodLabel = getPeriodRange().label;
  const projects = Array.isArray(report?.projects) ? report.projects : [];
  const totalHours = report?.totalHours ?? 0;
  const allocation = projects.map((p, i) => ({
    name: p.name,
    percent: totalHours > 0 ? Math.round((p.hours / totalHours) * 100) : 0,
    barColor: PALETTE[i % PALETTE.length],
  }));

  const weekDays = getMemberWeekDays();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900">내 대시보드</h2>
          <p className="text-sm text-navy-500 mt-1">보기 단위와 기간을 선택하면 해당 기간의 프로젝트·진행 내역만 표시됩니다</p>
        </div>

        {/* 월 / 주 / 일 뷰 전환 */}
        <div className="flex items-center gap-0.5 p-1 rounded-lg bg-surface-100 shrink-0">
          {VIEW_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                viewMode === m.id ? 'bg-white text-primary-600 shadow-sm' : 'text-navy-500 hover:text-navy-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 기간 이동 컨트롤 (뷰에 따라 월/주/일 단위로 이동) */}
      <div className="flex items-center gap-1 px-1 mb-5 rounded-lg border border-surface-200 bg-white text-sm font-medium w-fit">
        <button
          onClick={viewMode === 'month' ? goToPrevMonth : viewMode === 'week' ? goToPrevMemberWeek : goToPrevDay}
          className="px-2.5 py-2 hover:bg-surface-100 rounded-md"
          aria-label="이전"
        >
          ◂
        </button>
        <span key={`${viewMode}-${selectedMonth}-${memberWeekStart}-${selectedDay}`} className="px-2 font-semibold text-navy-900">
          {periodLabel}
        </span>
        <button
          onClick={viewMode === 'month' ? goToNextMonth : viewMode === 'week' ? goToNextMemberWeek : goToNextDay}
          className="px-2.5 py-2 hover:bg-surface-100 rounded-md"
          aria-label="다음"
        >
          ▸
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-700 mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="누적 근무시간" value={`${totalHours}h`} sub={loading ? '' : `${projects.length}개 프로젝트`} />
        <KPICard label="일일 보고 작성" value={`${report?.daysSubmitted ?? 0}일`} sub={`${periodLabel} 제출일수`} subTone="positive" />
        <KPICard label="평균 업무 진행률" value={`${report?.avgProgress ?? 0}%`} sub={periodLabel} subTone="positive" />
        <KPICard label="참여 프로젝트" value={`${projects.length}개`} sub={`${periodLabel} 기준`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {allocation.length > 0 ? (
          <ProjectAllocationChart data={allocation} />
        ) : (
          <div className="rounded-xl border border-surface-200 bg-white p-5 flex items-center justify-center text-sm text-navy-400">
            {loading ? '불러오는 중…' : '해당 기간에 등록된 프로젝트가 없습니다'}
          </div>
        )}
        <div className="rounded-xl border border-surface-200 bg-white p-5">
          <p className="font-bold mb-1">{periodLabel} 프로젝트 요약</p>
          <p className="text-xs text-navy-400 mb-4">선택한 기간에 작성된 항목만 표시됩니다</p>
          <div className="space-y-3 text-sm">
            {projects.length === 0 && !loading && <p className="text-navy-400 text-center py-4">데이터가 없습니다</p>}
            {projects.map((p) => (
              <div key={p.projectId} className="flex items-center gap-3">
                <span className="flex-1 font-medium text-navy-900 truncate">{p.name}</span>
                <div className="w-24 h-2 rounded-full bg-surface-200 shrink-0">
                  <div className="h-2 rounded-full bg-primary-500" style={{ width: `${p.overallProgress}%` }} />
                </div>
                <span className="w-10 text-right text-xs font-semibold shrink-0">{p.overallProgress}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 동적 프로젝트 목록 — 선택한 기간에 작성/등록된 항목만 노출 */}
      <div className="rounded-xl border border-surface-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-navy-900">{periodLabel} · 프로젝트 목록 및 진행 내역</p>
            <span className="text-xs text-navy-400 hidden sm:inline">선택한 기간에 작성된 항목만 표시</span>
          </div>

          {/* 일자 선택 칩 — 클릭하면 그 날짜의 타임시트를 바로 열어 조회/수정 */}
          <div className="flex flex-wrap gap-2">
            {weekDays.map((d) => (
              <button
                key={d.date}
                onClick={() => openTimesheetDetail(d.date)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  d.date === today
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-surface-200 text-navy-600 hover:bg-surface-100'
                }`}
                title="클릭해서 이 날짜의 타임시트 보기/수정"
              >
                {d.label} {d.shortDate}
                {d.date === today && ' · 오늘'}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:flex px-5 py-2.5 bg-surface-100 text-xs font-semibold text-navy-500 gap-4">
          <span className="w-56">프로젝트명</span>
          <span className="w-24">투입 시간</span>
          <span className="flex-1">진행률</span>
          <span className="w-24">최근 작성일</span>
          <span className="w-20">상태</span>
        </div>
        <div className="divide-y divide-surface-200">
          {loading && projects.length === 0 && (
            <p className="px-5 py-8 text-sm text-navy-400 text-center">불러오는 중…</p>
          )}
          {!loading && projects.length === 0 && (
            <p className="px-5 py-8 text-sm text-navy-400 text-center">{periodLabel}에 작성된 프로젝트가 없습니다</p>
          )}
          {projects.map((p) => (
            <button
              key={p.projectId}
              onClick={() => p.lastDate && openTimesheetDetail(p.lastDate)}
              className="w-full flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-5 py-3.5 text-left hover:bg-surface-50"
              title="클릭해서 이 프로젝트의 최근 작성일 타임시트 보기/수정"
            >
              <span className="md:w-56 font-semibold text-navy-900 text-sm truncate">{p.name ?? '이름 없는 프로젝트'}</span>
              <span className="md:w-24 text-sm text-navy-600">{p.hours ?? 0}h</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-surface-200 shrink-0">
                  <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${p.overallProgress ?? 0}%` }} />
                </div>
                <span className="text-xs font-semibold">{p.overallProgress ?? 0}%</span>
              </div>
              <span className="md:w-24 text-xs text-navy-400">{p.lastDate ?? '-'}</span>
              <span
                className={`md:w-20 self-start px-2 py-0.5 rounded-full text-xs font-semibold ${
                  p.status === '완료' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-50 text-primary-600'
                }`}
              >
                {p.status ?? '진행중'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <TimesheetDetailModal />
    </section>
  );
}
