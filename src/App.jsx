import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopNavBar from './components/TopNavBar';
import LoginPage from './pages/LoginPage';
import DailyLogPage from './pages/DailyLogPage';
import MemberDashboardPage from './pages/MemberDashboardPage';
import LeaderDashboardPage from './pages/LeaderDashboardPage';
import RoleRoute, { DEFAULT_ROUTE_BY_ROLE } from './router/RoleRoute';
import useAppStore from './store/useAppStore';
import { isSupabaseConfigured } from './lib/supabaseClient';

const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토'];
function formatTodayKorean() {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_KR[d.getDay()]})`;
}

function pageTitleFor(pathname) {
  if (pathname === '/timesheet') return `타임시트 작성 · ${formatTodayKorean()}`;
  if (pathname === '/dashboard') return '내 대시보드';
  if (pathname === '/team') return '팀 대시보드';
  return 'WeeklyOps';
}

function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const title = pageTitleFor(location.pathname);

  return (
    <div className="flex min-h-screen">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex-1 min-w-0">
        <TopNavBar title={title} onMenuClick={() => setDrawerOpen(true)} />
        {!isSupabaseConfigured && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-700 text-xs font-semibold text-center py-1.5">
            DEMO 모드 — Supabase 미연결 (.env.local에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 설정 시 실제 데이터로 전환)
          </div>
        )}
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <Routes>
            <Route
              path="/timesheet"
              element={
                <RoleRoute roles={['member']}>
                  <DailyLogPage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RoleRoute roles={['member']}>
                  <MemberDashboardPage />
                </RoleRoute>
              }
            />
            <Route
              path="/team"
              element={
                <RoleRoute roles={['leader']}>
                  <LeaderDashboardPage />
                </RoleRoute>
              }
            />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function RootRedirect() {
  const role = useAppStore((s) => s.role);
  return <Navigate to={DEFAULT_ROUTE_BY_ROLE[role]} replace />;
}

// Blocks access to the whole app (except /login) until a Supabase session is
// confirmed. In demo mode isAuthenticated is always true, so this is a no-op.
function AuthGate({ children }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const authLoading = useAppStore((s) => s.authLoading);
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <p className="text-sm text-navy-400">불러오는 중…</p>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

function RootRoutes() {
  const initSession = useAppStore((s) => s.initSession);

  useEffect(() => {
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <AuthGate>
            <AppShell />
          </AuthGate>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RootRoutes />
    </BrowserRouter>
  );
}
