# WeeklyOps — Frontend (React + Tailwind + Zustand + Supabase)

Figma 최종 디자인(로그인 + 타임시트 + 내 대시보드 + 팀 대시보드) 기준으로 만든 React 앱입니다.
`weeklyops-backend`에 연결하면 바로 실제 데이터로 동작합니다.

## 실행 방법

```bash
npm install
cp .env.example .env.local   # Supabase 값 채우기 (안 채우면 자동으로 DEMO 모드)
npm run dev       # http://localhost:5173
npm run build     # 배포용 정적 빌드 (dist/)
```

`.env.local`을 채우지 않으면 화면 상단에 "DEMO 모드" 배너가 뜨고, 로그인 없이 바로
목업 데이터로 둘러볼 수 있습니다(`src/data/mockData.js`). `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY`를 채우는 순간 코드 변경 없이 실제 로그인·데이터 모드로
전환됩니다.

## 이번 업데이트 (Figma 09/10 프레임 반영)

### 팀장 대시보드 — 승인/피드백 제거, 일별 카드 시간대별 재구성

- `WeeklyTimelineCard.jsx`에서 "검토 대기" 같은 상태 배지와 "피드백 남기기"/"승인" 버튼을
  **완전히 제거**했습니다. (스토어의 `reviewProject`/`approveProject`/`requestFeedbackOnProject`
  액션과 백엔드 `review-weekly-report` 함수는 그대로 남겨뒀습니다 — 나중에 다시 필요하면
  UI만 붙이면 됩니다.)
- 일별 카드가 하루 요약 한 줄이 아니라 **시간대별로 여러 줄**을 보여주도록 바꿨습니다
  (예: "11:00~12:00 기획서 작성"). 이를 위해 `db/007_multi_slot_days.sql`에서
  `get_leader_weekly_report` RPC의 `days` 항목이 문자열 하나가 아니라 `slots` 배열을
  반환하도록 바꿨습니다.
- 일별 카드를 클릭하면 **읽기 전용** 슬라이드오버(`LeaderReadOnlyDetailModal.jsx`)가 열려
  그 팀원의 그 날짜 09:00~18:00 전체를 조회할 수 있습니다 (수정 불가, 팀원 본인이 보는
  수정 가능한 모달과는 다른 컴포넌트입니다).

### 캘린더 기반 날짜 선택 (신규)

- `CalendarDatePicker.jsx` — 년/월/일을 고를 수 있는 팝업 캘린더. 외부 라이브러리 없이
  직접 구현했습니다.
- **타임시트 작성**: 상단에 캘린더 + 하루씩 이동하는 ◂▸ 버튼을 추가해, 오늘뿐 아니라
  과거/미래 날짜의 타임시트도 조회·작성·수정할 수 있습니다.
- **내 대시보드**: "[기간] · 프로젝트 목록" 섹션의 요일 칩을 없애고 같은 캘린더로
  교체했습니다. 날짜를 고르면 그날의 타임시트 수정 모달이 바로 열립니다.
- 내 대시보드에는 **월/주/일 뷰 전환** 버튼도 추가되어, KPI·프로젝트 목록이 선택한
  단위(월 전체/해당 주/해당 하루)에 맞춰 집계됩니다. 세 가지 모두
  `get_member_monthly_projects` RPC를 그대로 재사용합니다(월별 전용이 아니라 임의의
  날짜 범위를 받는 함수라 이름만 monthly일 뿐입니다).


### 1. 로그인 (신규)

- `src/pages/LoginPage.jsx` — 피터패트 브랜드 그라데이션 배경의 로그인 화면.
  "아이디"는 이메일 형식으로 입력받아 `supabase.auth.signInWithPassword()`를
  호출합니다 (Supabase Auth 자체가 이메일/비밀번호 기반이라, 팀 이메일을
  아이디처럼 사용하는 방식입니다).
- **회원가입 없음** — 계정은 관리자가 Supabase 대시보드에서 만듭니다
  (`weeklyops-backend/README.md`의 "로그인 계정 만들기" 참고).
- **아이디 저장(remember me)** 체크박스: 켜면 세션이 `localStorage`(브라우저를
  닫아도 유지)에, 끄면 `sessionStorage`(탭을 닫으면 로그아웃)에 저장됩니다 —
  `src/lib/supabaseClient.js`의 커스텀 storage 어댑터로 구현.
- `src/App.jsx`의 `AuthGate`가 로그인 안 된 사용자를 `/login`으로 돌려보냅니다.
  데모 모드에서는 애초에 인증이 필요 없으므로 항상 통과합니다.
- 사이드바 하단 로그아웃 버튼은 실서버 모드에서만 보입니다(데모 모드는 로그아웃할
  세션이 없으므로 기존처럼 역할 전환 버튼이 보입니다).

### 2. 타임시트 — AI 관련 UI 전면 제거

최신 기획서 기준 "팀원 개별 입력 단계에서의 AI 자동 보완 문구 및 버튼은 제외"에
맞춰, `TimesheetRow.jsx`/`DailyLogPage.jsx`에서 AI 버튼·컬럼을 완전히 뺐습니다.
관련 스토어 로직(`aiModal`, `_runAIEnhance` 등)과 백엔드 `ai-enhance` 함수는 그대로
남겨뒀으니, 나중에 이 기능을 다시 붙일 때는 백엔드 재작업 없이 UI만 되살리면 됩니다.

