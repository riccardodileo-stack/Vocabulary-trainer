// All words of every language pair. Components read them with the hooks
// at the bottom and change them only through the actions defined here.

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { mergeWords, type MergeResult } from '@/domain/backup';
import type { LanguagePair } from '@/domain/languages';
import { belongsToPair, createWord, type NewWordInput, type Word } from '@/domain/word';

import { persistStorage } from './persistStorage';

type WordState = {
  words: Word[];

  addWord: (pair: LanguagePair, input: NewWordInput) => Word;
  updateWord: (id: string, changes: Partial<Omit<Word, 'id'>>) => void;
  removeWord: (id: string) => void;
  /** Adds the words of a backup without creating duplicates. */
  importWords: (imported: Word[]) => Omit<MergeResult, 'words'>;
  /** Updates the stats of a word after a quiz answer. */
  recordAnswer: (id: string, correct: boolean) => void;
};

export const useWordStore = create<WordState>()(
  persist(
    (set, get) => ({
      words: [],

      addWord: (pair, input) => {
        const word = createWord(pair, input);
        set((state) => ({ words: [...state.words, word] }));
        return word;
      },

      updateWord: (id, changes) =>
        set((state) => ({
          words: state.words.map((word) => (word.id === id ? { ...word, ...changes } : word)),
        })),

      removeWord: (id) =>
        set((state) => ({
          words: state.words.filter((word) => word.id !== id),
        })),

      importWords: (imported) => {
        const { words, ...result } = mergeWords(get().words, imported);
        set({ words });
        return result;
      },

      recordAnswer: (id, correct) =>
        set((state) => ({
          words: state.words.map((word) => {
            if (word.id !== id) {
              return word;
            }

            const { stats } = word;
            return {
              ...word,
              stats: correct
                ? { ...stats, correct: stats.correct + 1, streak: stats.streak + 1 }
                : { ...stats, wrong: stats.wrong + 1, streak: 0, lastWrongAt: new Date().toISOString() },
            };
          }),
        })),
    }),
    {
      name: 'words',
      // Increase and add a `migrate` function when the Word shape changes
      version: 1,
      storage: persistStorage,
    }
  )
);

/** Words of one language pair (e.g. English -> Italian). */
export function useWordsOfPair({ source, target }: LanguagePair): Word[] {
  const words = useWordStore((state) => state.words);
  return useMemo(
    () => words.filter((word) => belongsToPair(word, { source, target })),
    [words, source, target]
  );
}

export function useWord(id: string): Word | undefined {
  return useWordStore((state) => state.words.find((word) => word.id === id));
}
