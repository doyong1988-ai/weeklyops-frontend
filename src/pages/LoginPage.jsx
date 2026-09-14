import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function LoginPage() {
  const login = useAppStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!id.trim() || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await login(id.trim(), password, remember);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    const redirectTo = location.state?.from ?? '/';
    navigate(redirectTo, { replace: true });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{
        background: 'linear-gradient(135deg, #AD40D9 0%, #3730A3 40%, #0B1020 100%)',
      }}
    >
      {/* Glow orbs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 700, height: 700, top: -250, left: -200, background: '#8C40F2', opacity: 0.35, filter: 'blur(160px)' }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 800, height: 800, bottom: -350, right: -200, background: '#334DF2', opacity: 0.3, filter: 'blur(180px)' }}
      />

      {/* Hairline frame (brand motif) */}
      <div className="absolute inset-10 border border-white/25 pointer-events-none" />

      <div className="relative flex flex-col items-center gap-9 w-full max-w-md">
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-2.5">
          <span className="text-white font-bold text-4xl tracking-[4px]">PITAPAT</span>
          <span className="text-white/60 text-sm tracking-wide">주간보고 자동화 시스템 · WeeklyOps</span>
        </div>

        {/* Glass card */}
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl border border-white/16 px-10 py-9 space-y-5"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <div className="space-y-1">
            <h1 className="text-white text-xl font-bold">로그인</h1>
            <p className="text-white/60 text-sm">피터패트 팀 계정으로 로그인하세요</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/15 border border-red-400/30 px-3 py-2 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-white/75 text-xs font-semibold" htmlFor="login-id">
              아이디
            </label>
            <input
              id="login-id"
              type="text"
              autoComplete="username"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full rounded-lg border border-white/18 px-3.5 py-3 text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#ffffff' }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/75 text-xs font-semibold" htmlFor="login-password">
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/18 px-3.5 py-3 text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#ffffff' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-white/75 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500"
              />
              아이디 저장
            </label>
            <button type="button" className="text-white/65 text-xs underline hover:text-white">
              비밀번호를 잊으셨나요?
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-3.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: '#4A33D9' }}
          >
            {submitting ? '로그인 중…' : '로그인'}
          </button>

          <p className="text-center text-white/45 text-xs">계정이 없으신가요? 관리자에게 문의해주세요</p>
        </form>
      </div>
    </div>
  );
}
