import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import KPICard from '../components/KPICard';
import ProjectAllocationChart from '../components/ProjectAllocationChart';

const PALETTE = ['#4F46E5', '#A599F8', '#DDD9FD', '#E2E8F0', '#C4BEFB', '#94A3B8'];

export default function MemberDashboardPage() {
  const selectedMonth = useAppStore((s) => s.selectedMonth);
  const getSelectedMonthLabel = useAppStore((s) => s.getSelectedMonthLabel);
  const goToPrevMonth = useAppStore((s) => s.goToPrevMonth);
  const goToNextMonth = useAppStore((s) => s.goToNextMonth);
  const report = useAppStore((s) => s.memberMonthlyReport);
  const loading = useAppStore((s) => s.memberMonthlyLoading);
  const error = useAppStore((s) => s.memberMonthlyError);
  const fetchMemberMonthlyReport = useAppStore((s) => s.fetchMemberMonthlyReport);

  useEffect(() => {
    fetchMemberMonthlyReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const projects = report?.projects ?? [];
  const totalHours = report?.totalHours ?? 0;
  const allocation = projects.map((p, i) => ({
    name: p.name,
    percent: totalHours > 0 ? Math.round((p.hours / totalHours) * 100) : 0,
    barColor: PALETTE[i % PALETTE.length],
  }));

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900">내 대시보드</h2>
          <p className="text-sm text-navy-500 mt-1">조회할 년/월을 선택하면 해당 기간의 프로젝트·진행 내역만 표시됩니다</p>
        </div>
        <div className="flex items-center gap-1 px-1 rounded-lg border border-surface-200 bg-white text-sm font-medium shrink-0">
          <button onClick={goToPrevMonth} className="px-2.5 py-2 hover:bg-surface-100 rounded-md" aria-label="이전 달">
            ◂
          </button>
          <span key={selectedMonth} className="px-2 font-semibold text-navy-900">
            {getSelectedMonthLabel()}
          </span>
          <button onClick={goToNextMonth} className="px-2.5 py-2 hover:bg-surface-100 rounded-md" aria-label="다음 달">
            ▸
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-700 mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="이번 달 누적 근무시간" value={`${totalHours}h`} sub={loading ? '' : `${projects.length}개 프로젝트`} />
        <KPICard label="일일 보고 작성" value={`${report?.daysSubmitted ?? 0}일`} sub="이번 달 제출일수" subTone="positive" />
        <KPICard label="평균 업무 진행률" value={`${report?.avgProgress ?? 0}%`} sub={getSelectedMonthLabel()} subTone="positive" />
        <KPICard label="참여 프로젝트" value={`${projects.length}개`} sub={getSelectedMonthLabel() + ' 기준'} />
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
          <p className="font-bold mb-1">{getSelectedMonthLabel()} 프로젝트 요약</p>
          <p className="text-xs text-navy-400 mb-4">선택한 월에 작성된 항목만 표시됩니다</p>
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

      {/* 동적 프로젝트 목록 — 선택한 년/월에 작성/등록된 항목만 노출 */}
      <div className="rounded-xl border border-surface-200 bg-white overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <p className="font-bold text-navy-900">{getSelectedMonthLabel()} · 프로젝트 목록 및 진행 내역</p>
          <span className="text-xs text-navy-400">선택한 월에 작성된 항목만 표시</span>
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
            <p className="px-5 py-8 text-sm text-navy-400 text-center">{getSelectedMonthLabel()}에 작성된 프로젝트가 없습니다</p>
          )}
          {projects.map((p) => (
            <div key={p.projectId} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-5 py-3.5">
              <span className="md:w-56 font-semibold text-navy-900 text-sm truncate">{p.name}</span>
              <span className="md:w-24 text-sm text-navy-600">{p.hours}h</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-surface-200 shrink-0">
                  <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${p.overallProgress}%` }} />
                </div>
                <span className="text-xs font-semibold">{p.overallProgress}%</span>
              </div>
              <span className="md:w-24 text-xs text-navy-400">{p.lastDate}</span>
              <span
                className={`md:w-20 self-start px-2 py-0.5 rounded-full text-xs font-semibold ${
                  p.status === '완료' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-50 text-primary-600'
                }`}
              >
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
