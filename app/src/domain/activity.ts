// Days on which the user trained, and the streak of consecutive days.

import { addDays, dayKey, type DayKey } from './dates';

/** Days kept in memory: enough for a year of streak, small enough to save quickly. */
export const ACTIVITY_DAYS_KEPT = 400;

/** Adds a day to a sorted list of days (no duplicates, oldest dropped). */
export function withDay(days: DayKey[], day: DayKey): DayKey[] {
  if (days.includes(day)) {
    return days;
  }
  return [...days, day].sort().slice(-ACTIVITY_DAYS_KEPT);
}

/**
 * Consecutive training days up to today. A streak is not broken until the end
 * of today: if the user trained yesterday but not yet today, it still counts.
 */
export function currentStreak(days: DayKey[], today: DayKey = dayKey()): number {
  const set = new Set(days);
  let day = set.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (set.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}
