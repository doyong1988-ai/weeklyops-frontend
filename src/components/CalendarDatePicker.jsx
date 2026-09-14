import { useEffect, useRef, useState } from 'react';

const WEEKDAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function buildMonthGrid(year, month) {
  // month is 0-indexed. Returns a flat array of { date: 'YYYY-MM-DD'|null } cells,
  // padded to start on Sunday, full weeks only.
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateStr(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * value: 'YYYY-MM-DD' | null
 * onChange: (dateStr) => void
 * label: optional custom trigger label (defaults to formatted `value`)
 */
export default function CalendarDatePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = value ? new Date(`${value}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth()); // 0-indexed

  useEffect(() => {
    if (!value) return;
    const d = new Date(`${value}T00:00:00`);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const today = new Date().toISOString().slice(0, 10);
  const cells = buildMonthGrid(viewYear, viewMonth);

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function goNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function displayLabel() {
    if (label) return label;
    if (!value) return '날짜 선택';
    const d = new Date(`${value}T00:00:00`);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${WEEKDAYS_KR[d.getDay()]})`;
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-surface-200 bg-white text-sm font-semibold text-navy-900 hover:bg-surface-50"
      >
        <span aria-hidden>📅</span>
        {displayLabel()}
        <span className="text-navy-400 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-72 rounded-xl border border-surface-200 bg-white shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={goPrevMonth} className="w-7 h-7 rounded-md hover:bg-surface-100 text-navy-500" aria-label="이전 달">
              ◂
            </button>
            <span className="text-sm font-bold text-navy-900">
              {viewYear}년 {viewMonth + 1}월
            </span>
            <button onClick={goNextMonth} className="w-7 h-7 rounded-md hover:bg-surface-100 text-navy-500" aria-label="다음 달">
              ▸
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS_KR.map((w) => (
              <div key={w} className="text-center text-[11px] font-semibold text-navy-400 py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={i} />;
              const isSelected = dateStr === value;
              const isToday = dateStr === today;
              const dayNum = Number(dateStr.slice(-2));
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    onChange(dateStr);
                    setOpen(false);
                  }}
                  className={`h-8 rounded-md text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary-500 text-white font-bold'
                      : isToday
                        ? 'bg-primary-50 text-primary-600 font-bold'
                        : 'text-navy-700 hover:bg-surface-100'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              onChange(today);
              setOpen(false);
            }}
            className="w-full mt-3 py-1.5 rounded-md text-xs font-semibold text-primary-600 hover:bg-primary-50"
          >
            오늘로 이동
          </button>
        </div>
      )}
    </div>
  );
}
