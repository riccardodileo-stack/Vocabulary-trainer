import { describe, expect, it } from '@jest/globals';

import { addDays, daysBetween } from '../dates';
import { compareByUrgency, isDue, isMastered, nextReviewDay, REVIEW_INTERVAL_DAYS, reviewBox } from '../review';
import { statsAfterAnswer } from '../word';
import { makeWord } from './helpers';

const TODAY = '2026-10-29';

describe('dates', () => {
  it('counts days across months and daylight saving', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2); // DST ends on 25 October in Europe
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(addDays('2026-02-27', 2)).toBe('2026-03-01');
  });
});

describe('spaced repetition', () => {
  it('asks new words at once', () => {
    const word = makeWord('house', ['casa']);
    expect(nextReviewDay(word)).toBeUndefined();
    expect(isDue(word, TODAY)).toBe(true);
  });

  it('waits longer after every correct answer in a row', () => {
    REVIEW_INTERVAL_DAYS.forEach((interval, streak) => {
      const answeredDay = addDays(TODAY, -interval);
      const dueNow = makeWord('house', ['casa'], { streak }, answeredDay);
      const notYet = makeWord('house', ['casa'], { streak }, addDays(answeredDay, 1));

      expect(isDue(dueNow, TODAY)).toBe(true);
      if (interval > 0) {
        expect(isDue(notYet, TODAY)).toBe(false);
      }
    });
  });

  it('caps the box and marks words as learned', () => {
    const word = makeWord('house', ['casa'], { streak: 12 }, TODAY);
    expect(reviewBox(word)).toBe(REVIEW_INTERVAL_DAYS.length - 1);
    expect(isMastered(word)).toBe(true);
    expect(isMastered(makeWord('cat', ['gatto'], { streak: 2 }, TODAY))).toBe(false);
  });

  it('sends a word back to box 0 after a wrong answer', () => {
    const stats = statsAfterAnswer({ correct: 5, wrong: 0, streak: 5 }, false);
    expect(stats).toMatchObject({ correct: 5, wrong: 1, streak: 0 });
    expect(stats.lastWrongAt).toBe(stats.lastAnsweredAt);
  });

  it('orders the most overdue words first', () => {
    const recent = makeWord('a', ['a'], { streak: 1 }, addDays(TODAY, -1)); // due today
    const old = makeWord('b', ['b'], { streak: 1 }, addDays(TODAY, -10)); // 9 days late
    const fresh = makeWord('c', ['c']); // never asked

    const sorted = [fresh, recent, old].sort(compareByUrgency(TODAY));
    expect(sorted.map((word) => word.term)).toEqual(['b', 'c', 'a']);
  });
});
