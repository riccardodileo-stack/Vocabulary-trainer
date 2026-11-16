// Days on which the user trained, and the streak of consecutive days.

import { addDays, dayKey, daysBetween, type DayKey } from './dates';

/** Days kept in memory: enough for a year of streak, small enough to save quickly. */
export const ACTIVITY_DAYS_KEPT = 2000;

/** Adds a day to a sorted list of days (no duplicates, oldest dropped). */
export function withDay(days: DayKey[], day: DayKey): DayKey[] {
  if (days.includes(day)) {
    return days;
  }
  return [...days, day].sort().slice(-ACTIVITY_DAYS_KEPT);
}

/** Training days in a row that earn one streak save. */
export const DAYS_PER_SAVE = 7;
/** Saves that can be kept aside at most. */
export const MAX_SAVES = 2;

export type StreakStatus = {
  /** Training days of the streak (the days covered by a save don't add to it). */
  streak: number;
  /** Saves still available. */
  saves: number;
  /** Skipped days of the current streak that a save covered. */
  savedDays: DayKey[];
  /** Training days still needed for the next save (0 when the saves are full). */
  daysToNextSave: number;
  /** Longest streak ever reached, saves included. */
  best: number;
};

/**
 * The streak with its saves. Every DAYS_PER_SAVE days in a row earn one save (MAX_SAVES at
 * most); a skipped day uses one by itself and the streak goes on. Everything is worked out
 * from the training days, so nothing else has to be stored.
 * A streak is not broken until the end of today: today is never counted as skipped.
 */
export function streakStatus(days: DayKey[], today: DayKey = dayKey()): StreakStatus {
  const sorted = [...new Set(days)].filter((day) => day <= today).sort();
  let streak = 0;
  let saves = 0;
  let savedDays: DayKey[] = [];
  let best = 0;
  let previous: DayKey | null = null;

  const cover = (from: DayKey, skipped: number) => {
    saves -= skipped;
    for (let i = 1; i <= skipped; i += 1) {
      savedDays.push(addDays(from, i));
    }
  };

  for (const day of sorted) {
    const skipped = previous ? daysBetween(previous, day) - 1 : 0;
    if (previous && skipped > 0) {
      if (skipped <= saves) {
        cover(previous, skipped);
      } else {
        streak = 0;
        savedDays = [];
      }
    }
    streak += 1;
    best = Math.max(best, streak);
    if (streak % DAYS_PER_SAVE === 0) {
      saves = Math.min(MAX_SAVES, saves + 1);
    }
    previous = day;
  }

  // Days skipped after the last training day (today can still be done)
  if (previous) {
    const skipped = Math.max(0, daysBetween(previous, today) - 1);
    if (skipped > 0 && skipped <= saves) {
      cover(previous, skipped);
    } else if (skipped > 0) {
      streak = 0;
      savedDays = [];
    }
  }

  const daysToNextSave = saves >= MAX_SAVES ? 0 : DAYS_PER_SAVE - (streak % DAYS_PER_SAVE);
  return { streak, saves, savedDays, daysToNextSave, best };
}

/** Training days in a row up to today, saves included (see streakStatus). */
export function currentStreak(days: DayKey[], today: DayKey = dayKey()): number {
  return streakStatus(days, today).streak;
}

/** Longest run of consecutive days in the list, without saves (any period, not only up to today). */
export function longestStreak(days: DayKey[]): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;

  sorted.forEach((day, index) => {
    run = index > 0 && addDays(sorted[index - 1], 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}
