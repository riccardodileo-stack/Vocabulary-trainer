// Quiz rules: which words are asked, what is shown and which answers are accepted.

import { dayKey, type DayKey } from './dates';
import type { LanguageCode } from './languages';
import { compareByUrgency, isDue } from './review';
import { normalizeText, splitSlashOptions } from './text';
import { meaningsToText, type Word } from './word';

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
};

export type QuizQuestion = {
  /** The word whose stats are updated by the answer. */
  word: Word;
  prompt: string;
  /** Hint shown under the prompt, e.g. "electric". */
  note?: string;
  accepted: string[];
  /** Language the answer is written in (to ignore its articles). */
  answerLanguage: LanguageCode;
  correctText: string;
};

/** Correct answers in a row needed to take a word out of the mistakes review. */
export const MISTAKE_CLEAR_STREAK = 2;

export const QUIZ_COUNTS = [10, 20, 0] as const;

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
export function quizPool(vocabulary: Word[], { mode, wordIds }: Pick<QuizOptions, 'mode' | 'wordIds'>, today: DayKey = dayKey()): Word[] {
  const words = wordIds ? vocabulary.filter((word) => wordIds.includes(word.id)) : vocabulary;

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

function forwardQuestion(word: Word): QuizQuestion {
  return {
    word,
    prompt: word.term,
    accepted: word.meanings.map((meaning) => meaning.text),
    answerLanguage: word.targetLang,
    correctText: meaningsToText(word),
  };
}

/** Asks one translation only; every studied word with that translation is accepted. */
function backwardQuestion(word: Word, vocabulary: Word[]): QuizQuestion {
  const meaning = randomItem(word.meanings);
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

    const question = options.direction === 'forward' ? forwardQuestion(word) : backwardQuestion(word, vocabulary);

    // Two words with the same translation would produce the same question twice
    if (!askedPrompts.has(normalizeText(question.prompt))) {
      askedPrompts.add(normalizeText(question.prompt));
      questions.push(question);
    }
  }

  // The urgency order decides which words are asked, not in which order
  return options.mode === 'due' ? shuffle(questions) : questions;
}
