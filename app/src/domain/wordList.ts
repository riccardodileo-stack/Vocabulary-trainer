// Reads a list of words written by hand or exported from a spreadsheet, one per line:
//   stroke - colpo, ictus
//   barracks = caserma
//   to heal;guarire
//   house<TAB>casa
// The first separator found divides the word from its translations; the translations
// are divided by comma, semicolon or "|".

import { normalizeText } from './text';

export type ListEntry = {
  term: string;
  meanings: string[];
};

export type ParsedList = {
  entries: ListEntry[];
  /** Lines that have text but no word-translation pair. */
  invalidLines: string[];
};

/** Tried in this order: the clearest ones first, the comma (also used between translations) last. */
const SEPARATORS = ['\t', ' – ', ' — ', ' - ', ' = ', '=', ';', ' : ', ':', ','];

/** Lines kept at most: a pasted book shouldn't freeze the phone. */
export const MAX_LIST_LINES = 2000;

function clean(text: string): string {
  return text.replace(/^["'“”\s]+|["'“”\s]+$/g, '').replace(/\s+/g, ' ');
}

function parseLine(line: string): ListEntry | null {
  for (const separator of SEPARATORS) {
    const index = line.indexOf(separator);
    if (index <= 0) {
      continue;
    }
    const term = clean(line.slice(0, index));
    const meanings = line
      .slice(index + separator.length)
      .split(/[;,|\t]/)
      .map(clean)
      .filter(Boolean);
    if (term && meanings.length > 0) {
      return { term, meanings: [...new Set(meanings)] };
    }
  }
  return null;
}

export function parseWordList(text: string): ParsedList {
  const entries: ListEntry[] = [];
  const byTerm = new Map<string, ListEntry>();
  const invalidLines: string[] = [];

  const lines = text
    .split(/\r?\n/)
    // Bullets and numbers of a list ("- ", "• ", "1. ", "2) ") are not part of the word
    .map((line) => line.replace(/^\s*(?:[-•*]\s+|\d+[.)]\s+)/, '').trim())
    .filter((line) => line && !line.startsWith('#'))
    .slice(0, MAX_LIST_LINES);

  for (const line of lines) {
    const entry = parseLine(line);
    if (!entry) {
      invalidLines.push(line);
      continue;
    }
    // The same word twice: one entry with all its translations
    const key = normalizeText(entry.term);
    const same = byTerm.get(key);
    if (same) {
      const known = new Set(same.meanings.map(normalizeText));
      same.meanings.push(...entry.meanings.filter((meaning) => !known.has(normalizeText(meaning))));
    } else {
      byTerm.set(key, entry);
      entries.push(entry);
    }
  }
  return { entries, invalidLines };
}
