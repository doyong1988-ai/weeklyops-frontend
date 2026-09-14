import { supabase } from './supabaseClient';

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------
const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토'];

export function formatDayLabel(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  return { day: WEEKDAY_KR[d.getDay()], date: `${d.getMonth() + 1}/${d.getDate()}` };
}

// Surfaces the two custom trigger errors from schema.sql (P0001 마감 잠금,
// P0002 승인 잠금) with their own message intact; everything else gets a
// generic fallback so the UI never shows a raw stack trace.
export function friendlyError(error) {
  if (!error) return null;
  if (error.code === 'P0001' || error.code === 'P0002') return error.message;
  return error.message || '알 수 없는 오류가 발생했습니다.';
}

// supabase-js's functions.invoke() only returns a generic
// "Edge Function returned a non-2xx status code" message when a function
// responds with an error — the actual JSON body our functions send back
// (e.g. { error: "아직 입력되지 않은 시간대가 있어..." }) has to be parsed
// manually from the underlying Response object (`error.context`).
async function parseFunctionError(error) {
  if (!error) return { message: null, body: null };
  try {
    if (error.context && typeof error.context.json === 'function') {
      const body = await error.context.json();
      if (body?.error) return { message: body.error, body };
    }
  } catch {
    // response wasn't JSON, or already consumed — fall through
  }
  return { message: error.message || null, body: null };
}

// -----------------------------------------------------------------------------
// Auth / session
// -----------------------------------------------------------------------------
export async function signIn(id, password) {
  // "아이디" is entered as an email-formatted username (e.g. kim@pitap.at) —
  // Supabase Auth itself is email/password based. See LoginPage.jsx.
  const { data, error } = await supabase.auth.signInWithPassword({ email: id, password });
  return { session: data?.session ?? null, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentSession() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, name, role, role_title')
    .eq('id', user.id)
    .single();
  if (error || !profile) return null;

  return { userId: profile.id, name: profile.name, role: profile.role, roleTitle: profile.role_title };
}

// -----------------------------------------------------------------------------
// Projects (dropdown source — mock in demo mode, live table in real mode)
// -----------------------------------------------------------------------------
export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, color_hex, is_work')
    .order('created_at');
  if (error) return { projects: [], error };

  return {
    projects: (data ?? []).map((p) => ({ id: p.id, name: p.name, color: '', barColor: p.color_hex, nonWork: !p.is_work })),
    error: null,
  };
}

// Creates a new project row on the fly (used when someone types a project
// name in the timesheet that doesn't exist yet). `projects.name` has a
// unique constraint, so if two people create the same new name at almost
// the same moment, the second insert fails with a 23505 (unique_violation)
// — in that case we just fetch and return the row the first insert created,
// instead of surfacing an error for what is actually a harmless race.
export async function createProject(name) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, is_work: true })
    .select('id, name, color_hex, is_work')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existing, error: fetchError } = await supabase
        .from('projects')
        .select('id, name, color_hex, is_work')
        .eq('name', name)
        .single();
      if (!fetchError && existing) {
        return { project: { id: existing.id, name: existing.name, color: '', barColor: existing.color_hex, nonWork: !existing.is_work }, error: null };
      }
    }
    return { project: null, error };
  }

  return { project: { id: data.id, name: data.name, color: '', barColor: data.color_hex, nonWork: !data.is_work }, error: null };
}

// -----------------------------------------------------------------------------
// Daily Log (팀원 타임시트)
// -----------------------------------------------------------------------------
const DEFAULT_SLOTS = [
  ['09:00', '10:00'],
  ['10:00', '11:00'],
  ['11:00', '12:00'],
  ['12:00', '13:00'],
  ['13:00', '14:00'],
  ['14:00', '15:00'],
  ['15:00', '16:00'],
  ['16:00', '17:00'],
  ['17:00', '18:00'],
];

export async function fetchOrCreateTimesheet(userId, entryDate) {
  const { data: existing, error: fetchError } = await supabase
    .from('daily_log_entries')
    .select('id, start_time, end_time, project_id, summary, progress, ai_applied, status, projects(is_work)')
    .eq('user_id', userId)
    .eq('entry_date', entryDate)
    .order('start_time');

  if (fetchError) return { rows: [], error: fetchError };
  if (existing && existing.length > 0) return { rows: existing, error: null };

  // First visit for this date: create the 9 empty slots once. Pre-fill
  // 12:00-13:00 with the seeded '점심시간' (non-work) project so it doesn't
  // block submission — the person never has to remember to type it in.
  const { data: lunchProject } = await supabase.from('projects').select('id').eq('name', '점심시간').maybeSingle();

  const { data: created, error: insertError } = await supabase
    .from('daily_log_entries')
    .insert(
      DEFAULT_SLOTS.map(([start, end]) => ({
        user_id: userId,
        entry_date: entryDate,
        start_time: start,
        end_time: end,
        project_id: start === '12:00' ? lunchProject?.id ?? null : null,
      }))
    )
    .select('id, start_time, end_time, project_id, summary, progress, ai_applied, status, projects(is_work)');

  return { rows: created ?? [], error: insertError };
}

