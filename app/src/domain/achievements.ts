// Medals: goals reached by studying. Each medal has four levels (bronze, silver,
// gold, diamond) with growing targets, e.g. "Vocabulary": 20, 100, 500, 1000 words.
//
// Medals are computed from the data the app already keeps (words, stats, best
// streak, perfect quizzes), so nothing extra is saved and they can never get out
// of sync. The streak medal uses the best streak ever: it is never lost.

import { daysBetween } from './dates';
import { isMastered } from './review';
import type { Word } from './word';

export const MEDAL_TIERS = ['bronze', 'silver', 'gold', 'diamond'] as const;

export type MedalTier = (typeof MEDAL_TIERS)[number];

/** Everything the medals are computed from. */
export type AchievementStats = {
  /** Words of every language pair. */
  words: Word[];
  bestStreak: number;
  perfectQuizzes: number;
};

export type AchievementId = 'words' | 'learned' | 'streak' | 'answers' | 'perfect' | 'polyglot';

type AchievementRule = {
  id: AchievementId;
  icon: string;
  /** Target of each tier, in MEDAL_TIERS order (increasing). */
  targets: readonly [number, number, number, number];
  value: (stats: AchievementStats) => number;
};

const correctAnswers = ({ words }: AchievementStats) => words.reduce((sum, word) => sum + word.stats.correct, 0);
const learnedWords = ({ words }: AchievementStats) => words.filter(isMastered).length;
const studiedLanguages = ({ words }: AchievementStats) => new Set(words.map((word) => word.sourceLang)).size;

/** In display order. Titles and goals are in i18n (`achievements.<id>`). */
export const ACHIEVEMENT_RULES: AchievementRule[] = [
  { id: 'words', icon: '📚', targets: [20, 100, 500, 1000], value: ({ words }) => words.length },
  { id: 'learned', icon: '🏆', targets: [10, 50, 250, 500], value: learnedWords },
  { id: 'streak', icon: '🔥', targets: [3, 7, 30, 100], value: ({ bestStreak }) => bestStreak },
  { id: 'answers', icon: '🎯', targets: [50, 250, 1000, 5000], value: correctAnswers },
  { id: 'perfect', icon: '🎉', targets: [1, 5, 20, 50], value: ({ perfectQuizzes }) => perfectQuizzes },
  { id: 'polyglot', icon: '🌍', targets: [2, 3, 4, 5], value: studiedLanguages },
];

export type Achievement = {
  id: AchievementId;
  icon: string;
  targets: readonly number[];
  /** Current value (not capped). */
  value: number;
  /** Highest tier reached, or null if not even bronze. */
  tier: MedalTier | null;
  /** Next tier and its target, or null when diamond is reached. */
  next: { tier: MedalTier; target: number } | null;
  /**
   * 0–1 progress toward the next tier: value / its target (729 words -> 729/1000).
   * Same ratio as the "729/1000" written under the bar, so the two always agree.
   */
  progress: number;
};

export function computeAchievement(rule: AchievementRule, stats: AchievementStats): Achievement {
  const value = rule.value(stats);
  const reached = rule.targets.filter((target) => value >= target).length;
  const tier = reached > 0 ? MEDAL_TIERS[reached - 1] : null;
  const next = reached < MEDAL_TIERS.length ? { tier: MEDAL_TIERS[reached], target: rule.targets[reached] } : null;

  const progress = next ? Math.min(Math.max(value / next.target, 0), 1) : 1;

  return { id: rule.id, icon: rule.icon, targets: rule.targets, value, tier, next, progress };
}

export function computeAchievements(stats: AchievementStats): Achievement[] {
  return ACHIEVEMENT_RULES.map((rule) => computeAchievement(rule, stats));
}

/** Tiers reached over all medals (e.g. bronze + silver of one medal = 2). */
/** Emoji of each level, for lists and sheets. */
export const TIER_ICONS: Record<MedalTier, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', diamond: '💎' };

/**
 * How many medals reached each level. A medal at gold counts once for bronze,
 * once for silver and once for gold: every level won counts one.
 */
export function tierCounts(achievements: Achievement[]): Record<MedalTier, number> {
  const counts: Record<MedalTier, number> = { bronze: 0, silver: 0, gold: 0, diamond: 0 };
  for (const achievement of achievements) {
    reachedTiers(achievement).forEach((tier) => counts[tier]++);
  }
  return counts;
}

/** Levels won in total (the "9/24" in Profile): the sum of tierCounts. */
export function tiersEarned(achievements: Achievement[]): number {
  return achievements.reduce((sum, achievement) => sum + (achievement.tier ? MEDAL_TIERS.indexOf(achievement.tier) + 1 : 0), 0);
}

/** Key of one level of one medal, e.g. "words:silver" (used to save the date it was reached). */
export function tierKey(id: AchievementId, tier: MedalTier): string {
  return `${id}:${tier}`;
}

/** Levels reached by a medal, from bronze up. */
export function reachedTiers(achievement: Achievement): MedalTier[] {
  return MEDAL_TIERS.filter((_, index) => achievement.value >= achievement.targets[index]);
}

/** How many more are needed for a target (0 if already reached). */
export function missingFor(achievement: Achievement, target: number): number {
  return Math.max(target - achievement.value, 0);
}

/**
 * Best guess of when an already reached level was reached, for levels found
 * before dates were saved (app updates). Returns undefined when it can't be known.
 * - words: when the N-th word was added
 * - streak: the first day a run of N consecutive days was completed
 */
export function estimateReachedAt(
  id: AchievementId,
  target: number,
  data: { words: Word[]; days: string[] }
): string | undefined {
  if (id === 'words') {
    const created = data.words.map((word) => word.createdAt).sort();
    return created[target - 1];
  }

  if (id === 'streak') {
    const days = [...new Set(data.days)].sort();
    let run = 0;
    for (let i = 0; i < days.length; i++) {
      const consecutive = i > 0 && daysBetween(days[i - 1], days[i]) === 1;
      run = consecutive ? run + 1 : 1;
      if (run >= target) {
        return new Date(`${days[i]}T12:00:00`).toISOString();
      }
    }
  }
  return undefined;
}
