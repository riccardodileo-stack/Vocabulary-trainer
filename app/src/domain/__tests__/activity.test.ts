import { describe, expect, it } from '@jest/globals';

import { ACTIVITY_DAYS_KEPT, currentStreak, streakStatus, withDay } from '../activity';
import { addDays } from '../dates';

/** `count` days in a row starting from `first`. */
const run = (first: string, count: number) => Array.from({ length: count }, (_, i) => addDays(first, i));

describe('activity streak', () => {
  it('counts consecutive days up to today', () => {
    expect(currentStreak(['2026-10-27', '2026-10-28', '2026-10-29'], '2026-10-29')).toBe(3);
  });

  it('is not broken until the end of today', () => {
    expect(currentStreak(['2026-10-27', '2026-10-28'], '2026-10-29')).toBe(2);
  });

  it('restarts after a missed day', () => {
    expect(currentStreak(['2026-10-25', '2026-10-27'], '2026-10-29')).toBe(0);
    expect(currentStreak([], '2026-10-29')).toBe(0);
  });

  it('keeps days sorted, unique and limited', () => {
    expect(withDay(['2026-10-28'], '2026-10-28')).toEqual(['2026-10-28']);
    expect(withDay(['2026-10-29'], '2026-10-28')).toEqual(['2026-10-28', '2026-10-29']);

    const many = Array.from({ length: ACTIVITY_DAYS_KEPT }, (_, i) => `2025-${String(i).padStart(5, '0')}`);
    expect(withDay(many, '2026-10-29')).toHaveLength(ACTIVITY_DAYS_KEPT);
  });
});

describe('streak saves', () => {
  it('earns one save every 7 days in a row, two at most', () => {
    expect(streakStatus(run('2026-10-01', 6), '2026-10-06')).toMatchObject({ streak: 6, saves: 0, daysToNextSave: 1 });
    expect(streakStatus(run('2026-10-01', 7), '2026-10-07')).toMatchObject({ streak: 7, saves: 1, daysToNextSave: 7 });
    expect(streakStatus(run('2026-10-01', 30), '2026-10-30')).toMatchObject({ streak: 30, saves: 2, daysToNextSave: 0 });
  });

  it('uses a save for a skipped day and the streak goes on', () => {
    // 7 days, the 8th skipped, then one more day
    const days = [...run('2026-10-01', 7), '2026-10-09'];
    expect(streakStatus(days, '2026-10-09')).toMatchObject({ streak: 8, saves: 0, savedDays: ['2026-10-08'], best: 8 });
  });

  it('covers yesterday when today is still to be done', () => {
    const status = streakStatus(run('2026-10-01', 7), '2026-10-09');
    expect(status).toMatchObject({ streak: 7, saves: 0, savedDays: ['2026-10-08'] });
  });

  it('breaks the streak when the saves are not enough', () => {
    // One save, two days skipped
    expect(streakStatus(run('2026-10-01', 7), '2026-10-10')).toMatchObject({ streak: 0, saves: 1, savedDays: [] });
    expect(streakStatus([...run('2026-10-01', 7), '2026-10-10'], '2026-10-10')).toMatchObject({ streak: 1, saves: 1 });
  });

  it('ignores days after today', () => {
    expect(streakStatus(['2026-10-01', '2026-10-05'], '2026-10-01').streak).toBe(1);
  });
});
