// toISOString() always converts to UTC, which is the wrong tool for "what
// calendar date is it locally right now" — in timezones ahead of UTC (e.g.
// Korea, UTC+9), that conversion can silently roll the date back by one day
// (most obviously overnight, but the underlying mismatch exists all the time
// once you start shifting dates by days/weeks). Every date-to-string
// conversion in this app should go through these local-time-safe helpers
// instead of calling .toISOString() directly.

export function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayLocalDateStr() {
  return toLocalDateStr(new Date());
}

export function todayLocalMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
