// Today's words of the day for the active pair, with their state and actions.
// Loads a new batch when the day, the pair or the level changes.

import { useEffect, useMemo, useState } from 'react';

import { DAILY_WORDS_COUNT, suggestionToWordInput, type DailySuggestion } from '@/domain/dailyWords';
import { dayKey } from '@/domain/dates';
import { normalizeText } from '@/domain/text';
import { dailyWordsSource } from '@/services/dailyWords';
import { pairKey, useDailyStore, useKnownIds } from '@/store/dailyStore';
import { useActivePair, useSettingsStore } from '@/store/settingsStore';
import { useWordStore, useWordsOfPair } from '@/store/wordStore';

/** 'new' = still to decide, 'added' = in the vocabulary, 'known' = "I already know it". */
export type DailyWordState = 'new' | 'added' | 'known';

export type DailyWordItem = {
  suggestion: DailySuggestion;
  state: DailyWordState;
  /** Id of the vocabulary word, once added. */
  wordId?: string;
};

export type DailyWords = {
  status: 'loading' | 'ready' | 'error';
  items: DailyWordItem[];
  add: (suggestion: DailySuggestion) => void;
  setKnown: (suggestion: DailySuggestion, known: boolean) => void;
  retry: () => void;
};

export function useDailyWords(): DailyWords {
  const pair = useActivePair();
  const level = useSettingsStore((state) => state.dailyLevel);
  const words = useWordsOfPair(pair);
  const knownIds = useKnownIds(pair.source);
  const batch = useDailyStore((state) => state.batches[pairKey(pair)]);
  const setBatch = useDailyStore((state) => state.setBatch);
  const setKnownId = useDailyStore((state) => state.setKnown);
  const addWord = useWordStore((state) => state.addWord);

  const today = dayKey();
  const isFresh = batch !== undefined && batch.day === today && batch.level === level;
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (isFresh) {
      return;
    }

    let cancelled = false;
    // Read at load time on purpose: adding a word must not trigger a new batch
    const { words: allWords } = useWordStore.getState();
    const { knownIds: known } = useDailyStore.getState();

    dailyWordsSource
      .fetchSuggestions({
        pair,
        day: today,
        level,
        count: DAILY_WORDS_COUNT,
        knownIds: known[pair.source] ?? [],
        vocabularyTerms: allWords
          .filter((word) => word.sourceLang === pair.source && word.targetLang === pair.target)
          .map((word) => normalizeText(word.term)),
      })
      .then((suggestions) => {
        if (!cancelled) {
          setFailed(false);
          setBatch(pair, { day: today, level, suggestions });
        }
      })
      .catch((error) => {
        console.error('Daily words error:', error);
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
    // pair is rebuilt on every render: depend on its parts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFresh, pair.source, pair.target, level, today, attempt, setBatch]);

  const items = useMemo<DailyWordItem[]>(() => {
    if (!isFresh) {
      return [];
    }
    const idByTerm = new Map(words.map((word) => [normalizeText(word.term), word.id]));

    return batch.suggestions.map((suggestion) => {
      const wordId = idByTerm.get(normalizeText(suggestion.term));
      const state: DailyWordState = wordId ? 'added' : knownIds.includes(suggestion.id) ? 'known' : 'new';
      return { suggestion, state, wordId };
    });
  }, [isFresh, batch, words, knownIds]);

  return {
    status: isFresh ? 'ready' : failed ? 'error' : 'loading',
    items,
    add: (suggestion) => {
      const exists = useWordStore
        .getState()
        .words.some(
          (word) =>
            word.sourceLang === pair.source &&
            word.targetLang === pair.target &&
            normalizeText(word.term) === normalizeText(suggestion.term)
        );
      if (!exists) {
        addWord(pair, suggestionToWordInput(suggestion));
      }
    },
    setKnown: (suggestion, known) => setKnownId(pair.source, suggestion.id, known),
    retry: () => setAttempt((value) => value + 1),
  };
}
