export default function TopNavBar({ title, onMenuClick }) {
  return (
    <>
      {/* Mobile bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-navy-800 text-white flex items-center justify-between px-4 py-3">
        <button onClick={onMenuClick} className="p-1 -ml-1" aria-label="메뉴 열기">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <span className="font-bold text-sm truncate max-w-[60%]">{title}</span>
        <div className="w-8 h-8 rounded-full bg-primary-500 shrink-0" />
      </div>

      {/* Desktop bar */}
      <header className="hidden lg:flex items-center justify-between px-8 h-16 bg-white border-b border-surface-200">
        <h1 className="text-base font-bold text-navy-900">{title}</h1>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1.5 rounded-full bg-primary-50 text-primary-600 text-xs font-medium">
            AI 요약 완료
          </span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-500" />
            <span className="text-sm font-medium">김도현</span>
          </div>
        </div>
      </header>
    </>
  );
}
