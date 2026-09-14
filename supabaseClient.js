import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Off by default — flip VITE_AI_ENABLED=true once an Anthropic API key has
// been added to Supabase Secrets and the ai-enhance function is deployed.
// Per the current product spec, the AI 자동 보완 UI is not shown to members
// at all yet regardless of this flag — see TimesheetRow.jsx.
export const isAIEnabled = import.meta.env.VITE_AI_ENABLED === 'true';

const REMEMBER_KEY = 'weeklyops-remember-me';

// "아이디 저장" (remember me) on the login screen controls where the Supabase
// session token is kept:
//   - checked   → localStorage   (survives closing the browser)
//   - unchecked → sessionStorage (cleared when the tab/browser closes)
// setRememberPreference() must be called BEFORE signInWithPassword() so this
// adapter's setItem() call (which supabase-js makes right after a successful
// login) lands in the right place.
export function setRememberPreference(remember) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
  } catch {
    // localStorage unavailable (e.g. private mode) — default to session-only.
  }
}

function rememberIsOn() {
  try {
    return localStorage.getItem(REMEMBER_KEY) === 'true';
  } catch {
    return false;
  }
}

const rememberAwareStorage = {
  getItem: (key) => {
    try {
      return (rememberIsOn() ? localStorage : sessionStorage).getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      (rememberIsOn() ? localStorage : sessionStorage).setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

// In demo mode (no env vars set) we never construct a real client — every
// call site checks `isSupabaseConfigured` first and falls back to
// src/data/mockData.js instead. This lets the app run standalone for design
// review without a Supabase project.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { storage: rememberAwareStorage, persistSession: true, autoRefreshToken: true },
    })
  : null;

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.info(
    '[WeeklyOps] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 설정되지 않아 데모(목업) 모드로 실행됩니다.'
  );
}
