// All words of every language pair. Components read them with the hooks
// at the bottom and change them only through the actions defined here.

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { mergeWords, type MergeResult } from '@/domain/backup';
import type { LanguagePair } from '@/domain/languages';
import {
  belongsToPair,
  classifyMeanings,
  createWord,
  statsAfterAnswer,
  topicsOfMeanings,
  withClassification,
  type NewWordInput,
  type Word,
} from '@/domain/word';

import { useActivityStore } from './activityStore';
import { persistStorage } from './persistStorage';

type WordState = {
  words: Word[];

  addWord: (pair: LanguagePair, input: NewWordInput) => Word;
  updateWord: (id: string, changes: Partial<Omit<Word, 'id'>>) => void;
  removeWord: (id: string) => void;
  /** Adds the words of a backup without creating duplicates. */
  importWords: (imported: Word[]) => Omit<MergeResult, 'words'>;
  /** Updates the stats of a word after a quiz answer and marks today as a training day. */
  recordAnswer: (id: string, correct: boolean) => void;
};

/**
 * Saved data of older versions -> current shape. `version` is the number saved
 * with the data; every step upgrades by one version.
 */
function migrate(persisted: unknown, version: number): { words: Word[] } {
  const state = persisted as { words: Word[] };
  // Words saved by older versions miss some of today's fields: they are filled below

  if (version < 2) {
    // v2 adds stats.lastAnsweredAt (spaced repetition). The best guess for
    // old words is the last mistake; words never wrong become "new" (due at once).
    state.words = state.words.map((word) => ({
      ...word,
      stats: { ...word.stats, lastAnsweredAt: word.stats.lastAnsweredAt ?? word.stats.lastWrongAt },
    }));
  }

  if (version < 3) {
    // v3 adds topics and kind of word: suggested by the topic network and the offline
    // rules; the kind is then checked on Wiktionary in the background (useWordKindCheck).
    state.words = state.words.map(withClassification);
  }

  if (version < 5) {
    // v4 recomputed the topics of the whole word with a new model; v5 moves the topics onto
    // each meaning ("stroke" = "ictus" -> health, = "colpo" -> none). Topics chosen by hand
    // for the word go to all its meanings; the automatic ones are suggested again per meaning.
    state.words = state.words.map((word) => {
      const byUser = word.topicsByUser === true;
      const meanings = classifyMeanings(
        { source: word.sourceLang, target: word.targetLang },
        word.term,
        word.meanings.map((meaning) =>
          byUser ? { ...meaning, topics: word.topics, topicsByUser: true } : { ...meaning, topics: undefined }
        )
      );
      const { topicsByUser: _old, ...rest } = word;
      return { ...rest, meanings, topics: topicsOfMeanings(meanings) };
    });
  }

  return state;
}

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
          words: state.words.map((word) => {
            if (word.id !== id) {
              return word;
            }
            const updated = { ...word, ...changes };
            if (!changes.meanings) {
              return updated;
            }
            // New or changed meanings get their topics; the word's topics follow its meanings
            const meanings = classifyMeanings(
              { source: updated.sourceLang, target: updated.targetLang },
              updated.term,
              changes.meanings
            );
            return { ...updated, meanings, topics: topicsOfMeanings(meanings) };
          }),
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

      recordAnswer: (id, correct) => {
        set((state) => ({
          words: state.words.map((word) => (word.id === id ? { ...word, stats: statsAfterAnswer(word.stats, correct) } : word)),
        }));
        useActivityStore.getState().markToday();
      },
    }),
    {
      name: 'words',
      // Increase and extend `migrate` when the saved Word shape changes
      version: 5,
      migrate,
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
