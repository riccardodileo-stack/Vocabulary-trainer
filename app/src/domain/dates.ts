// Calendar days as "YYYY-MM-DD" strings in the phone's time zone.
// Days (not timestamps) are what matter for daily words, reviews and streaks:
// a word reviewed at 23:50 is "due tomorrow" at 00:10, not 24 hours later.

export type DayKey = string;

export function dayKey(date: Date = new Date()): DayKey {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Day of an ISO timestamp, e.g. a word's lastAnsweredAt. */
export function dayKeyOf(isoDate: string): DayKey {
  return dayKey(new Date(isoDate));
}

function dayToUtc(key: DayKey): number {
  const [year, month, day] = key.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). Safe across daylight saving changes. */
export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((dayToUtc(to) - dayToUtc(from)) / 86_400_000);
}

export function addDays(key: DayKey, days: number): DayKey {
  const date = new Date(dayToUtc(key) + days * 86_400_000);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}
