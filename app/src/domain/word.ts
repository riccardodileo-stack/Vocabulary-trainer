// The Word model and the pure functions that create or inspect words.
// No React and no storage here: these functions are easy to test and reuse.

import type { LanguageCode, LanguagePair } from './languages';
import { normalizeText, splitSlashOptions } from './text';

export type Meaning = {
  text: string;
  /** Optional hint shown next to the meaning, e.g. "electric", "informal". */
  note?: string;
  /** Context sentences in the studied language. */
  examples: string[];
};

export type WordStats = {
  correct: number;
  wrong: number;
  /**
   * Correct answers in a row. It takes a word out of the mistakes review
   * and is also its spaced-repetition box (see domain/review.ts).
   */
  streak: number;
  lastWrongAt?: string;
  /** Last time the word was asked in a quiz; undefined for words never asked. */
  lastAnsweredAt?: string;
};

/** Stats after one quiz answer. */
export function statsAfterAnswer(stats: WordStats, correct: boolean, now: Date = new Date()): WordStats {
  const lastAnsweredAt = now.toISOString();

  return correct
    ? { ...stats, correct: stats.correct + 1, streak: stats.streak + 1, lastAnsweredAt }
    : { ...stats, wrong: stats.wrong + 1, streak: 0, lastWrongAt: lastAnsweredAt, lastAnsweredAt };
}

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export function isCefrLevel(value: unknown): value is CefrLevel {
  return typeof value === 'string' && (CEFR_LEVELS as readonly string[]).includes(value);
}

export type Word = {
  id: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  /** The word in the studied language. */
  term: string;
  meanings: Meaning[];
  stats: WordStats;
  level?: CefrLevel;
  tags: string[];
  createdAt: string;
};

export type NewWordInput = {
  term: string;
  meanings: Meaning[];
  level?: CefrLevel;
  tags?: string[];
};

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyStats(): WordStats {
  return { correct: 0, wrong: 0, streak: 0 };
}

export function createWord(pair: LanguagePair, input: NewWordInput): Word {
  return {
    id: createId(),
    sourceLang: pair.source,
    targetLang: pair.target,
    term: input.term.trim(),
    meanings: input.meanings,
    stats: emptyStats(),
    level: input.level,
    tags: input.tags ?? [],
    createdAt: new Date().toISOString(),
  };
}

/** "batteria / pila" -> two meanings without notes or examples. */
export function meaningsFromSlashText(text: string): Meaning[] {
  return splitSlashOptions(text).map((option) => ({ text: option, examples: [] }));
}

export function meaningsToText(word: Word): string {
  return word.meanings.map((meaning) => meaning.text).join(' / ');
}

export function belongsToPair(word: Word, pair: LanguagePair): boolean {
  return word.sourceLang === pair.source && word.targetLang === pair.target;
}

export function hasSameTerm(word: Word, term: string): boolean {
  return normalizeText(word.term) === normalizeText(term);
}
