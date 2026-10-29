// Backup files: the app exports its own format and imports both that
// and the files exported by the old PWA ({ english, italian } words).

import { isLanguageCode, type LanguagePair } from './languages';
import { normalizeText } from './text';
import { createWord, emptyStats, meaningsFromSlashText, type Meaning, type Word } from './word';

const BACKUP_APP_NAME = 'Vocabulary Trainer';
const BACKUP_VERSION = 2;

/** Words of the PWA were always English -> Italian. */
const PWA_PAIR: LanguagePair = { source: 'en', target: 'it' };

export function createBackup(words: Word[]) {
  return {
    app: BACKUP_APP_NAME,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    words,
  };
}

export function backupFileName(): string {
  return `vocabulary-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseMeaning(value: unknown): Meaning | null {
  if (!isRecord(value) || typeof value.text !== 'string' || !value.text.trim()) {
    return null;
  }

  return {
    text: value.text.trim(),
    note: typeof value.note === 'string' && value.note.trim() ? value.note.trim() : undefined,
    examples: Array.isArray(value.examples) ? value.examples.filter((e): e is string => typeof e === 'string') : [],
  };
}

/** A word in the current format; stats and tags are kept when present. */
function parseAppWord(item: Record<string, unknown>): Word | null {
  if (!isLanguageCode(item.sourceLang) || !isLanguageCode(item.targetLang) || typeof item.term !== 'string') {
    return null;
  }

  const meanings = Array.isArray(item.meanings)
    ? item.meanings.map(parseMeaning).filter((meaning): meaning is Meaning => meaning !== null)
    : [];

  if (!item.term.trim() || meanings.length === 0) {
    return null;
  }

  const word = createWord({ source: item.sourceLang, target: item.targetLang }, { term: item.term, meanings });
  const stats = isRecord(item.stats) ? item.stats : {};

  return {
    ...word,
    stats: {
      ...emptyStats(),
      correct: typeof stats.correct === 'number' ? stats.correct : 0,
      wrong: typeof stats.wrong === 'number' ? stats.wrong : 0,
      streak: typeof stats.streak === 'number' ? stats.streak : 0,
      lastWrongAt: typeof stats.lastWrongAt === 'string' ? stats.lastWrongAt : undefined,
    },
    tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : word.createdAt,
  };
}

function parsePwaWord(item: Record<string, unknown>): Word | null {
  if (typeof item.english !== 'string' || typeof item.italian !== 'string') {
    return null;
  }

  const meanings = meaningsFromSlashText(item.italian);
  if (!item.english.trim() || meanings.length === 0) {
    return null;
  }

  return createWord(PWA_PAIR, { term: item.english, meanings });
}

export type ParsedBackup = {
  words: Word[];
  /** Entries that could not be read. */
  invalidCount: number;
};

/** Accepts a backup object or a plain array of words. Returns null if the format is unknown. */
export function parseBackup(json: string): ParsedBackup | null {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }

  const items = Array.isArray(data) ? data : isRecord(data) && Array.isArray(data.words) ? data.words : null;
  if (!items) {
    return null;
  }

  const words: Word[] = [];
  let invalidCount = 0;

  for (const item of items) {
    const word = isRecord(item) ? (parseAppWord(item) ?? parsePwaWord(item)) : null;
    if (word) {
      words.push(word);
    } else {
      invalidCount += 1;
    }
  }

  return { words, invalidCount };
}

export type MergeResult = {
  words: Word[];
  added: number;
  /** Existing words that received new meanings. */
  updated: number;
  skipped: number;
};

/**
 * Adds imported words to the existing ones. A word already present in the same pair
 * is not duplicated: only its missing meanings are added.
 */
export function mergeWords(existing: Word[], imported: Word[]): MergeResult {
  const words = [...existing];
  let added = 0;
  let updated = 0;
  let skipped = 0;

  const keyOf = (word: Word) => `${word.sourceLang}|${word.targetLang}|${normalizeText(word.term)}`;
  const indexByKey = new Map(words.map((word, index) => [keyOf(word), index]));

  for (const word of imported) {
    const index = indexByKey.get(keyOf(word));

    if (index === undefined) {
      indexByKey.set(keyOf(word), words.length);
      words.push(word);
      added += 1;
      continue;
    }

    const current = words[index];
    const known = new Set(current.meanings.map((meaning) => normalizeText(meaning.text)));
    const newMeanings = word.meanings.filter((meaning) => !known.has(normalizeText(meaning.text)));

    if (newMeanings.length === 0) {
      skipped += 1;
    } else {
      words[index] = { ...current, meanings: [...current.meanings, ...newMeanings] };
      updated += 1;
    }
  }

  return { words, added, updated, skipped };
}
