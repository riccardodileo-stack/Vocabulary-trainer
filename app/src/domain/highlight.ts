// Finds a word inside an example sentence, to show it in bold:
// "This film is so boring" + "boring" -> "This film is so **boring**".
// Pure functions: no React here (the component is components/HighlightedText.tsx).

import type { LanguageCode } from './languages';
import { removeAccents, splitSlashOptions, stripLeadingWord } from './text';

export type TextPart = { text: string; bold: boolean };

/** A word: letters (any alphabet, with accents), possibly with ' or - inside ("l'acqua", "well-known"). */
const WORD = /[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu;

/** Words of at least this length may also change their last letter (noioso -> noiosa). */
const STEM_MIN_LENGTH = 4;
/** Longer endings accepted after the word (or its stem): run -> running, try -> tries. */
const LONG_ENDINGS = new Set(['ing', 'ings', 'ies', 'ied', 'ers', 'est', 'ung', 'ten']);

function fold(word: string): string {
  return removeAccents(word.toLowerCase()).replace(/’/g, "'");
}

/**
 * Whether `token` is `word` or another form of it: plural, feminine, -ing, -ed…
 * Up to two extra letters are always fine (noiosE, catS, endED); longer endings only
 * from a short list, so "run" finds "running" but not "runway".
 */
function isFormOf(token: string, word: string): boolean {
  // try -> tries, tried: the final y becomes i
  const base = word.endsWith('y') && token.startsWith(`${word.slice(0, -1)}i`) ? `${word.slice(0, -1)}i` : word;
  const stem = base.length >= STEM_MIN_LENGTH ? base.slice(0, -1) : base;
  if (!token.startsWith(stem)) {
    return false;
  }
  let ending = token.slice(stem.length);
  // Doubled last letter: run -> ruNNing, stop -> stoPPed
  if (ending.length > 2 && ending[0] === stem[stem.length - 1]) {
    ending = ending.slice(1);
  }
  return ending.length <= 2 || LONG_ENDINGS.has(ending);
}

/**
 * Each term as its list of words, without the leading article or "to" ("to run" -> ["run"]).
 * "batteria / pila" counts as two terms.
 */
function termWords(terms: string[], language?: LanguageCode): string[][] {
  return terms
    .flatMap(splitSlashOptions)
    .map((term) => (stripLeadingWord(term.trim().toLowerCase(), language).match(WORD) ?? []).map(fold))
    .filter((words) => words.length > 0);
}

/**
 * Splits `text` into plain and bold parts: bold where one of `terms` appears,
 * also in another form (plural, feminine, -ing…). Accents and case don't matter.
 * A multi-word term ("give up") is bold only where its words appear together, in order.
 */
export function highlightTerms(text: string, terms: string[], language?: LanguageCode): TextPart[] {
  const tokens = [...text.matchAll(WORD)].map((found) => ({ start: found.index ?? 0, text: found[0], folded: fold(found[0]) }));
  const bold = tokens.map(() => false);

  for (const words of termWords(terms, language)) {
    for (let i = 0; i + words.length <= tokens.length; i++) {
      if (words.every((word, k) => isFormOf(tokens[i + k].folded, word))) {
        words.forEach((_, k) => (bold[i + k] = true));
      }
    }
  }

  const parts: TextPart[] = [];
  const push = (chunk: string, isBold: boolean) => {
    if (!chunk) {
      return;
    }
    const last = parts[parts.length - 1];
    if (last && last.bold === isBold) {
      last.text += chunk;
    } else {
      parts.push({ text: chunk, bold: isBold });
    }
  };

  let index = 0;
  tokens.forEach((token, i) => {
    // The space between two bold words of "give up" stays bold, so they read as one
    const between = text.slice(index, token.start);
    push(between, bold[i] && i > 0 && bold[i - 1] && between.trim() === '');
    push(token.text, bold[i]);
    index = token.start + token.text.length;
  });
  push(text.slice(index), false);

  return parts;
}

/** Saved examples are "sentence — translation" (see WordForm): the two halves. */
export function splitExample(example: string): { sentence: string; translation?: string } {
  const separator = example.indexOf(' — ');
  return separator < 0
    ? { sentence: example }
    : { sentence: example.slice(0, separator), translation: example.slice(separator + 3) };
}
