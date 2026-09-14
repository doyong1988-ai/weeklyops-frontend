import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PROJECTS, INITIAL_TIMESHEET_ROWS, TEAM_MEMBERS, MEMBER_MONTHLY_MOCK, mockGenerateAISuggestion } from '../data/mockData';
import { isSupabaseConfigured, isAIEnabled, setRememberPreference } from '../lib/supabaseClient';
import * as api from '../lib/api';

// Supabase Auth error messages are in English and shouldn't leak to the UI
// as-is. Map the couple of statuses worth distinguishing; everything else
// falls back to a generic "check your credentials" message in login().
const LOGIN_ERROR_MESSAGES = {
  400: '아이디 또는 비밀번호가 올바르지 않습니다.',
  429: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
};

function monthLabel(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return `${y}년 ${m}월`;
}

function monthRange(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const start = `${monthStr}-01`;
  const end = new Date(y, m, 0).toISOString().slice(0, 10); // last day of month
  return { start, end };
}

// --- Week helpers (weekId is always the Monday of that week, 'YYYY-MM-DD') ---
// Matches Postgres's date_trunc('week', ...) convention used on the backend,
// and is always computed relative to whatever "today" really is — no
// hardcoded dates that go stale.
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun ... 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
function shiftDate(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function formatWeekLabel(mondayStr) {
  const monday = new Date(`${mondayStr}T00:00:00`);
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${monday.getFullYear()}년 ${monday.getMonth() + 1}월 (${fmt(monday)} ~ ${fmt(friday)})`;
}

// NOTE ON PERSISTENCE — see previous note: zustand's `persist` writes to
// window.localStorage, which is fine for a real deployment and only
// unavailable inside Claude.ai's in-chat artifact preview sandbox.

function dbRowToStoreRow(dbRow) {
  return {
    id: dbRow.id,
    time: `${dbRow.start_time.slice(0, 5)}-${dbRow.end_time.slice(0, 5)}`,
    projectId: dbRow.project_id ?? '',
    summary: dbRow.summary ?? '',
    progress: dbRow.progress ?? 0,
    aiApplied: dbRow.ai_applied ?? false,
    status: dbRow.status ?? 'draft',
  };
}

const useAppStore = create(
  persist(
    (set, get) => ({
      // ------------------------------------------------------------------
      // SESSION / ROLE / AUTH
      // ------------------------------------------------------------------
      role: 'leader', // 'member' | 'leader' — drives RoleRoute
      setRole: (role) => set({ role }),
      currentUserId: null,
      currentUserName: null,
      currentUserRoleTitle: null,

      // Demo mode never requires login (there's nothing to authenticate
      // against). Real mode starts unauthenticated until initSession() finds
      // a persisted Supabase session or the person logs in.
      isAuthenticated: !isSupabaseConfigured,
      authLoading: isSupabaseConfigured, // true until the first session check resolves

      // Call once on app boot (see App.jsx). In demo mode this just seeds a
      // fake user id; in real mode it reads the logged-in Supabase session
      // (if any) and the live project list.
      initSession: async () => {
        if (!isSupabaseConfigured) {
          set({ currentUserId: 'demo-user', projects: PROJECTS, isAuthenticated: true, authLoading: false });
          return;
        }
        set({ authLoading: true });
        const session = await api.getCurrentSession();
        if (session) {
          set({
            currentUserId: session.userId,
            currentUserName: session.name,
            currentUserRoleTitle: session.roleTitle,
            role: session.role,
            isAuthenticated: true,
          });
          const { projects, error } = await api.fetchProjects();
          if (!error && projects.length > 0) set({ projects });
        } else {
          set({ isAuthenticated: false });
        }
        set({ authLoading: false });
      },

      login: async (id, password, remember) => {
        if (!isSupabaseConfigured) {
          set({ isAuthenticated: true });
          return { ok: true };
        }
        setRememberPreference(remember);
        const { error } = await api.signIn(id, password);
        if (error) return { ok: false, message: LOGIN_ERROR_MESSAGES[error.status] ?? '아이디 또는 비밀번호를 확인해주세요.' };
        await get().initSession();
        return { ok: true };
      },

      logout: async () => {
        if (isSupabaseConfigured) await api.signOut();
        set({
          isAuthenticated: !isSupabaseConfigured, // demo mode has no real logout
          currentUserId: isSupabaseConfigured ? null : 'demo-user',
          currentUserName: null,
          currentUserRoleTitle: null,
        });
      },

      // ------------------------------------------------------------------
      // PROJECTS (dropdown source for the timesheet + filters)
      // ------------------------------------------------------------------
      projects: PROJECTS,

      // ------------------------------------------------------------------
      // WEEK SELECTOR
      // weekId is the Monday date of the selected week (e.g. '2026-09-07').
      // Using the date itself (rather than a fixed lookup table) means
      // prev/next work indefinitely and the default always reflects
      // whatever "today" actually is — no stale hardcoded week.
      // ------------------------------------------------------------------
      weekId: mondayOf(new Date()),
      setWeekId: (weekId) => {
        set({ weekId });
        get().fetchLeaderReport();
      },
      goToPrevWeek: () => {
        set({ weekId: shiftDate(get().weekId, -7) });
        get().fetchLeaderReport();
      },
      goToNextWeek: () => {
        set({ weekId: shiftDate(get().weekId, 7) });
        get().fetchLeaderReport();
      },
      getCurrentWeekLabel: () => formatWeekLabel(get().weekId),
      getCurrentWeekStart: () => get().weekId,

      // ------------------------------------------------------------------
      // MEMBER DASHBOARD — 년/월 필터 (동적 프로젝트 목록)
      // ------------------------------------------------------------------
      selectedMonth: new Date().toISOString().slice(0, 7), // 오늘 기준 YYYY-MM
      setSelectedMonth: (monthStr) => {
        set({ selectedMonth: monthStr });
        get().fetchMemberMonthlyReport();
      },
      goToPrevMonth: () => {
        const [y, m] = get().selectedMonth.split('-').map(Number);
        const d = new Date(y, m - 2, 1); // m is 1-indexed; -2 = go back one month
        set({ selectedMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
        get().fetchMemberMonthlyReport();
      },
      goToNextMonth: () => {
        const [y, m] = get().selectedMonth.split('-').map(Number);
        const d = new Date(y, m, 1); // m is 1-indexed; this = next month
        set({ selectedMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
        get().fetchMemberMonthlyReport();
      },
      getSelectedMonthLabel: () => monthLabel(get().selectedMonth),

      memberMonthlyReport: null,
      memberMonthlyLoading: false,
      memberMonthlyError: null,

      fetchMemberMonthlyReport: async () => {
        set({ memberMonthlyLoading: true, memberMonthlyError: null });
        if (!isSupabaseConfigured) {
          set({ memberMonthlyReport: MEMBER_MONTHLY_MOCK, memberMonthlyLoading: false });
          return;
        }
        const userId = get().currentUserId;
        if (!userId) {
          set({ memberMonthlyLoading: false });
          return;
        }
        const { start, end } = monthRange(get().selectedMonth);
        const { report, error } = await api.fetchMemberMonthlyProjects(userId, start, end);
        set({
          memberMonthlyReport: error ? get().memberMonthlyReport : report,
          memberMonthlyError: error ? api.friendlyError(error) : null,
          memberMonthlyLoading: false,
        });
      },

      // ------------------------------------------------------------------
      // LEADER DASHBOARD FILTERS
      // ------------------------------------------------------------------
      filters: { projectId: 'all', memberId: 'all', search: '' },
      setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
      resetFilters: () => set({ filters: { projectId: 'all', memberId: 'all', search: '' } }),

      // ------------------------------------------------------------------
      // LEADER DASHBOARD DATA (real: RPC get_leader_weekly_report / demo: mock)
      // ------------------------------------------------------------------
      leaderMembers: [],
      leaderLoading: false,
      leaderError: null,

      fetchLeaderReport: async () => {
        set({ leaderLoading: true, leaderError: null });
        if (!isSupabaseConfigured) {
          set({ leaderMembers: TEAM_MEMBERS, leaderLoading: false });
          return;
        }
        const weekStart = get().getCurrentWeekStart();
        const { members, error } = await api.fetchLeaderWeeklyReport(weekStart);
        set({
          leaderMembers: error ? get().leaderMembers : members,
          leaderError: error ? api.friendlyError(error) : null,
          leaderLoading: false,
        });
      },

      getFilteredMembers: () => {
        const { projectId, memberId, search } = get().filters;
        const term = search.trim().toLowerCase();
        return get()
          .leaderMembers.filter((m) => memberId === 'all' || m.id === memberId)
          .filter((m) => !term || m.name.toLowerCase().includes(term))
          .map((m) => ({
            ...m,
            projects: projectId === 'all' ? m.projects : m.projects.filter((p) => p.projectId === projectId),
          }))
          .filter((m) => projectId === 'all' || m.projects.length > 0 || m.status === '미작성');
      },

      // ------------------------------------------------------------------
      // ACCORDION EXPAND/COLLAPSE
      // ------------------------------------------------------------------
      expandedMemberIds: ['kimdohyun'],
      toggleMemberExpanded: (memberId) =>
        set((state) => ({
          expandedMemberIds: state.expandedMemberIds.includes(memberId)
            ? state.expandedMemberIds.filter((id) => id !== memberId)
            : [...state.expandedMemberIds, memberId],
        })),

      // ------------------------------------------------------------------
      // 승인 / 피드백 (per project weekly_summary)
      // ------------------------------------------------------------------
      reviewProject: async (weeklySummaryId, status, comment) => {
        if (!isSupabaseConfigured) {
          set((state) => ({
            leaderMembers: state.leaderMembers.map((m) => ({
              ...m,
              projects: m.projects.map((p) =>
                p.weeklySummaryId === weeklySummaryId
                  ? { ...p, feedbackStatus: status, feedbackComment: comment ?? null }
                  : p
              ),
            })),
          }));
          return { ok: true };
        }
        const { error } = await api.reviewProject(weeklySummaryId, status, comment);
        if (error) return { ok: false, message: api.friendlyError(error) };
        await get().fetchLeaderReport();
        return { ok: true };
      },
      approveProject: (weeklySummaryId) => get().reviewProject(weeklySummaryId, 'approved'),
      requestFeedbackOnProject: (weeklySummaryId, comment) =>
        get().reviewProject(weeklySummaryId, 'feedback_requested', comment),

      // ------------------------------------------------------------------
      // TIMESHEET (Daily Log)
      // ------------------------------------------------------------------
      timesheetDate: new Date().toISOString().slice(0, 10), // 오늘 날짜 (YYYY-MM-DD)
      timesheetRows: INITIAL_TIMESHEET_ROWS,
      timesheetLoading: false,
      timesheetError: null,

      fetchTimesheet: async (date) => {
        const entryDate = date ?? get().timesheetDate;
        set({ timesheetLoading: true, timesheetError: null, timesheetDate: entryDate });

        if (!isSupabaseConfigured) {
          set({ timesheetRows: INITIAL_TIMESHEET_ROWS, timesheetLoading: false });
          return;
        }
        const userId = get().currentUserId;
        if (!userId) {
          set({ timesheetLoading: false });
          return;
        }
        const { rows, error } = await api.fetchOrCreateTimesheet(userId, entryDate);
        set({
          timesheetRows: error ? get().timesheetRows : rows.map(dbRowToStoreRow),
          timesheetError: error ? api.friendlyError(error) : null,
          timesheetLoading: false,
        });
      },

      // 팀원이 프로젝트명을 직접 타이핑했을 때: 기존 프로젝트와 이름이 같으면
      // 그 프로젝트로 연결하고, 없으면 새 프로젝트를 즉석에서 만들어 연결한다.
      setRowProjectByName: async (rowId, rawName) => {
        const name = rawName.trim();
        if (!name) {
          get().updateTimesheetRow(rowId, { projectId: '' });
          return;
        }

        const existing = get().projects.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          get().updateTimesheetRow(rowId, {
            projectId: existing.id,
            ...(existing.nonWork ? { summary: '', progress: 0, aiApplied: false } : {}),
          });
          return;
        }

        if (!isSupabaseConfigured) {
          const localProject = { id: `local-${Date.now()}`, name, color: '', barColor: '#94A3B8', nonWork: false };
          set((state) => ({ projects: [...state.projects, localProject] }));
          get().updateTimesheetRow(rowId, { projectId: localProject.id });
          return;
        }

        const { project, error } = await api.createProject(name);
        if (error || !project) {
          set({ timesheetError: api.friendlyError(error) || '프로젝트를 만들지 못했습니다.' });
          return;
        }
        set((state) => ({ projects: [...state.projects, project] }));
        get().updateTimesheetRow(rowId, { projectId: project.id });
      },

      updateTimesheetRow: async (rowId, patch) => {
        // Optimistic UI update first so sliders/inputs feel instant.
        set((state) => ({
          timesheetRows: state.timesheetRows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
        }));
        if (!isSupabaseConfigured) return;

        const dbPatch = {};
        if ('projectId' in patch) dbPatch.project_id = patch.projectId || null;
        if ('summary' in patch) dbPatch.summary = patch.summary;
        if ('progress' in patch) dbPatch.progress = patch.progress;
        if ('aiApplied' in patch) dbPatch.ai_applied = patch.aiApplied;

        const { error } = await api.updateTimesheetRow(rowId, dbPatch);
        if (error) {
          // Most likely the P0001(마감 잠금) / P0002(승인 잠금) triggers from
          // schema.sql. Surface the message and re-sync from the server so
          // the optimistic edit doesn't silently drift from reality.
          set({ timesheetError: api.friendlyError(error) });
          get().fetchTimesheet();
        }
      },

      submitDailyReport: async () => {
        if (!isSupabaseConfigured) {
          set((state) => ({
            timesheetRows: state.timesheetRows.map((r) => (r.projectId ? { ...r, status: 'submitted' } : r)),
          }));
          return { ok: true };
        }
        const { error, incompleteEntryIds } = await api.submitDailyReport(get().timesheetDate);
        if (error) return { ok: false, message: api.friendlyError(error), incompleteEntryIds };
        await get().fetchTimesheet();
        return { ok: true };
      },

      // ------------------------------------------------------------------
      // AI 자동 보완 — state machine: idle -> loading -> comparing -> (applied|idle)
      //                                                     \-> error -> (retry)
      // ------------------------------------------------------------------
      aiModal: { open: false, status: 'idle', rowId: null, original: '', suggestion: '', error: null },

      _runAIEnhance: async (rowId, rawText) => {
        if (!isSupabaseConfigured) {
          await new Promise((resolve) => setTimeout(resolve, 900));
          const current = get().aiModal;
          if (current.rowId !== rowId) return; // modal moved on to a different row
          set({ aiModal: { ...current, status: 'comparing', suggestion: mockGenerateAISuggestion(rowId, rawText) } });
          return;
        }
        const { suggestion, error } = await api.enhanceSummary(rowId, rawText);
        const current = get().aiModal;
        if (current.rowId !== rowId) return;
        if (error || !suggestion) {
          set({ aiModal: { ...current, status: 'error', error: api.friendlyError(error) || 'AI 응답을 받지 못했습니다.' } });
          return;
        }
        set({ aiModal: { ...current, status: 'comparing', suggestion, error: null } });
      },

      openAIModal: (rowId) => {
        if (!isAIEnabled) return; // feature flag off — see .env.example
        const row = get().timesheetRows.find((r) => r.id === rowId);
        const project = get().projects.find((p) => p.id === row?.projectId);
        if (!row || project?.nonWork) return; // guard: never open for non-work slots
        set({ aiModal: { open: true, status: 'loading', rowId, original: row.summary, suggestion: '', error: null } });
        get()._runAIEnhance(rowId, row.summary);
      },

      regenerateAISuggestion: () => {
        const { rowId, original } = get().aiModal;
        if (!rowId) return;
        set((state) => ({ aiModal: { ...state.aiModal, status: 'loading', suggestion: '', error: null } }));
        get()._runAIEnhance(rowId, original);
      },

      applyAISuggestion: () => {
        const { rowId, suggestion } = get().aiModal;
        if (!rowId) return;
        get().updateTimesheetRow(rowId, { summary: suggestion, aiApplied: true });
        set({ aiModal: { open: false, status: 'idle', rowId: null, original: '', suggestion: '', error: null } });
      },

      closeAIModal: () =>
        set({ aiModal: { open: false, status: 'idle', rowId: null, original: '', suggestion: '', error: null } }),
    }),
    {
      name: 'weeklyops-store', // localStorage key — fine in production, see note above
      partialize: (state) => ({
        role: state.role,
        weekId: state.weekId,
        expandedMemberIds: state.expandedMemberIds,
      }),
    }
  )
);

export default useAppStore;