### 3. 내 대시보드 — 년/월 동적 필터 (신규)

`MemberDashboardPage.jsx`에 년/월 선택기를 추가했고, 프로젝트 목록·KPI·투입비중
차트가 선택한 월의 데이터만 보여주도록 다시 짰습니다. 실서버 모드에서는
`db/004_member_monthly_report.sql`의 RPC(`get_member_monthly_projects`)를 호출합니다
(`src/lib/api.js`의 `fetchMemberMonthlyProjects`).

### 4. 팀 대시보드 — AI 요약 섹션 2분할 (재구성)

기존의 단일 "AI 기반 팀 주간 종합 요약" 카드를 요청하신 구조로 나눴습니다:

- `WorkloadAnalysisCard.jsx` — 팀원별로 이번 주 가장 비중이 높았던 프로젝트를
  막대 안에 표기
- `KeyTakeawaysCard.jsx` — 진행률 저조/리소스 집중/피드백 미반영 등을 감지해
  "주요 이슈 및 시사점" 카드로 표시

**현재는 규칙 기반입니다** (`src/lib/insights.js`에 로직과 함께 주석으로 명시). AI
기능을 켜면 이 두 함수를 실제 Claude 분석 결과로 교체하는 걸 권장합니다 — 예를 들어
weekly_summaries의 텍스트들을 모아 호출하는 새 Edge Function(`analyze-team-week`
같은)을 만들고, `deriveWorkloadAnalysis`/`deriveKeyTakeaways` 자리에 그 결과를
끼워 넣으면 됩니다.

### 프로젝트는 자유 텍스트 입력입니다 (이전과 동일)

타임시트의 "프로젝트" 칸은 자유 텍스트 입력(`<input list>` + 자동완성)입니다.
목록에 없는 이름을 입력하면 `projects` 테이블에 새 행을 즉석에서 만듭니다.
Supabase에 `db/002_allow_project_creation.sql`을 실행해야 동작합니다.

## 백엔드 연동 지점

| 화면/기능 | 실제 호출 | 위치 |
|---|---|---|
| 로그인 | `supabase.auth.signInWithPassword` | `src/lib/api.js`의 `signIn`, `src/pages/LoginPage.jsx` |
| 로그아웃 | `supabase.auth.signOut` | `signOut`, `src/components/Sidebar.jsx` |
| 타임시트 조회/자동 생성 | `daily_log_entries` SELECT/INSERT | `fetchOrCreateTimesheet` |
| 타임시트 항목 수정 | `daily_log_entries` UPDATE | `updateTimesheetRow` — 마감(P0001)/승인(P0002) 잠금 에러 노출 |
| 프로젝트 자유 입력(신규 생성 포함) | `projects` SELECT/INSERT | `fetchProjects`, `createProject`, 스토어의 `setRowProjectByName` |
| 일일 보고 제출 | Edge Function `submit-daily-report` | `submitDailyReport` |
| 내 대시보드 년/월 필터 (신규) | RPC `get_member_monthly_projects` | `fetchMemberMonthlyProjects` |
| 팀장 대시보드 전체 데이터 | RPC `get_leader_weekly_report` | `fetchLeaderWeeklyReport` |
| 승인 / 피드백 | Edge Function `review-weekly-report` | `reviewProject` / `approveProject` / `requestFeedbackOnProject` |

`src/store/useAppStore.js`의 모든 액션은 `isSupabaseConfigured`로 분기합니다 —
컴포넌트는 데모/실서버 여부를 전혀 몰라도 되도록 설계했습니다.

### 아직 안 붙인 것

- **주요 이슈 및 시사점 / 업무 비중 분석**: 위에 적었듯 지금은 규칙 기반, AI 연동 시 교체 권장
- **비밀번호 재설정("비밀번호를 잊으셨나요?")**: 버튼만 있고 아직 기능 없음
  (Supabase의 `resetPasswordForEmail`로 붙이면 됩니다)
- 모달 포커스 트랩 / ESC 닫기 등 접근성 다듬기

## 역할과 화면 접근

- **팀원(member)**: `/timesheet`(타임시트 작성), `/dashboard`(내 대시보드)
- **팀장(leader)**: `/team`(팀 대시보드)
- **로그인 필수** (`/login`): 실서버 모드에서는 로그인해야 나머지 화면에 접근할 수
  있습니다. 데모 모드에서는 사이드바 하단 "데모용 역할 전환" 버튼으로 역할만
  바꿔볼 수 있습니다.

## localStorage / 배포 관련 메모

Zustand의 `persist`는 `role`, `weekId`, `selectedMonth`, `expandedMemberIds`만
`localStorage`에 저장합니다. 로그인 세션 자체는 Supabase 클라이언트가 별도로
관리하며, "아이디 저장" 체크 여부에 따라 `localStorage` 또는 `sessionStorage`를
씁니다. **이건 전부 실제 배포 환경에서 정상 동작합니다** — Claude.ai의 인앱 미리보기
아티팩트 샌드박스에서만 `localStorage`가 막혀 있고, 이 프로젝트는 Vite로 직접
빌드/배포하는 일반 React 앱이라 제약이 없습니다.
