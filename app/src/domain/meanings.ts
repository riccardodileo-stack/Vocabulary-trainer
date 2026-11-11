// Picks the translations of a word out of a translation-memory answer (MyMemory):
// keeps the ones for exactly that word, drops duplicates and noise, best first.
// Pure function: the network call is in services/meanings.ts.

import type { LanguageCode } from './languages';
import { normalizeText, removeAccents } from './text';

/** One entry of the answer: a stored translation of `segment`. */
export type TranslationMatch = {
  segment: string;
  translation: string;
  /** 0–100, how reliable the translation is (MyMemory gives it as text). */
  quality: number | string;
  /** 0–1, how close `segment` is to the word searched. */
  match: number;
};

/** Suggestions shown at most. */
export const MAX_MEANINGS = 6;
/** Entries for a different text than the word (e.g. "boring machine") are dropped. */
const MIN_MATCH = 0.95;
/** Longer "translations" are sentences, not meanings. */
const MAX_LENGTH = 40;

function comparable(text: string): string {
  return removeAccents(normalizeText(text)).replace(/[.!?;:,"«»]+$/g, '').trim();
}

/** "Noioso" -> "noioso" when the word was written in lower case (not in German, nouns are capitalised there). */
function cleanTranslation(translation: string, term: string, target: LanguageCode): string {
  const text = translation.trim().replace(/[.!?;:,]+$/, '').trim();
  const lowerTerm = term.trim()[0] === term.trim()[0]?.toLowerCase();
  if (target !== 'de' && lowerTerm && text.length > 1 && text[1] === text[1].toLowerCase()) {
    return text[0].toLowerCase() + text.slice(1);
  }
  return text;
}

/**
 * The translations of `term` among `matches`: only entries for that exact word, not the word
 * itself left untranslated, no duplicates (ignoring case and accents), most reliable first.
 */
export function pickMeanings(term: string, matches: TranslationMatch[], target: LanguageCode): string[] {
  const wanted = comparable(term);
  const seen = new Set<string>([wanted]);
  const result: string[] = [];

  const sorted = [...matches]
    .filter((match) => match.match >= MIN_MATCH && comparable(match.segment) === wanted)
    .sort((a, b) => Number(b.quality) * b.match - Number(a.quality) * a.match);

  for (const match of sorted) {
    const translation = cleanTranslation(match.translation, term, target);
    const key = comparable(translation);
    if (key && translation.length <= MAX_LENGTH && !seen.has(key)) {
      seen.add(key);
      result.push(translation);
    }
    if (result.length === MAX_MEANINGS) {
      break;
    }
  }
  return result;
}
