// Training activity: days with at least one answer (for the streak),
// best streak ever and perfect quizzes (for the medals).

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { longestStreak, streakStatus, withDay, type StreakStatus } from '@/domain/activity';
import { dayKey, type DayKey } from '@/domain/dates';

import { persistStorage } from './persistStorage';

/** Quizzes shorter than this don't count as "perfect" for the medals. */
export const PERFECT_QUIZ_MIN_QUESTIONS = 5;

type ActivityState = {
  /** Sorted "YYYY-MM-DD" days (the last ACTIVITY_DAYS_KEPT). */
  days: DayKey[];
  /** Longest streak ever: kept apart because old days are dropped from `days`. */
  bestStreak: number;
  /** Finished quizzes with no mistakes and at least PERFECT_QUIZ_MIN_QUESTIONS questions. */
  perfectQuizzes: number;

  markToday: () => void;
  recordQuizFinished: (questions: number, mistakes: number) => void;
};

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      days: [],
      bestStreak: 0,
      perfectQuizzes: 0,

      markToday: () =>
        set((state) => {
          const days = withDay(state.days, dayKey());
          // The best streak counts the days kept alive by a save too
          return { days, bestStreak: Math.max(state.bestStreak, streakStatus(days).best) };
        }),

      recordQuizFinished: (questions, mistakes) =>
        set((state) =>
          questions >= PERFECT_QUIZ_MIN_QUESTIONS && mistakes === 0 ? { perfectQuizzes: state.perfectQuizzes + 1 } : {}
        ),
    }),
    {
      name: 'activity',
      // v2 adds bestStreak and perfectQuizzes; bestStreak is rebuilt from the saved days
      version: 2,
      migrate: (persisted) => {
        const state = persisted as { days: DayKey[]; bestStreak?: number; perfectQuizzes?: number };
        return { ...state, bestStreak: state.bestStreak ?? longestStreak(state.days), perfectQuizzes: state.perfectQuizzes ?? 0 };
      },
      storage: persistStorage,
    }
  )
);

/** The streak with its saves (see domain/activity.ts). */
export function useStreakStatus(): StreakStatus {
  const days = useActivityStore((state) => state.days);
  return streakStatus(days, dayKey());
}

export function useTrainedToday(): boolean {
  return useActivityStore((state) => state.days.includes(dayKey()));
}
