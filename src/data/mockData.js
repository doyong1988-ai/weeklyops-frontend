// ---------------------------------------------------------------------------
// Mock data only. In production, replace with API calls (see comments below
// each export for the suggested endpoint shape).
// ---------------------------------------------------------------------------

export const PROJECTS = [
  { id: 'wo-auto', name: '주간보고 자동화 시스템', color: 'bg-primary-100 text-primary-700', barColor: '#4F46E5' },
  { id: 'portal', name: '사내 포털 고도화', color: 'bg-sky-100 text-sky-700', barColor: '#0284C7' },
  { id: 'hr-onboarding', name: 'HR 온보딩 리뉴얼', color: 'bg-emerald-100 text-emerald-700', barColor: '#059669' },
  { id: 'lunch', name: '점심시간', color: 'bg-surface-200 text-navy-400', barColor: '#CBD5E1', nonWork: true },
];

export function getProject(id) {
  return PROJECTS.find((p) => p.id === id) || null;
}

// GET /api/timesheet?date=2026-09-11 -> { rows: [...] }
export const INITIAL_TIMESHEET_ROWS = [
  { id: 'r0900', time: '09:00-10:00', projectId: 'wo-auto', summary: '팀장 대시보드 화면 와이어프레임 설계 진행', progress: 40, aiApplied: true },
  { id: 'r1000', time: '10:00-11:00', projectId: 'wo-auto', summary: '타임시트 입력 UI 컴포넌트 정의', progress: 60, aiApplied: true },
  { id: 'r1100', time: '11:00-12:00', projectId: 'hr-onboarding', summary: '신규 입사자 프로세스 문서 검토', progress: 30, aiApplied: false },
  { id: 'r1200', time: '12:00-13:00', projectId: 'lunch', summary: '', progress: 0, aiApplied: false, locked: true },
  { id: 'r1300', time: '13:00-14:00', projectId: 'wo-auto', summary: 'AI 요약 프롬프트 초안 작성 및 테스트', progress: 55, aiApplied: true },
  { id: 'r1400', time: '14:00-15:00', projectId: 'portal', summary: '알림 API 연동 이슈 확인', progress: 20, aiApplied: false },
  { id: 'r1500', time: '15:00-16:00', projectId: 'wo-auto', summary: '팀 주간보고 리스트 컴포넌트 구현', progress: 70, aiApplied: true },
  { id: 'r1600', time: '16:00-17:00', projectId: '', summary: '', progress: 0, aiApplied: false },
  { id: 'r1700', time: '17:00-18:00', projectId: '', summary: '', progress: 0, aiApplied: false },
];

// POST /api/ai/enhance { rowId, rawText } -> { suggestion }
// Mocked with a lookup + a generic fallback so the demo works for any text.
const AI_SUGGESTIONS = {
  r0900:
    '팀장 대시보드의 정보구조(IA)를 정의하고, 팀원별 진행률 요약 카드 3종과 프로젝트별 트래킹 차트 와이어프레임을 설계함(진행률 40%).',
  r1000:
    '타임시트 입력 UI의 시간대별 행 컴포넌트를 정의하고, 프로젝트 선택·요약 입력·진행률 슬라이더의 상태 구조를 설계함.',
  r1300:
    'AI 자동 보완 프롬프트 초안을 작성하고 5건의 샘플 업무 요약으로 응답 품질을 테스트함. 응답 형식을 2~3문장으로 표준화함.',
  r1500:
    '팀 주간보고 리스트 컴포넌트를 구현하고, 팀원별 아코디언과 프로젝트 하위 리스트 렌더링 로직을 연결함.',
};

export function mockGenerateAISuggestion(rowId, rawText) {
  return (
    AI_SUGGESTIONS[rowId] ||
    `${rawText || '해당 업무'}에 대한 세부 작업을 구체화하여 정리함. 관련 산출물과 다음 단계 계획을 함께 명시함.`
  );
}

