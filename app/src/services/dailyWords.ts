// Where the "words of the day" come from.
//
// The app only talks to a `DailyWordsSource`. Today it is the built-in list;
// when a server exists, set `dailyWordsSource` to `createRemoteDailyWordsSource(url)`
// and nothing else in the app changes. The remote source falls back to the
// built-in list when the phone is offline or the server fails.

import { WORD_BANK, type BankEntry } from '@/content/wordBank';
import { pickDailySuggestions, type DailyLevel, type DailySuggestion } from '@/domain/dailyWords';
import type { DayKey } from '@/domain/dates';
import type { LanguagePair } from '@/domain/languages';

export type DailyWordsRequest = {
  pair: LanguagePair;
  day: DayKey;
  level: DailyLevel;
  count: number;
  knownIds: string[];
  /** Normalized terms already in the vocabulary (never sent to a server). */
  vocabularyTerms: string[];
};

export type DailyWordsSource = {
  fetchSuggestions: (request: DailyWordsRequest) => Promise<DailySuggestion[]>;
};

function pickFrom(entries: BankEntry[], request: DailyWordsRequest): DailySuggestion[] {
  return pickDailySuggestions(entries, {
    pair: request.pair,
    day: request.day,
    level: request.level,
    count: request.count,
    knownIds: new Set(request.knownIds),
    vocabularyTerms: new Set(request.vocabularyTerms),
  });
}

/** Built-in list: works offline, same words for everyone on the same day. */
export const localDailyWordsSource: DailyWordsSource = {
  fetchSuggestions: async (request) => pickFrom(WORD_BANK, request),
};

/**
 * Server source (not used yet). Expected API:
 *
 *   GET {baseUrl}/daily-words?source=en&target=it&level=intermediate&day=2026-10-29
 *   200 -> { "entries": BankEntry[] }   // a few dozen candidates, any order
 *
 * The server returns candidates and the phone does the final choice, so the
 * user's vocabulary never leaves the device and the same filtering rules apply.
 */
export function createRemoteDailyWordsSource(baseUrl: string, timeoutMs = 5000): DailyWordsSource {
  return {
    fetchSuggestions: async (request) => {
      const params = new URLSearchParams({
        source: request.pair.source,
        target: request.pair.target,
        level: request.level,
        day: request.day,
      });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${baseUrl}/daily-words?${params}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Daily words server error ${response.status}`);
        }
        const { entries } = (await response.json()) as { entries: BankEntry[] };
        const suggestions = pickFrom(entries, request);
        // A server with few new words for this user is completed by the built-in list
        return suggestions.length > 0 ? suggestions : pickFrom(WORD_BANK, request);
      } catch (error) {
        console.warn('Daily words: using the built-in list.', error);
        return pickFrom(WORD_BANK, request);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

/** The source used by the app. Change only this line to switch to a server. */
export const dailyWordsSource: DailyWordsSource = localDailyWordsSource;