export async function updateTimesheetRow(rowId, patch) {
  const { data, error } = await supabase
    .from('daily_log_entries')
    .update(patch)
    .eq('id', rowId)
    .select()
    .single();
  return { row: data, error };
}

export async function submitDailyReport(entryDate) {
  const { data, error } = await supabase.functions.invoke('submit-daily-report', { body: { entryDate } });
  if (error) {
    const { message, body } = await parseFunctionError(error);
    return { result: null, error: { message: message || friendlyError(error) }, incompleteEntryIds: body?.incompleteEntryIds };
  }
  return { result: data, error: null };
}

export async function enhanceSummary(rowId, rawText) {
  const { data, error } = await supabase.functions.invoke('ai-enhance', { body: { rowId, rawText } });
  if (error) {
    const { message } = await parseFunctionError(error);
    return { suggestion: null, error: { message: message || friendlyError(error) } };
  }
  return { suggestion: data?.suggestion, error: null };
}

// -----------------------------------------------------------------------------
// Member Dashboard (년/월 필터로 동적 표시)
// -----------------------------------------------------------------------------
export async function fetchMemberMonthlyProjects(userId, monthStartISO, monthEndISO) {
  const { data, error } = await supabase.rpc('get_member_monthly_projects', {
    p_user_id: userId,
    p_month_start: monthStartISO,
    p_month_end: monthEndISO,
  });
  if (error) return { report: null, error };
  return {
    report: {
      totalHours: data?.totalHours ?? 0,
      daysSubmitted: data?.daysSubmitted ?? 0,
      avgProgress: data?.avgProgress ?? 0,
      projects: data?.projects ?? [],
    },
    error: null,
  };
}

// -----------------------------------------------------------------------------
// Leader Dashboard
// -----------------------------------------------------------------------------
export async function fetchLeaderWeeklyReport(weekStart) {
  const { data, error } = await supabase.rpc('get_leader_weekly_report', { p_week_start: weekStart });
  if (error) return { members: [], error };

  const members = (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    hours: m.hours,
    status: m.status,
    projects: (m.projects ?? []).map((p) => ({
      weeklySummaryId: p.weeklySummaryId,
      projectId: p.projectId,
      name: p.projectName,
      colorHex: p.colorHex,
      share: p.share,
      overall: p.overall,
      aiSummary: p.aiSummary,
      feedbackStatus: p.feedbackStatus,
      feedbackComment: p.feedbackComment,
      days: (p.days ?? []).map((d) => ({
        ...formatDayLabel(d.date),
        isoDate: d.date,
        progress: d.progress ?? 0,
        slots: (d.slots ?? []).map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          summary: s.summary ?? '',
          progress: s.progress ?? 0,
        })),
      })),
    })),
  }));

  return { members, error: null };
}

export async function reviewProject(weeklySummaryId, status, comment) {
  const { data, error } = await supabase.functions.invoke('review-weekly-report', {
    body: { weeklySummaryId, status, comment },
  });
  if (error) {
    const { message } = await parseFunctionError(error);
    return { result: null, error: { message: message || friendlyError(error) } };
  }
  return { result: data, error: null };
}

// 팀장이 팀원의 특정 날짜 타임시트를 "조회만" 할 때 쓰는 읽기 전용 쿼리.
// fetchOrCreateTimesheet과 달리 빈 슬롯을 새로 만들지 않습니다 — 팀장이 다른
// 사람의 타임시트에 행을 새로 끼워넣을 이유가 없기 때문입니다.
export async function fetchDailyEntriesReadOnly(userId, entryDate) {
  const { data, error } = await supabase
    .from('daily_log_entries')
    .select('id, start_time, end_time, summary, progress, status, projects(name, is_work)')
    .eq('user_id', userId)
    .eq('entry_date', entryDate)
    .order('start_time');

  if (error) return { rows: [], error };

  return {
    rows: (data ?? []).map((r) => ({
      id: r.id,
      time: `${r.start_time?.slice(0, 5)}-${r.end_time?.slice(0, 5)}`,
      projectName: r.projects?.name ?? null,
      summary: r.summary ?? '',
      progress: r.progress ?? 0,
      status: r.status,
    })),
    error: null,
  };
}
