// Spaced repetition (Leitner system).
//
// Every correct answer in a row moves a word to the next "box"; every box waits
// longer before the word is asked again. A wrong answer sends it back to box 0.
// The box is simply the word's current streak, so no extra data is stored.
//
//   box (streak):    0     1     2     3     4     5+
//   wait (days):     0     1     2     4     8     16
//
// A word that was never asked is due at once.

import { addDays, daysBetween, dayKey, dayKeyOf, type DayKey } from './dates';
import type { Word } from './word';

export const REVIEW_INTERVAL_DAYS = [0, 1, 2, 4, 8, 16] as const;

/** Box from which a word counts as "learned" in the stats. */
export const MASTERED_BOX = REVIEW_INTERVAL_DAYS.length - 1;

export function reviewBox(word: Word): number {
  return Math.min(word.stats.streak, MASTERED_BOX);
}

export function isMastered(word: Word): boolean {
  return reviewBox(word) >= MASTERED_BOX;
}

export function isNew(word: Word): boolean {
  return word.stats.lastAnsweredAt === undefined;
}

/** The day the word should be asked again, or undefined if it was never asked. */
export function nextReviewDay(word: Word): DayKey | undefined {
  const { lastAnsweredAt } = word.stats;
  if (!lastAnsweredAt) {
    return undefined;
  }
  return addDays(dayKeyOf(lastAnsweredAt), REVIEW_INTERVAL_DAYS[reviewBox(word)]);
}

export function isDue(word: Word, today: DayKey = dayKey()): boolean {
  const next = nextReviewDay(word);
  return next === undefined || daysBetween(today, next) <= 0;
}

/** Most overdue first; new words after overdue ones, so old words are not forgotten. */
export function compareByUrgency(today: DayKey) {
  const overdue = (word: Word) => {
    const next = nextReviewDay(word);
    return next === undefined ? 0 : daysBetween(next, today);
  };
  return (a: Word, b: Word) => overdue(b) - overdue(a);
}
