// Profile of a friend: the summary of the user's studies sent to the server (only a summary,
// never the whole vocabulary) and the friend's profile read back from it.
// Pure functions only (tested); the calls are in services/profileStats.ts.
// See supabase/migrations/*_friend_profiles.sql on the `server` branch.

import { ACHIEVEMENT_RULES, computeAchievement, type Achievement, type AchievementId } from './achievements';
import { daysBetween, type DayKey } from './dates';
import { isLanguageCode, type LanguageCode } from './languages';
import { isMastered } from './review';
import { isTopicId, type TopicId } from './topics';
import type { Word } from './word';

/** Topics with the most words shown to friends. */
export const MAX_TOPICS = 5;
/** Last learned words shown to friends. */
export const MAX_LEARNED_WORDS = 20;
/** Longer terms are cut: the summary must stay small (the server refuses big ones). */
export const MAX_TERM_LENGTH = 40;

export type LanguageSummary = { code: LanguageCode; words: number; learned: number };
export type TopicSummary = { id: TopicId; words: number };
export type LearnedWord = { term: string; lang: LanguageCode };
/** Value of each medal ("words": 320); the levels are worked out with the app's targets. */
export type MedalValues = Partial<Record<AchievementId, number>>;

/** What friends can see of the user's studies (table profile_stats). */
export type ProfileStats = {
  nativeLanguage: LanguageCode | null;
  /** Studied languages, most words first. */
  languages: LanguageSummary[];
  medals: MedalValues;
  /** Topics with the most words, at most MAX_TOPICS. */
  topics: TopicSummary[];
  /** Last learned words, most recent first, at most MAX_LEARNED_WORDS. */
  learnedWords: LearnedWord[];
};

export function buildProfileStats(
  words: Word[],
  achievements: Achievement[],
  nativeLanguage: LanguageCode | null
): ProfileStats {
  const byLanguage = new Map<LanguageCode, LanguageSummary>();
  const byTopic = new Map<TopicId, number>();

  for (const word of words) {
    const summary = byLanguage.get(word.sourceLang) ?? { code: word.sourceLang, words: 0, learned: 0 };
    summary.words += 1;
    if (isMastered(word)) {
      summary.learned += 1;
    }
    byLanguage.set(word.sourceLang, summary);
    for (const topic of word.topics) {
      byTopic.set(topic, (byTopic.get(topic) ?? 0) + 1);
    }
  }

  const languages = [...byLanguage.values()].sort((a, b) => b.words - a.words || a.code.localeCompare(b.code));
  const topics = [...byTopic.entries()]
    .map(([id, count]) => ({ id, words: count }))
    .sort((a, b) => b.words - a.words || a.id.localeCompare(b.id))
    .slice(0, MAX_TOPICS);

  // Most recent first: the last answer is when the word became learned (or later)
  const when = (word: Word) => word.stats.lastAnsweredAt ?? word.createdAt;
  const learnedWords = words
    .filter(isMastered)
    .sort((a, b) => when(b).localeCompare(when(a)))
    .slice(0, MAX_LEARNED_WORDS)
    .map((word) => ({ term: word.term.slice(0, MAX_TERM_LENGTH), lang: word.sourceLang }));

  const medals: MedalValues = {};
  for (const achievement of achievements) {
    medals[achievement.id] = achievement.value;
  }

  return { nativeLanguage, languages, medals, topics, learnedWords };
}

/** The streak of a friend as the server keeps it (table streaks). */
export type FriendStreak = {
  current: number;
  best: number;
  saves: number;
  lastTrainingDay: DayKey | null;
  /** The friend's day when the numbers were worked out. */
  asOf: DayKey | null;
};

