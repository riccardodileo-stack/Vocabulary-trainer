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

export const QUIZ_BLOCK_SIZE = 50;

export function compareWordsOldestFirst(a: Word, b: Word): number {
  return (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0);
}

export function getQuizBlocks(words: Word[]): Word[][] {
  const ordered = [...words].sort(compareWordsOldestFirst);
  const blocks: Word[][] = [];

  for (let start = 0; start < ordered.length; start += QUIZ_BLOCK_SIZE) {
    blocks.push(ordered.slice(start, start + QUIZ_BLOCK_SIZE));
  }

  return blocks;
}

export type QuizOptions = {
  direction: QuizDirection;
  mode: QuizMode;
  /** Maximum number of questions; 0 means every word. */
  count: number;
  /** If set, only these words are used (e.g. the words added today from Home). */
  wordIds?: string[];
  /** Blocks ask every word, even when two words produce the same prompt. */
  allowRepeatedPrompts?: boolean;
  /** Only words with at least one of these topics; empty or missing = every topic. */
  topics?: TopicId[];
  /** Only these kinds of word (e.g. only verbs); empty or missing = every kind. */
  partsOfSpeech?: PartOfSpeech[];
};

/** Quiz options as route params (all strings), shared by the quiz and the other exercises. */
export type QuizParams = {
  direction?: string;
  mode?: string;
  count?: string;
  ids?: string;
  topics?: string;
  kinds?: string;
  blockId?: string;
};

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

/** Whether a word passes the topic and kind filters of the quiz. */
export function matchesFilters(word: Word, { topics, partsOfSpeech }: Pick<QuizOptions, 'topics' | 'partsOfSpeech'>): boolean {
  const topicOk = !topics?.length || word.topics.some((topic) => topics.includes(topic));
  const kindOk = !partsOfSpeech?.length || partsOfSpeech.includes(word.partOfSpeech);
  return topicOk && kindOk;
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
 * The meanings a quiz asks: with a topic filter only those with one of the topics
 * (in a health quiz "stroke" asks "ictus", not "colpo"), otherwise all.
 */
export function meaningsInScope(word: Word, topics?: TopicId[]): Meaning[] {
  if (!topics?.length) {
    return word.meanings;
  }
  const inScope = word.meanings.filter((meaning) => meaning.topics?.some((topic) => topics.includes(topic)));
  return inScope.length > 0 ? inScope : word.meanings;
}

/** The first chosen topic the meanings belong to (for the hint under the prompt). */
function hintFor(meanings: Meaning[], topics?: TopicId[]): TopicId | undefined {
  return topics?.find((topic) => meanings.some((meaning) => meaning.topics?.includes(topic)));
}

function forwardQuestion(word: Word, topics?: TopicId[]): QuizQuestion {
  const meanings = meaningsInScope(word, topics);
  return {
    word,
    prompt: word.term,
    accepted: meanings.map((meaning) => meaning.text),
    topicHint: meanings.length < word.meanings.length ? hintFor(meanings, topics) : undefined,
    answerLanguage: word.targetLang,
    correctText: meanings.map((meaning) => meaning.text).join(' / '),
  };
}

/** Asks one translation only; every studied word with that translation is accepted. */
function backwardQuestion(word: Word, vocabulary: Word[], topics?: TopicId[]): QuizQuestion {
  const meaning = randomItem(meaningsInScope(word, topics));
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
        ? forwardQuestion(word, options.topics)
        : backwardQuestion(word, vocabulary, options.topics);


    // Two words with the same translation would produce the same question twice
    const prompt = normalizeText(question.prompt);
    if (options.allowRepeatedPrompts || !askedPrompts.has(prompt)) {
      askedPrompts.add(prompt);
      questions.push(question);
    }
  }

  // The urgency order decides which words are asked, not in which order
  return options.mode === 'due' ? shuffle(questions) : questions;
}

/**
 * Dictation ("Listen and write"): the studied word is only heard and has to be written as
 * it is spelled. Same words as a forward quiz with these options; every form of
 * "colour / color" is accepted.
 */
export function buildDictation(vocabulary: Word[], options: QuizOptions, today: DayKey = dayKey()): QuizQuestion[] {
  return buildQuiz(vocabulary, { ...options, direction: 'forward' }, today).map(({ word }) => ({
    word,
    prompt: word.term,
    accepted: splitSlashOptions(word.term),
    answerLanguage: word.sourceLang,
    correctText: word.term,
  }));
}
