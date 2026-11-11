// Shared test helpers (not a test file: jest only runs *.test.ts).

import { createWord, type Word, type WordStats } from '../word';

const PAIR = { source: 'en', target: 'it' } as const;

/** A word answered last on `lastAnsweredDay` (local noon, to avoid time-zone edges). */
export function makeWord(term: string, meanings: string[], stats: Partial<WordStats> = {}, lastAnsweredDay?: string): Word {
  const word = createWord(PAIR, { term, meanings: meanings.map((text) => ({ text, examples: [] })) });
  const lastAnsweredAt = lastAnsweredDay ? new Date(`${lastAnsweredDay}T12:00:00`).toISOString() : undefined;
  return { ...word, stats: { ...word.stats, ...stats, lastAnsweredAt } };
}
