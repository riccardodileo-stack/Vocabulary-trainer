// Days on which the user answered at least one quiz question (for the streak).

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { currentStreak, withDay } from '@/domain/activity';
import { dayKey, type DayKey } from '@/domain/dates';

import { persistStorage } from './persistStorage';

type ActivityState = {
  /** Sorted "YYYY-MM-DD" days. */
  days: DayKey[];
  markToday: () => void;
};

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      days: [],
      markToday: () => set((state) => ({ days: withDay(state.days, dayKey()) })),
    }),
    {
      name: 'activity',
      version: 1,
      storage: persistStorage,
    }
  )
);

export function useStreak(): number {
  const days = useActivityStore((state) => state.days);
  return currentStreak(days, dayKey());
}

export function useTrainedToday(): boolean {
  return useActivityStore((state) => state.days.includes(dayKey()));
}
