// Quiz rules: which words are asked, what is shown and which answers are accepted.

import { dayKey, type DayKey } from './dates';
import type { LanguageCode } from './languages';
import { parsePartOfSpeechList, type PartOfSpeech } from './partOfSpeech';
import { compareByUrgency, isDue } from './review';
import { normalizeText, splitSlashOptions } from './text';
import { parseTopicList, type TopicId } from './topics';
import { type Meaning, type Word } from './word';

/** 'forward' asks the studied word, 'backward' asks the translation. */
export type QuizDirection = 'forward' | 'backward';

/**
 * Which words the quiz uses:
 * - 'due':      words whose spaced-repetition review is due today (the default)
 * - 'all':      every word of the pair, in random order
 * - 'mistakes': words answered wrong and not yet fixed
 */
export type QuizMode = 'due' | 'all' | 'mistakes';

export const QUIZ_MODES: QuizMode[] = ['due', 'all', 'mistakes'];

export type QuizOptions = {
  direction: QuizDirection;
  mode: QuizMode;
  /** Maximum number of questions; 0 means every word. */
  count: number;
  /** If set, only these words are used (e.g. the words added today from Home). */
  wordIds?: string[];
  /** Only words with at least one of these topics; empty or missing = every topic. */
  topics?: TopicId[];
  /** Only these kinds of word (e.g. only verbs); empty or missing = every kind. */
  partsOfSpeech?: PartOfSpeech[];
};

type Filters = Pick<QuizOptions, 'topics' | 'partsOfSpeech'>;

/** Route params of the exercise screens (all text, as they travel in the address). */
export type QuizParams = { direction?: string; mode?: string; count?: string; ids?: string; topics?: string; kinds?: string };

/** Route params -> quiz options; anything missing or wrong falls back to "all words, forward". */
export function quizOptionsFromParams(params: QuizParams): QuizOptions {
  const ids = params.ids?.split(',').filter(Boolean);
  return {
    direction: params.direction === 'backward' ? 'backward' : 'forward',
    mode: QUIZ_MODES.includes(params.mode as QuizMode) ? (params.mode as QuizMode) : 'all',
    count: Number(params.count) || 0,
    wordIds: ids && ids.length > 0 ? ids : undefined,
    topics: parseTopicList(params.topics),
    partsOfSpeech: parsePartOfSpeechList(params.kinds),
  };
}

/** Whether ONE meaning passes the filters: one of the topics (if any) and one of the kinds (if any). */
function meaningMatches(word: Word, meaning: Meaning, { topics, partsOfSpeech }: Filters): boolean {
  const topicOk = !topics?.length || (meaning.topics ?? []).some((topic) => topics.includes(topic));
  const kindOk = !partsOfSpeech?.length || partsOfSpeech.includes(meaning.partOfSpeech ?? word.partOfSpeech);
  return topicOk && kindOk;
}

/** Whether a word passes the filters: at least one of its meanings does. */
export function matchesFilters(word: Word, filters: Filters): boolean {
  if (!filters.topics?.length && !filters.partsOfSpeech?.length) {
    return true;
  }
  return word.meanings.some((meaning) => meaningMatches(word, meaning, filters));
}

export type QuizQuestion = {
  /** The word whose stats are updated by the answer. */
  word: Word;
  prompt: string;
  /** Hint shown under the prompt, e.g. "electric". */
  note?: string;
  accepted: string[];
  /**
   * With a topic filter, the topic the asked meanings belong to: shown under the prompt so
   * "stroke" in a health quiz is clearly "ictus", not "colpo".
   */
  topicHint?: TopicId;
  /** Language the answer is written in (to ignore its articles). */
  answerLanguage: LanguageCode;
  correctText: string;
};

/** Correct answers in a row needed to take a word out of the mistakes review. */
export const MISTAKE_CLEAR_STREAK = 2;

export const QUIZ_COUNTS = [10, 20, 0] as const;

/** Limits of the custom number of questions. */
export const QUIZ_CUSTOM_MIN = 1;
export const QUIZ_CUSTOM_MAX = 200;
export const QUIZ_CUSTOM_DEFAULT = 15;

/** A custom number of questions, made whole and kept within the limits. */
export function clampQuizCount(count: number): number {
  if (!Number.isFinite(count)) {
    return QUIZ_CUSTOM_DEFAULT;
  }
  return Math.min(Math.max(Math.round(count), QUIZ_CUSTOM_MIN), QUIZ_CUSTOM_MAX);
}