/** One friend as friend_profile() returns it. stats and streak are null when hidden or never sent. */
export type FriendProfile = {
  id: string;
  nickname: string;
  avatar: string | null;
  photoPath: string | null;
  friendsSince: string | null;
  /** false = the friend hides their stats. */
  shared: boolean;
  streak: FriendStreak | null;
  stats: ProfileStats | null;
};

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
const count = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);
const text = (value: unknown): string | null => (typeof value === 'string' && value.length > 0 ? value : null);
const day = (value: unknown): DayKey | null => {
  const key = text(value);
  return key && /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
};
const list = (value: unknown): Json[] => (Array.isArray(value) ? value.filter(isObject) : []);

function parseStats(value: unknown): ProfileStats | null {
  if (!isObject(value)) {
    return null;
  }
  const medals: MedalValues = {};
  if (isObject(value.medals)) {
    for (const rule of ACHIEVEMENT_RULES) {
      if (rule.id in value.medals) {
        medals[rule.id] = count(value.medals[rule.id]);
      }
    }
  }
  return {
    nativeLanguage: isLanguageCode(value.native_language) ? value.native_language : null,
    languages: list(value.languages).flatMap((item) =>
      isLanguageCode(item.code) ? [{ code: item.code, words: count(item.words), learned: count(item.learned) }] : []
    ),
    medals,
    topics: list(value.topics)
      .flatMap((item) => (isTopicId(item.id) ? [{ id: item.id, words: count(item.words) }] : []))
      .slice(0, MAX_TOPICS),
    learnedWords: list(value.learned_words)
      .flatMap((item) => {
        const term = text(item.term);
        return term && isLanguageCode(item.lang) ? [{ term: term.slice(0, MAX_TERM_LENGTH), lang: item.lang }] : [];
      })
      .slice(0, MAX_LEARNED_WORDS),
  };
}

function parseStreak(value: unknown): FriendStreak | null {
  if (!isObject(value)) {
    return null;
  }
  return {
    current: count(value.current),
    best: count(value.best),
    saves: count(value.saves),
    lastTrainingDay: day(value.last_training_day),
    asOf: day(value.as_of),
  };
}

/** Reads what the server sent, keeping only valid values (it was written by another phone). */
export function parseFriendProfile(data: unknown): FriendProfile {
  if (!isObject(data) || !text(data.id) || !text(data.nickname)) {
    throw new Error('Unexpected friend profile');
  }
  const shared = data.shared !== false;
  return {
    id: data.id as string,
    nickname: data.nickname as string,
    avatar: text(data.avatar),
    photoPath: text(data.photo_path),
    friendsSince: text(data.friends_since),
    shared,
    streak: shared ? parseStreak(data.streak) : null,
    stats: shared ? parseStats(data.stats) : null,
  };
}

/**
 * The friend's streak today. The server has the numbers of the last time their app was open:
 * since then each day without training uses a save, and with no saves left the streak is
 * broken. Today itself never breaks it (the friend can still train).
 */
export function friendStreakToday(streak: FriendStreak, today: DayKey): number {
  const { current, saves, lastTrainingDay, asOf } = streak;
  if (!lastTrainingDay || current === 0) {
    return 0;
  }
  // Days already counted in the numbers: up to as_of (that day was still "today")
  const counted = asOf && asOf > lastTrainingDay ? asOf : lastTrainingDay;
  const firstUncounted = counted === lastTrainingDay ? 1 : 0;
  const missed = Math.max(0, daysBetween(counted, today) - firstUncounted);
  return missed <= saves ? current : 0;
}

/** Days since the friend last trained (0 = today), or null if never. */
export function daysSinceTraining(streak: FriendStreak | null, today: DayKey): number | null {
  if (!streak?.lastTrainingDay) {
    return null;
  }
  return Math.max(0, daysBetween(streak.lastTrainingDay, today));
}

/** The friend's medals, with the levels worked out from the values like the user's own. */
export function friendAchievements(medals: MedalValues): Achievement[] {
  const nothing = { words: [], bestStreak: 0, perfectQuizzes: 0 };
  return ACHIEVEMENT_RULES.map((rule) => computeAchievement({ ...rule, value: () => medals[rule.id] ?? 0 }, nothing));
}
