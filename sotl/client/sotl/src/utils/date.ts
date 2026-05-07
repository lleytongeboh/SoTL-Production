export function parseDueToISO(dueText?: string): string | null {
  const raw = (dueText || "").trim();
  if (!raw) return null;

  const now = new Date();

  // If user includes a year (e.g., 10 Jan 2026 / 2026-01-10), trust native parse
  const hasYear = /\b(19|20)\d{2}\b/.test(raw);
  if (hasYear) {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Parse formats like "10 Jan", "10 January", "Jan 10", "10/1", "10-1"
  // 1) "10 Jan" or "Jan 10"
  const m1 = raw.match(/^(\d{1,2})\s*([A-Za-z]{3,})$/);
  const m1Rev = raw.match(/^([A-Za-z]{3,})\s*(\d{1,2})$/);
  // 2) "10/1" or "10-1"
  const m2 = raw.match(/^(\d{1,2})[\/\-](\d{1,2})$/);

  let day: number | null = null;
  let month: number | null = null; // 0-11

  const months: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  if (m1) {
    day = Number(m1[1]);
    const mon = m1[2].toLowerCase();
    month = months[mon] ?? null;
  } else if (m1Rev) {
    const mon = m1Rev[1].toLowerCase();
    day = Number(m1Rev[2]);
    month = months[mon] ?? null;
  } else if (m2) {
    day = Number(m2[1]);
    month = Number(m2[2]) - 1; // assume DD/MM
  }

  if (day == null || month == null || day < 1 || day > 31 || month < 0 || month > 11) {
    // As a last attempt, try native parse; if fails, return null
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Build date in local time with current year
  let year = now.getFullYear();
  let candidate = new Date(year, month, day, 23, 59, 0, 0); // end-of-day

  // If candidate is before "now", bump to next year
  if (candidate.getTime() < now.getTime()) {
    year += 1;
    candidate = new Date(year, month, day, 23, 59, 0, 0);
  }

  return candidate.toISOString();
}

export function formatDueCompact(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDueChatbox(iso?: string) {
  if (!iso) return 'No deadline';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);

  const day = d.getDate();
  const suffix = day % 10 === 1 && day % 100 !== 11
    ? 'st'
    : day % 10 === 2 && day % 100 !== 12
      ? 'nd'
      : day % 10 === 3 && day % 100 !== 13
        ? 'rd'
        : 'th';
  const month = d.toLocaleDateString(undefined, { month: 'long' });
  const year = d.getFullYear();

  return `${day}${suffix} ${month} ${year}`;
}

// Matches inner handleSend() formatDue(iso: string)
export function formatDueLocal(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

// Matches inner handleSend() formatDuePretty(iso?: string)
export function formatDuePretty(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

// Matches TEAM formatDue(iso?: string) returning '—' on invalid
export function formatDueOrDash(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

// Check if a task is overdue
export function isOverdue(dueAt?: string, status?: string): boolean {
  if (!dueAt) return false;
  if (status === 'done' || status === 'cancelled') return false;
  const due = new Date(dueAt);
  const now = new Date();
  return due.getTime() < now.getTime();
}

// Calculate days overdue (returns 0 if not overdue)
export function daysOverdue(dueAt?: string, status?: string): number {
  if (!isOverdue(dueAt, status)) return 0;
  const due = new Date(dueAt!);
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
