import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import KPICard from '../components/KPICard';
import MemberAccordionCard from '../components/MemberAccordionCard';
import WorkloadAnalysisCard from '../components/WorkloadAnalysisCard';
import KeyTakeawaysCard from '../components/KeyTakeawaysCard';
import LeaderReadOnlyDetailModal from '../components/LeaderReadOnlyDetailModal';
import { deriveWorkloadAnalysis, deriveKeyTakeaways } from '../lib/insights';

export default function LeaderDashboardPage() {
  const weekId = useAppStore((s) => s.weekId);
  const getCurrentWeekLabel = useAppStore((s) => s.getCurrentWeekLabel);
  const goToPrevWeek = useAppStore((s) => s.goToPrevWeek);
  const goToNextWeek = useAppStore((s) => s.goToNextWeek);

  const filters = useAppStore((s) => s.filters);
  const setFilter = useAppStore((s) => s.setFilter);
  const getFilteredMembers = useAppStore((s) => s.getFilteredMembers);
  const leaderMembersRaw = useAppStore((s) => s.leaderMembers);
  const leaderMembers = Array.isArray(leaderMembersRaw) ? leaderMembersRaw : [];
  const loading = useAppStore((s) => s.leaderLoading);
  const error = useAppStore((s) => s.leaderError);
  const fetchLeaderReport = useAppStore((s) => s.fetchLeaderReport);
  const openLeaderDayDetail = useAppStore((s) => s.openLeaderDayDetail);
  const projects = useAppStore((s) => s.projects);

  useEffect(() => {
    fetchLeaderReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMembers = getFilteredMembers();
  const unsubmitted = filteredMembers.filter((m) => m.status === '미작성');
  const workProjects = projects.filter((p) => !p.nonWork);
  const workloadItems = deriveWorkloadAnalysis(leaderMembers);
  const keyTakeaways = deriveKeyTakeaways(leaderMembers);

  return (
    <section>
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy-900">팀 주간보고 · 금요일 리포트</h2>
            <p className="text-sm text-navy-500 mt-1">
              월~금 일별 업무 내역을 팀원·프로젝트별로 확인하고 승인/피드백하세요
            </p>
          </div>
          <button className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 shrink-0">
            전체 리포트 내보내기
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 px-1 rounded-lg border border-surface-200 bg-white text-xs font-medium">
            <button onClick={goToPrevWeek} className="px-2 py-2 hover:bg-surface-100 rounded-md" aria-label="이전 주">
              ◂
            </button>
            <span key={weekId} className="px-1">
              {getCurrentWeekLabel()}
            </span>
            <button onClick={goToNextWeek} className="px-2 py-2 hover:bg-surface-100 rounded-md" aria-label="다음 주">
              ▸
            </button>
          </div>

          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="팀원 검색"
            className="px-3 py-2 rounded-lg border border-surface-200 bg-white text-xs font-medium w-40 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          <select
            value={filters.projectId}
            onChange={(e) => setFilter('projectId', e.target.value)}
            className="px-3 py-2 rounded-lg border border-surface-200 bg-white text-xs font-medium"
          >
            <option value="all">프로젝트: 전체</option>
            {workProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={filters.memberId}
            onChange={(e) => setFilter('memberId', e.target.value)}
            className="px-3 py-2 rounded-lg border border-surface-200 bg-white text-xs font-medium"
          >
            <option value="all">팀원: 전체</option>
            {leaderMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-700 mb-4">{error}</div>
      )}

      {unsubmitted.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700 mb-4">
          ⚠️ 미작성 팀원 {unsubmitted.length}명: {unsubmitted.map((m) => m.name).join(', ')} — 금일 오전 10시까지 제출 필요
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KPICard
          label="제출 현황"
          value={leaderMembers.length > 0 ? `${leaderMembers.length - unsubmitted.length} / ${leaderMembers.length}명` : '- / -명'}
        />
        <KPICard label="팀 평균 진행률" value="64%" sub="전주 대비 +4%p" subTone="positive" />
        <KPICard label="진행 중 프로젝트" value={`${workProjects.length}개`} />
        <KPICard label="이번 주 총 근무시간" value={`${leaderMembers.reduce((sum, m) => sum + (m.hours || 0), 0)}h`} />
      </div>

      <p className="font-bold text-navy-900 mb-3">★ AI 기반 팀 주간 종합 요약</p>
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <WorkloadAnalysisCard items={workloadItems} />
        <KeyTakeawaysCard items={keyTakeaways} />
      </div>

      <h3 className="font-bold text-navy-900 mb-3">팀원별 · 프로젝트별 월~금 일별 업무 상세</h3>

      {loading && leaderMembers.length === 0 ? (
        <p className="text-sm text-navy-500 py-8 text-center">불러오는 중…</p>
      ) : filteredMembers.length === 0 ? (
        <p className="text-sm text-navy-500 py-8 text-center">조건에 맞는 팀원이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((m) => (
            <MemberAccordionCard key={m.id} member={m} onOpenDay={openLeaderDayDetail} />
          ))}
        </div>
      )}

      <LeaderReadOnlyDetailModal />
    </section>
  );
}
