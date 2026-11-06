import { describe, expect, it } from '@jest/globals';

import { longestStreak } from '../activity';
import { computeAchievements, estimateReachedAt, missingFor, reachedTiers, tierKey, tiersEarned } from '../achievements';
import { createWord } from '../word';
import { makeWord } from './helpers';

const byId = (achievements: ReturnType<typeof computeAchievements>) =>
  Object.fromEntries(achievements.map((achievement) => [achievement.id, achievement]));

const words = (count: number) => Array.from({ length: count }, (_, i) => makeWord(`w${i}`, [`t${i}`]));

describe('achievements', () => {
  it('starts with no tier and bronze as the next goal', () => {
    const medals = computeAchievements({ words: [], bestStreak: 0, perfectQuizzes: 0 });
    expect(medals.every((medal) => medal.tier === null && medal.next?.tier === 'bronze')).toBe(true);
    expect(tiersEarned(medals)).toBe(0);
  });

  it('climbs bronze -> silver -> gold -> diamond', () => {
    const tierFor = (count: number) => byId(computeAchievements({ words: words(count), bestStreak: 0, perfectQuizzes: 0 })).words;

    expect(tierFor(19).tier).toBeNull();
    expect(tierFor(20).tier).toBe('bronze');
    expect(tierFor(100).tier).toBe('silver');
    expect(tierFor(500).tier).toBe('gold');

    const diamond = tierFor(1000);
    expect(diamond.tier).toBe('diamond');
    expect(diamond.next).toBeNull();
    expect(diamond.progress).toBe(1);
  });

  it('measures progress from the current tier to the next one', () => {
    const medal = byId(computeAchievements({ words: words(60), bestStreak: 0, perfectQuizzes: 0 })).words;
    expect(medal.tier).toBe('bronze');
    expect(medal.next).toEqual({ tier: 'silver', target: 100 });
    expect(medal.progress).toBeCloseTo((60 - 20) / (100 - 20));
  });

  it('counts learned words, correct answers, best streak and perfect quizzes', () => {
    const learned = Array.from({ length: 10 }, (_, i) => makeWord(`l${i}`, ['x'], { streak: 5, correct: 6 }));
    const medals = byId(computeAchievements({ words: learned, bestStreak: 8, perfectQuizzes: 5 }));

    expect(medals.learned.tier).toBe('bronze');
    expect(medals.answers.tier).toBe('bronze'); // 60 correct answers
    expect(medals.streak.tier).toBe('silver'); // best streak 8
    expect(medals.perfect.tier).toBe('silver');
    expect(tiersEarned(Object.values(medals))).toBe(1 + 1 + 2 + 2);
  });

  it('counts studied languages for "polyglot"', () => {
    const english = createWord({ source: 'en', target: 'it' }, { term: 'house', meanings: [] });
    const spanish = createWord({ source: 'es', target: 'it' }, { term: 'casa', meanings: [] });
    expect(byId(computeAchievements({ words: [english], bestStreak: 0, perfectQuizzes: 0 })).polyglot.tier).toBeNull();
    expect(byId(computeAchievements({ words: [english, spanish], bestStreak: 0, perfectQuizzes: 0 })).polyglot.tier).toBe(
      'bronze'
    );
  });
});

describe('longestStreak', () => {
  it('finds the longest run anywhere in the list', () => {
    expect(longestStreak([])).toBe(0);
    expect(longestStreak(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10', '2026-10-11'])).toBe(3);
    expect(longestStreak(['2026-02-28', '2026-03-01'])).toBe(2);
  });
});

describe('medal levels and dates', () => {
  it('lists the reached levels and what is missing', () => {
    const medal = computeAchievements({ words: words(120), bestStreak: 0, perfectQuizzes: 0 })[0];
    expect(reachedTiers(medal)).toEqual(['bronze', 'silver']);
    expect(missingFor(medal, 500)).toBe(380);
    expect(missingFor(medal, 20)).toBe(0);
    expect(tierKey('words', 'silver')).toBe('words:silver');
  });

  it('dates the words levels from when the N-th word was added', () => {
    const list = words(22).map((word, i) => ({ ...word, createdAt: `2026-10-${String(1 + i).padStart(2, '0')}T10:00:00.000Z` }));
    expect(estimateReachedAt('words', 20, { words: list, days: [] })).toBe('2026-10-20T10:00:00.000Z');
  });

  it('dates the streak levels from the first run long enough', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07'];
    expect(estimateReachedAt('streak', 3, { words: [], days })?.startsWith('2026-10-07')).toBe(true);
    expect(estimateReachedAt('streak', 7, { words: [], days })).toBeUndefined();
    expect(estimateReachedAt('answers', 50, { words: [], days })).toBeUndefined();
  });
});