// GET /api/team/weekly-report?week=2026-W37 (실제로는 supabase.rpc('get_leader_weekly_report', {p_week_start})
// 이 데모 데이터는 src/lib/api.js의 fetchLeaderWeeklyReport()가 반환하는 것과
// 동일한 모양으로 맞춰뒀습니다 — 그래야 데모/실서버 모드 전환 시 컴포넌트가
// 아무것도 몰라도 됩니다.
export const TEAM_MEMBERS = [
  {
    id: 'kimdohyun',
    name: '김도현',
    role: 'Frontend Engineer',
    hours: 39,
    status: '제출완료',
    projects: [
      {
        weeklySummaryId: 'ws-kim-woauto',
        projectId: 'wo-auto',
        name: '주간보고 자동화 시스템',
        colorHex: '#4F46E5',
        share: 60,
        overall: 85,
        feedbackStatus: 'approved',
        feedbackComment: null,
        aiSummary:
          '타임시트 입력 UI부터 팀장 대시보드 뷰까지 핵심 화면을 빠르게 설계·구현하며 85%까지 도달했습니다. 월~금 진행률이 꾸준히 상승해 일정 준수가 양호합니다.',
        days: [
          { day: '월', date: '9/7', progress: 40, summary: '타임시트 입력 UI 와이어프레임 설계' },
          { day: '화', date: '9/8', progress: 60, summary: '타임시트 컴포넌트 구현, AI 보완 버튼 연동' },
          { day: '수', date: '9/9', progress: 68, summary: 'AI 자동 보완 모달 UI 설계' },
          { day: '목', date: '9/10', progress: 78, summary: '다중 프로젝트 아코디언 구현' },
          { day: '금', date: '9/11', progress: 85, summary: '일별 타임라인 뷰 설계 및 QA' },
        ],
      },
      {
        weeklySummaryId: 'ws-kim-portal',
        projectId: 'portal',
        name: '사내 포털 고도화',
        colorHex: '#0284C7',
        share: 40,
        overall: 45,
        feedbackStatus: 'pending',
        feedbackComment: null,
        aiSummary:
          '알림 API 연동 이슈를 주 초반 확인하고 후반 수정안을 반영하며 45%까지 진행했습니다. 이슈 대응으로 일부 지연이 있었으나 회복 추세입니다.',
        days: [
          { day: '월', date: '9/7', progress: 10, summary: '알림 API 명세 문서 검토' },
          { day: '화', date: '9/8', progress: 20, summary: '테스트 환경 구성' },
          { day: '수', date: '9/9', progress: 28, summary: '발송 실패 이슈 확인 및 분석' },
          { day: '목', date: '9/10', progress: 38, summary: '재현 테스트 및 백엔드 협의' },
          { day: '금', date: '9/11', progress: 45, summary: '1차 수정안 반영 및 재검증 요청' },
        ],
      },
    ],
  },
  {
    id: 'leehaeun',
    name: '이하은',
    role: 'Product Designer',
    hours: 36,
    status: '제출완료',
    projects: [
      {
        weeklySummaryId: 'ws-lee-portal',
        projectId: 'portal',
        name: '사내 포털 고도화',
        colorHex: '#0284C7',
        share: 70,
        overall: 45,
        feedbackStatus: 'feedback_requested',
        feedbackComment: 'API 지연 원인을 조금 더 구체적으로 적어주세요.',
        aiSummary: 'API 연동 지연 이슈에 신속히 대체 디자인안을 제시하며 대응했습니다.',
        days: [
          { day: '월', date: '9/7', progress: 15, summary: '현행 플로우 점검' },
          { day: '화', date: '9/8', progress: 25, summary: '대체 플로우 초안 스케치' },
          { day: '수', date: '9/9', progress: 32, summary: '대체 디자인안 1차 완성' },
          { day: '목', date: '9/10', progress: 40, summary: '개발팀 리뷰 및 피드백 반영' },
          { day: '금', date: '9/11', progress: 45, summary: '최종 수정안 전달' },
        ],
      },
      {
        weeklySummaryId: 'ws-lee-hr',
        projectId: 'hr-onboarding',
        name: 'HR 온보딩 리뉴얼',
        colorHex: '#059669',
        share: 30,
        overall: 60,
        feedbackStatus: 'pending',
        feedbackComment: null,
        aiSummary: '온보딩 화면 시안 2차 검토를 마쳐 60% 진행 중입니다.',
        days: [
          { day: '월', date: '9/7', progress: 45, summary: '시안 1차 피드백 반영' },
          { day: '화', date: '9/8', progress: 50, summary: '컴포넌트 스타일 정리' },
          { day: '수', date: '9/9', progress: 55, summary: '2차 검토 회의 진행' },
          { day: '목', date: '9/10', progress: 58, summary: '검토 의견 반영' },
          { day: '금', date: '9/11', progress: 60, summary: '최종 시안 정리' },
        ],
      },
    ],
  },
  {
    id: 'jungwoojin',
    name: '정우진',
    role: 'Backend Engineer',
    hours: 40,
    status: '제출완료',
    projects: [
      {
        weeklySummaryId: 'ws-jung-hr',
        projectId: 'hr-onboarding',
        name: 'HR 온보딩 리뉴얼',
        colorHex: '#059669',
        share: 100,
        overall: 72,
        feedbackStatus: 'pending',
        feedbackComment: null,
        aiSummary: '온보딩 문서 API 스펙을 확정해 72%까지 진행했습니다. 승인 대기 중입니다.',
        days: [
          { day: '월', date: '9/7', progress: 55, summary: 'API 스펙 초안 작성' },
          { day: '화', date: '9/8', progress: 60, summary: '스펙 리뷰 및 수정' },
          { day: '수', date: '9/9', progress: 65, summary: '엣지 케이스 정의' },
          { day: '목', date: '9/10', progress: 70, summary: '문서 최종 정리' },
          { day: '금', date: '9/11', progress: 72, summary: '스펙 확정, 승인 요청' },
        ],
      },
    ],
  },
  { id: 'parkseoyeon', name: '박서연', role: 'Frontend Engineer', hours: 0, status: '미작성', projects: [] },
  { id: 'choiminjun', name: '최민준', role: 'Backend Engineer', hours: 0, status: '미작성', projects: [] },
];

