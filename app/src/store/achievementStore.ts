// When each medal level was reached. Medals themselves are computed from the
// other stores (domain/achievements.ts); only the dates need saving.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from './persistStorage';

type AchievementState = {
  /** ISO date by tierKey ("words:silver"). */
  reachedAt: Record<string, string>;
  recordReached: (dates: Record<string, string>) => void;
};

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set) => ({
      reachedAt: {},
      // Existing dates are never overwritten: the first time counts
      recordReached: (dates) => set((state) => ({ reachedAt: { ...dates, ...state.reachedAt } })),
    }),
    {
      name: 'achievements',
      // v2: new targets for "words" and "learned": their old dates referred to the
      // old targets, so they are dropped and the tracker dates the levels again
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as { reachedAt: Record<string, string> };
        if (version < 2) {
          state.reachedAt = Object.fromEntries(
            Object.entries(state.reachedAt).filter(([key]) => !key.startsWith('words:') && !key.startsWith('learned:'))
          );
        }
        return state as AchievementState;
      },
      storage: persistStorage,
    }
  )
);
