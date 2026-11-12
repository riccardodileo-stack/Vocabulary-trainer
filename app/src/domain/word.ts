// The Word model and the pure functions that create or inspect words.
// No React and no storage here: these functions are easy to test and reuse.

import type { LanguageCode, LanguagePair } from './languages';
import { guessPartOfSpeech, isPartOfSpeech, type PartOfSpeech } from './partOfSpeech';
import { normalizeText, splitSlashOptions } from './text';
import { suggestMeaningTopics } from './topicClassifier';
import { isTopicId, TOPIC_IDS, type TopicId } from './topics';

/**
 * Who decided the kind of word: 'guess' = offline rules (partOfSpeech.ts),
 * 'dictionary' = Wiktionary, 'user' = chosen by hand (never overwritten).
 */
export type PartOfSpeechSource = 'guess' | 'dictionary' | 'user';

export type Meaning = {
  text: string;
  /** Optional hint shown next to the meaning, e.g. "electric", "informal". */
  note?: string;
  /** Context sentences in the studied language. */
  examples: string[];
  /**
   * Topics of THIS meaning ("stroke" = "ictus" -> health, = "bracciata" -> sport).
   * Missing = not classified yet: suggested automatically.
   */
  topics?: TopicId[];
  /** true once the user chose the topics of this meaning: suggestions never overwrite them. */
  topicsByUser?: boolean;
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
  /**
   * Topics of the whole word = those of all its meanings together (kept up to date by
   * createWord / withClassification / the store; used by the quiz filters and counters).
   */
  topics: TopicId[];
  /** @deprecated v3 only (topics per word); read by the v5 migration. */
  topicsByUser?: boolean;
  /** Noun, verb, adjective or other. */
  partOfSpeech: PartOfSpeech;
  partOfSpeechSource: PartOfSpeechSource;
  createdAt: string;
};

export type NewWordInput = {
  term: string;
  meanings: Meaning[];
  level?: CefrLevel;
  tags?: string[];
  /** Missing: guessed automatically (and checked on Wiktionary later). */
  partOfSpeech?: PartOfSpeech;
  partOfSpeechSource?: PartOfSpeechSource;
};

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyStats(): WordStats {
  return { correct: 0, wrong: 0, streak: 0 };
}

export function createWord(pair: LanguagePair, input: NewWordInput): Word {
  const term = input.term.trim();
  return {
    id: createId(),
    sourceLang: pair.source,
    targetLang: pair.target,
    term,
    stats: emptyStats(),
    level: input.level,
    tags: input.tags ?? [],
    ...classification(pair, term, input.meanings, input),
    createdAt: new Date().toISOString(),
  };
}

type Classification = Pick<Word, 'meanings' | 'topics' | 'partOfSpeech' | 'partOfSpeechSource'>;

/** Topics of the whole word: those of its meanings, in the usual order. */
export function topicsOfMeanings(meanings: Meaning[]): TopicId[] {
  const found = new Set(meanings.flatMap((meaning) => meaning.topics ?? []));
  return TOPIC_IDS.filter((topic) => found.has(topic));
}

/**
 * Each meaning keeps the topics it has (chosen by hand or already suggested); the ones
 * without topics get them from the topic network.
 */
export function classifyMeanings(pair: LanguagePair, term: string, meanings: Meaning[]): Meaning[] {
  return meanings.map((meaning) => ({
    ...meaning,
    topics: Array.isArray(meaning.topics)
      ? meaning.topics.filter(isTopicId)
      : suggestMeaningTopics(term, meaning.text, pair, meanings.length === 1),
    topicsByUser: meaning.topicsByUser === true ? true : undefined,
  }));
}

/**
 * Topics (per meaning) and kind of word: the given ones when valid, otherwise suggested
 * by the topic network and guessed by the offline rules.
 */
function classification(
  pair: LanguagePair,
  term: string,
  inputMeanings: Meaning[],
  given: Partial<Record<'partOfSpeech' | 'partOfSpeechSource', unknown>>
): Classification {
  const meanings = classifyMeanings(pair, term, inputMeanings);
  const texts = meanings.map((meaning) => meaning.text);
  const hasKind = isPartOfSpeech(given.partOfSpeech);
  const source = given.partOfSpeechSource;

  return {
    meanings,
    topics: topicsOfMeanings(meanings),
    partOfSpeech: hasKind ? (given.partOfSpeech as PartOfSpeech) : guessPartOfSpeech(term, texts, pair),
    partOfSpeechSource:
      hasKind && (source === 'dictionary' || source === 'user' || source === 'guess') ? source : hasKind ? 'user' : 'guess',
  };
}

/**
 * Fills the topics and the kind of a word saved before they existed (or read from an old
 * backup); valid values already there are kept.
 */
export function withClassification(
  word: Omit<Word, 'topics' | 'partOfSpeech' | 'partOfSpeechSource'> & Partial<Classification>
): Word {
  return {
    ...word,
    ...classification({ source: word.sourceLang, target: word.targetLang }, word.term, word.meanings, word),
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
