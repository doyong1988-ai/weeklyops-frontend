import { useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { isSupabaseConfigured } from '../lib/supabaseClient';

// Nav items declare which role(s) can see them. This is the single source of
// truth consumed both here (what renders) and by RoleRoute (what's allowed).
export const NAV_ITEMS = [
  { to: '/timesheet', label: '타임시트 작성', roles: ['member'] },
  { to: '/dashboard', label: '내 대시보드', roles: ['member'] },
  { to: '/team', label: '팀 대시보드', roles: ['leader'] },
];

export default function Sidebar({ open, onClose }) {
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const currentUserName = useAppStore((s) => s.currentUserName);
  const currentUserRoleTitle = useAppStore((s) => s.currentUserRoleTitle);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const displayName = currentUserName ?? '김도현';
  const displayRoleTitle = currentUserRoleTitle ?? (role === 'leader' ? '팀장' : '팀원');

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 md:w-20 lg:w-64 bg-navy-800 text-white
          flex flex-col shrink-0 transition-transform duration-200
          lg:static lg:translate-x-0 lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="px-6 md:px-0 md:text-center lg:px-6 lg:text-left py-6">
          <span className="font-bold text-lg tracking-wide md:hidden lg:inline">PITAPAT</span>
          <span className="hidden md:inline lg:hidden font-bold text-lg">P</span>
        </div>

        {/* 로그인 정보 (프로필) */}
        <div className="flex items-center gap-2.5 px-6 md:px-0 md:justify-center lg:justify-start lg:px-6 py-3.5 border-y border-white/8">
          <div className="w-8 h-8 rounded-full bg-primary-500 shrink-0" />
          <div className="md:hidden lg:block min-w-0">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{displayRoleTitle}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 pt-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 md:px-0 md:justify-center lg:justify-start lg:px-6 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-500 text-white' : 'text-slate-300 hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-white' : 'bg-slate-400'}`} />
                  <span className="md:hidden lg:inline">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {isSupabaseConfigured ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-6 md:px-0 md:justify-center lg:justify-start lg:px-6 py-4 text-sm font-medium text-slate-300 hover:text-white border-t border-white/8"
          >
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span className="md:hidden lg:inline">로그아웃</span>
          </button>
        ) : (
          // 데모 모드 전용 역할 전환 — 실제 배포(Supabase 연결) 시에는 로그인한
          // 계정의 role이 그대로 쓰이므로 이 버튼 대신 위 로그아웃 버튼이 보입니다.
          <div className="px-4 md:px-2 lg:px-4 pt-4 pb-4 border-t border-white/10">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-2 md:hidden lg:block">
              데모용 역할 전환
            </p>
            <div className="flex md:flex-col lg:flex-row gap-1">
              <button
                onClick={() => setRole('member')}
                className={`flex-1 text-xs font-semibold rounded-md py-1.5 ${
                  role === 'member' ? 'bg-white text-navy-800' : 'bg-white/10 text-slate-300'
                }`}
              >
                팀원
              </button>
              <button
                onClick={() => setRole('leader')}
                className={`flex-1 text-xs font-semibold rounded-md py-1.5 ${
                  role === 'leader' ? 'bg-white text-navy-800' : 'bg-white/10 text-slate-300'
                }`}
              >
                팀장
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