export const WEEKS = [
  { id: '2026-W36', label: '2026년 9월 1주차 (8/31~9/4)', weekStart: '2026-08-31' },
  { id: '2026-W37', label: '2026년 9월 2주차 (9/7~9/11)', weekStart: '2026-09-07' },
  { id: '2026-W38', label: '2026년 9월 3주차 (9/14~9/18)', weekStart: '2026-09-14' },
];

// GET (RPC get_member_monthly_projects) — 데모 모드 대체 데이터.
// src/lib/api.js의 fetchMemberMonthlyProjects()가 실제 모드에서 반환하는 것과
// 동일한 모양으로 맞춰뒀습니다.
export const MEMBER_MONTHLY_MOCK = {
  totalHours: 154,
  daysSubmitted: 19,
  avgProgress: 61,
  projects: [
    { projectId: 'wo-auto', name: '주간보고 자동화 시스템', hours: 64.5, overallProgress: 78, lastDate: '2026-09-11', status: '진행중' },
    { projectId: 'hr-onboarding', name: 'HR 온보딩 리뉴얼', hours: 37, overallProgress: 60, lastDate: '2026-09-10', status: '진행중' },
    { projectId: 'portal', name: '사내 포털 고도화', hours: 31, overallProgress: 45, lastDate: '2026-09-09', status: '진행중' },
    { projectId: 'onboarding-guide', name: '신규 입사자 가이드', hours: 21.5, overallProgress: 100, lastDate: '2026-09-04', status: '완료' },
  ],
};