export function isMistake(word: Word): boolean {
  return word.stats.lastWrongAt !== undefined && word.stats.streak < MISTAKE_CLEAR_STREAK;
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Words a quiz with these options can ask, before the question limit. Used for counters too. */
export function quizPool(
  vocabulary: Word[],
  { mode, wordIds, topics, partsOfSpeech }: Pick<QuizOptions, 'mode' | 'wordIds' | 'topics' | 'partsOfSpeech'>,
  today: DayKey = dayKey()
): Word[] {
  const words = vocabulary.filter(
    (word) => (!wordIds || wordIds.includes(word.id)) && matchesFilters(word, { topics, partsOfSpeech })
  );

  switch (mode) {
    case 'due':
      return words.filter((word) => isDue(word, today));
    case 'mistakes':
      return words.filter(isMistake);
    default:
      return words;
  }
}

/** Studied words that have this translation: "noioso" -> ["boring", "dull"]. */
function termsWithMeaning(vocabulary: Word[], meaningText: string): string[] {
  const target = normalizeText(meaningText);
  const terms = vocabulary
    .filter((word) => word.meanings.some((meaning) => normalizeText(meaning.text) === target))
    .flatMap((word) => splitSlashOptions(word.term));

  return [...new Set(terms)];
}

/**
 * The meanings a quiz asks: with filters only those that pass them (in a health quiz
 * "stroke" asks "ictus", not "colpo"; with "verbs" it asks "accarezzare"), otherwise all.
 */
export function meaningsInScope(word: Word, filters: Filters = {}): Meaning[] {
  if (!filters.topics?.length && !filters.partsOfSpeech?.length) {
    return word.meanings;
  }
  const inScope = word.meanings.filter((meaning) => meaningMatches(word, meaning, filters));
  return inScope.length > 0 ? inScope : word.meanings;
}

/** The first chosen topic the meanings belong to (for the hint under the prompt). */
function hintFor(meanings: Meaning[], topics?: TopicId[]): TopicId | undefined {
  return topics?.find((topic) => meanings.some((meaning) => meaning.topics?.includes(topic)));
}

function forwardQuestion(word: Word, filters: Filters): QuizQuestion {
  const meanings = meaningsInScope(word, filters);
  return {
    word,
    prompt: word.term,
    accepted: meanings.map((meaning) => meaning.text),
    topicHint: meanings.length < word.meanings.length ? hintFor(meanings, filters.topics) : undefined,
    answerLanguage: word.targetLang,
    correctText: meanings.map((meaning) => meaning.text).join(' / '),
  };
}

/** Asks one translation only; every studied word with that translation is accepted. */
function backwardQuestion(word: Word, vocabulary: Word[], filters: Filters): QuizQuestion {
  const meaning = randomItem(meaningsInScope(word, filters));
  const accepted = termsWithMeaning(vocabulary, meaning.text);

  return {
    word,
    prompt: meaning.text,
    note: meaning.note,
    accepted,
    answerLanguage: word.sourceLang,
    correctText: accepted.join(' / '),
  };
}

/**
 * The questions of one quiz, in random order.
 * `vocabulary` is the whole language pair, used to accept synonyms.
 * In 'due' mode the most overdue words are chosen first when there are more than `count`.
 */
/**
 * The words one round asks, cut to the number of questions: random, except in 'due' mode
 * where the most overdue come first. Shared by the written quiz and the choice exercises.
 */
export function buildOrderedPool(vocabulary: Word[], options: QuizOptions, today: DayKey = dayKey()): Word[] {
  const pool = shuffle(quizPool(vocabulary, options, today)).filter((word) => word.meanings.length > 0);
  const ordered = options.mode === 'due' ? pool.sort(compareByUrgency(today)) : pool;
  return options.count > 0 ? ordered.slice(0, options.count) : ordered;
}

export function buildQuiz(vocabulary: Word[], options: QuizOptions, today: DayKey = dayKey()): QuizQuestion[] {
  const pool = shuffle(quizPool(vocabulary, options, today));
  const ordered = options.mode === 'due' ? pool.sort(compareByUrgency(today)) : pool;
  const limit = options.count > 0 ? options.count : ordered.length;

  const questions: QuizQuestion[] = [];
  const askedPrompts = new Set<string>();

  for (const word of ordered) {
    if (questions.length >= limit) {
      break;
    }
    if (word.meanings.length === 0) {
      continue;
    }

    const question =
      options.direction === 'forward'
        ? forwardQuestion(word, options)
        : backwardQuestion(word, vocabulary, options);

    // Two words with the same translation would produce the same question twice
    if (!askedPrompts.has(normalizeText(question.prompt))) {
      askedPrompts.add(normalizeText(question.prompt));
      questions.push(question);
    }
  }

  // The urgency order decides which words are asked, not in which order
  return options.mode === 'due' ? shuffle(questions) : questions;
}
