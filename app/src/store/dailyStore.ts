// Words of the day: today's suggestions (kept so they don't change during the day,
// even after some are added) and the words the user marked as already known.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { DailyLevel, DailySuggestion } from '@/domain/dailyWords';
import type { DayKey } from '@/domain/dates';
import type { LanguageCode, LanguagePair } from '@/domain/languages';

import { persistStorage } from './persistStorage';

export type DailyBatch = {
  day: DayKey;
  level: DailyLevel;
  suggestions: DailySuggestion[];
};

type DailyState = {
  /** Today's suggestions for each language pair, keyed by pairKey(). */
  batches: Record<string, DailyBatch>;
  /** Entry ids marked "I already know it", per studied language. */
  knownIds: Partial<Record<LanguageCode, string[]>>;

  setBatch: (pair: LanguagePair, batch: DailyBatch) => void;
  setKnown: (language: LanguageCode, id: string, known: boolean) => void;
  clearKnown: (language: LanguageCode) => void;
};

export function pairKey({ source, target }: LanguagePair): string {
  return `${source}-${target}`;
}

export const useDailyStore = create<DailyState>()(
  persist(
    (set) => ({
      batches: {},
      knownIds: {},

      setBatch: (pair, batch) => set((state) => ({ batches: { ...state.batches, [pairKey(pair)]: batch } })),

      setKnown: (language, id, known) =>
        set((state) => {
          const current = state.knownIds[language] ?? [];
          const next = known ? [...new Set([...current, id])] : current.filter((knownId) => knownId !== id);
          return { knownIds: { ...state.knownIds, [language]: next } };
        }),

      clearKnown: (language) => set((state) => ({ knownIds: { ...state.knownIds, [language]: [] } })),
    }),
    {
      name: 'daily',
      version: 1,
      storage: persistStorage,
    }
  )
);

const NO_IDS: string[] = [];

export function useKnownIds(language: LanguageCode): string[] {
  return useDailyStore((state) => state.knownIds[language] ?? NO_IDS);
}
