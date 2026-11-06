// Medals of the user, and the tracker that saves when each level is reached.

import { useEffect } from 'react';

import { computeAchievements, estimateReachedAt, reachedTiers, tierKey, type Achievement } from '@/domain/achievements';
import { useAchievementStore } from '@/store/achievementStore';
import { useActivityStore } from '@/store/activityStore';
import { useWordStore } from '@/store/wordStore';

export function useAchievements(): Achievement[] {
  const words = useWordStore((state) => state.words);
  const bestStreak = useActivityStore((state) => state.bestStreak);
  const perfectQuizzes = useActivityStore((state) => state.perfectQuizzes);
  return computeAchievements({ words, bestStreak, perfectQuizzes });
}

/**
 * Saves the date of every level reached and not yet dated, the moment it is
 * reached, wherever the user is. Rendered once by the root layout after the saved
 * data is loaded (before that every level would look new).
 * A component (not a hook in the layout) so word changes re-render only this.
 */
export function AchievementTracker() {
  useAchievementTracker();
  return null;
}

function useAchievementTracker() {
  const achievements = useAchievements();
  const words = useWordStore((state) => state.words);
  const days = useActivityStore((state) => state.days);

  useEffect(() => {
    const { reachedAt, recordReached } = useAchievementStore.getState();
    const now = new Date().toISOString();
    const missing: Record<string, string> = {};

    for (const achievement of achievements) {
      reachedTiers(achievement).forEach((tier, index) => {
        const key = tierKey(achievement.id, tier);
        if (!reachedAt[key]) {
          // Levels reached before this feature existed get the best estimate available
          missing[key] = estimateReachedAt(achievement.id, achievement.targets[index], { words, days }) ?? now;
        }
      });
    }

    if (Object.keys(missing).length > 0) {
      recordReached(missing);
    }
  }, [achievements, words, days]);
}
