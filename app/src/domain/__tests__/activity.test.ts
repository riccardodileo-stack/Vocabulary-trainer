import { describe, expect, it } from '@jest/globals';

import { ACTIVITY_DAYS_KEPT, currentStreak, withDay } from '../activity';

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
