import { describe, expect, it } from '@jest/globals';

import { computeAchievements } from '../achievements';
import {
  buildProfileStats,
  daysSinceTraining,
  friendAchievements,
  friendStreakToday,
  MAX_LEARNED_WORDS,
  MAX_TOPICS,
  parseFriendProfile,
  type FriendStreak,
} from '../friendProfile';
import { MASTERED_BOX } from '../review';
import type { TopicId } from '../topics';
import { makeWord } from './helpers';

const learned = { streak: MASTERED_BOX, correct: MASTERED_BOX };

describe('buildProfileStats', () => {
  it('counts words and learned words per language, most words first', () => {
    const words = [
      makeWord('apple', ['mela'], learned, '2026-11-01'),
      makeWord('pear', ['pera']),
      { ...makeWord('perro', ['cane'], learned, '2026-11-02'), sourceLang: 'es' as const },
      makeWord('plum', ['prugna']),
    ];
    const stats = buildProfileStats(words, computeAchievements({ words, bestStreak: 4, perfectQuizzes: 1 }), 'it');
    expect(stats.nativeLanguage).toBe('it');
    expect(stats.languages).toEqual([
      { code: 'en', words: 3, learned: 1 },
      { code: 'es', words: 1, learned: 1 },
    ]);
    expect(stats.medals).toMatchObject({ words: 4, learned: 2, streak: 4, perfect: 1, polyglot: 2 });
  });

  it('keeps the topics with most words and the last learned words', () => {
    const topics: TopicId[] = ['food', 'food', 'food', 'tech', 'tech', 'sport', 'home', 'work', 'people', 'school'];
    const words = topics.map((topic, i) => ({
      ...makeWord(`w${i}`, [`t${i}`], learned, `2026-10-${String(i + 10).padStart(2, '0')}`),
      topics: [topic],
    }));
    const many = Array.from({ length: 30 }, (_, i) => ({ ...makeWord(`x${i}`, ['y'], learned, '2026-09-01'), topics: [] }));
    const stats = buildProfileStats([...words, ...many], [], null);
    expect(stats.topics).toHaveLength(MAX_TOPICS);
    expect(stats.topics.slice(0, 2)).toEqual([
      { id: 'food', words: 3 },
      { id: 'tech', words: 2 },
    ]);
    expect(stats.learnedWords).toHaveLength(MAX_LEARNED_WORDS);
    // Most recently answered first
    expect(stats.learnedWords[0]).toEqual({ term: 'w9', lang: 'en' });
  });
});

describe('parseFriendProfile', () => {
  it('reads a full profile and drops invalid values', () => {
    const profile = parseFriendProfile({
      id: 'u1',
      nickname: 'bruno',
      avatar: null,
      photo_path: 'u1/a.jpg',
      friends_since: '2026-11-01T10:00:00Z',
      shared: true,
      streak: { current: 5, best: 9, saves: 1, last_training_day: '2026-11-20', as_of: '2026-11-20' },
      stats: {
        native_language: 'it',
        languages: [{ code: 'en', words: 30, learned: 4 }, { code: 'xx', words: 3 }],
        medals: { words: 30, streak: 9, hacked: 99 },
        topics: [{ id: 'food', words: 7 }, { id: 'nope', words: 1 }],
        learned_words: [{ term: 'apple', lang: 'en' }, { term: '', lang: 'en' }, 'bad'],
      },
    });
    expect(profile.photoPath).toBe('u1/a.jpg');
    expect(profile.streak).toEqual({ current: 5, best: 9, saves: 1, lastTrainingDay: '2026-11-20', asOf: '2026-11-20' });
    expect(profile.stats).toEqual({
      nativeLanguage: 'it',
      languages: [{ code: 'en', words: 30, learned: 4 }],
      medals: { words: 30, streak: 9 },
      topics: [{ id: 'food', words: 7 }],
      learnedWords: [{ term: 'apple', lang: 'en' }],
    });
  });

  it('hides everything when the friend does not share', () => {
    const profile = parseFriendProfile({ id: 'u1', nickname: 'bruno', shared: false, streak: { current: 3 }, stats: {} });
    expect(profile.shared).toBe(false);
    expect(profile.streak).toBeNull();
    expect(profile.stats).toBeNull();
  });

  it('refuses an answer without id or nickname', () => {
    expect(() => parseFriendProfile({ nickname: 'x' })).toThrow();
    expect(() => parseFriendProfile(null)).toThrow();
  });
});

describe('friendStreakToday', () => {
  const streak = (changes: Partial<FriendStreak>): FriendStreak => ({
    current: 5,
    best: 9,
    saves: 0,
    lastTrainingDay: '2026-11-20',
    asOf: '2026-11-20',
    ...changes,
  });

  it('keeps the streak today and the day after the last training', () => {
    expect(friendStreakToday(streak({}), '2026-11-20')).toBe(5);
    expect(friendStreakToday(streak({}), '2026-11-21')).toBe(5);
  });

  it('breaks it after a skipped day without saves', () => {
    expect(friendStreakToday(streak({}), '2026-11-22')).toBe(0);
  });

  it('uses the saves for skipped days', () => {
    expect(friendStreakToday(streak({ saves: 2 }), '2026-11-23')).toBe(5);
    expect(friendStreakToday(streak({ saves: 2 }), '2026-11-24')).toBe(0);
  });

  it('does not count twice the days already covered when the numbers were sent', () => {
    // Trained on the 18th, app opened on the 20th (the 19th already used a save)
    const sent = streak({ lastTrainingDay: '2026-11-18', asOf: '2026-11-20', saves: 1 });
    expect(friendStreakToday(sent, '2026-11-20')).toBe(5);
    expect(friendStreakToday(sent, '2026-11-21')).toBe(5);
    expect(friendStreakToday(sent, '2026-11-22')).toBe(0);
  });

  it('is 0 without training days or with a broken streak', () => {
    expect(friendStreakToday(streak({ lastTrainingDay: null }), '2026-11-20')).toBe(0);
    expect(friendStreakToday(streak({ current: 0 }), '2026-11-20')).toBe(0);
  });
});

describe('daysSinceTraining and friendAchievements', () => {
  it('counts the days since the last training', () => {
    const last: FriendStreak = { current: 1, best: 1, saves: 0, lastTrainingDay: '2026-11-18', asOf: '2026-11-18' };
    expect(daysSinceTraining(last, '2026-11-18')).toBe(0);
    expect(daysSinceTraining(last, '2026-11-21')).toBe(3);
    expect(daysSinceTraining(null, '2026-11-21')).toBeNull();
  });

  it('works out the levels of the friend medals', () => {
    const medals = friendAchievements({ words: 120, streak: 2 });
    const words = medals.find((medal) => medal.id === 'words');
    expect(words?.tier).toBe('silver');
    expect(medals.find((medal) => medal.id === 'streak')?.tier).toBeNull();
    expect(medals).toHaveLength(6);
  });
});
