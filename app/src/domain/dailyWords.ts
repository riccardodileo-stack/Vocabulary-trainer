// "Words of the day": new words suggested every day, chosen from a list of
// multilingual entries (see content/wordBank.ts). Pure functions only: where the
// entries come from (built-in list today, a server tomorrow) is decided in
// services/dailyWords.ts.

import type { BankEntry } from '../content/wordBank';

import type { DayKey } from './dates';
import type { LanguagePair } from './languages';
import { normalizeText, splitSlashOptions } from './text';
import type { TopicId } from './topics';
import type { CefrLevel, NewWordInput } from './word';

export const DAILY_WORDS_COUNT = 5;

/** Difficulty chosen in the settings; each one maps to CEFR levels. */
export type DailyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

export const DAILY_LEVELS: Record<DailyLevel, CefrLevel[]> = {
  all: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
  beginner: ['A1', 'A2'],
  intermediate: ['B1', 'B2'],
  advanced: ['C1', 'C2'],
};

export type DailySuggestion = {
  /** Id of the entry it comes from; used to remember words marked as known. */
  id: string;
  level: CefrLevel;
  /** The word in the studied language. */
  term: string;
  /** Its translations in the native language. */
  meanings: string[];
  /** Categories of the word (empty for general words; missing in suggestions saved by older versions). */
  topics?: TopicId[];
};

/** The entry seen from a language pair: first studied alternative, every translation. */
export function suggestionFromEntry(entry: BankEntry, { source, target }: LanguagePair): DailySuggestion {
  return {
    id: entry.id,
    level: entry.level,
    term: splitSlashOptions(entry.text[source])[0],
    meanings: splitSlashOptions(entry.text[target]),
    topics: entry.topics,
  };
}

export function suggestionToWordInput(suggestion: DailySuggestion): NewWordInput {
  return {
    term: suggestion.term,
    // The list knows the categories: they go to every meaning (automatic, the user can change them)
    // (suggestions saved before categories existed have none)
    meanings: suggestion.meanings.map((text) =>
      suggestion.topics?.length ? { text, examples: [], topics: suggestion.topics } : { text, examples: [] }
    ),
    level: suggestion.level,
  };
}

/** Same string -> same number. Used to seed the daily shuffle. */
export function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Small deterministic random generator (mulberry32): same seed, same sequence. */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type PickOptions = {
  pair: LanguagePair;
  day: DayKey;
  level: DailyLevel;
  /** Categories chosen by the user; empty = every word (general ones too). */
  topics?: readonly TopicId[];
  count?: number;
  /** Entries marked as "I already know it". */
  knownIds: ReadonlySet<string>;
  /** Normalized terms already in the user's vocabulary. */
  vocabularyTerms: ReadonlySet<string>;
};

/** No category chosen: every word. Otherwise words of at least one of the chosen categories. */
export function inTopics(entry: BankEntry, topics: readonly TopicId[]): boolean {
  return topics.length === 0 || entry.topics.some((topic) => topics.includes(topic));
}

/**
 * Words still to discover for these choices: of the level and categories, not known, not in
 * the vocabulary. Used for the counters of the categories sheet.
 */
export function remainingCount(
  entries: BankEntry[],
  options: Pick<PickOptions, 'pair' | 'level' | 'topics' | 'knownIds' | 'vocabularyTerms'>
): number {
  const levels = DAILY_LEVELS[options.level];
  return entries.filter(
    (entry) =>
      levels.includes(entry.level) &&
      inTopics(entry, options.topics ?? []) &&
      !options.knownIds.has(entry.id) &&
      !splitSlashOptions(entry.text[options.pair.source]).some((term) => options.vocabularyTerms.has(normalizeText(term)))
  ).length;
}

/**
 * The suggestions of one day. The order depends only on the day and the pair,
 * so reopening the app the same day shows the same words.
 */
export function pickDailySuggestions(entries: BankEntry[], options: PickOptions): DailySuggestion[] {
  const { pair, day, level, topics = [], count = DAILY_WORDS_COUNT, knownIds, vocabularyTerms } = options;
  const levels = DAILY_LEVELS[level];

  const candidates = entries.filter(
    (entry) =>
      levels.includes(entry.level) &&
      inTopics(entry, topics) &&
      !knownIds.has(entry.id) &&
      !splitSlashOptions(entry.text[pair.source]).some((term) => vocabularyTerms.has(normalizeText(term)))
  );

  // Same day, pair and categories -> same order. Without categories the seed is unchanged.
  const topicKey = [...topics].sort().join(',');
  const random = seededRandom(hashString(`${day}|${pair.source}|${pair.target}${topicKey ? `|${topicKey}` : ''}`));
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Two concepts can share a word in some languages (improve / enhance -> "migliorare"):
  // never suggest the same word twice on the same day
  const suggestions: DailySuggestion[] = [];
  const terms = new Set<string>();
  for (const entry of candidates) {
    if (suggestions.length >= count) {
      break;
    }
    const suggestion = suggestionFromEntry(entry, pair);
    if (!terms.has(normalizeText(suggestion.term))) {
      terms.add(normalizeText(suggestion.term));
      suggestions.push(suggestion);
    }
  }
  return suggestions;
}
