// Quiz rules: which words are asked, what is shown and which answers are accepted.

import { normalizeText, splitSlashOptions } from './text';
import { meaningsToText, type Word } from './word';

/** 'forward' asks the studied word, 'backward' asks the translation. */
export type QuizDirection = 'forward' | 'backward';

/** 'all' uses every word of the pair, 'mistakes' only the words to review. */
export type QuizMode = 'all' | 'mistakes';

export type QuizOptions = {
  direction: QuizDirection;
  mode: QuizMode;
  /** Maximum number of questions; 0 means every word. */
  count: number;
};

export type QuizQuestion = {
  /** The word whose stats are updated by the answer. */
  word: Word;
  prompt: string;
  /** Hint shown under the prompt, e.g. "electric". */
  note?: string;
  accepted: string[];
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
    correctText: accepted.join(' / '),
  };
}

/**
 * The questions of one quiz, in random order.
 * `vocabulary` is the whole language pair, used to accept synonyms.
 */
export function buildQuiz(vocabulary: Word[], { direction, mode, count }: QuizOptions): QuizQuestion[] {
  const pool = shuffle(mode === 'mistakes' ? vocabulary.filter(isMistake) : vocabulary);
  const limit = count > 0 ? count : pool.length;
  const questions: QuizQuestion[] = [];
  const askedPrompts = new Set<string>();

  for (const word of pool) {
    if (questions.length >= limit) {
      break;
    }
    if (word.meanings.length === 0) {
      continue;
    }

    const question = direction === 'forward' ? forwardQuestion(word) : backwardQuestion(word, vocabulary);

    // Two words with the same translation would produce the same question twice
    if (!askedPrompts.has(normalizeText(question.prompt))) {
      askedPrompts.add(normalizeText(question.prompt));
      questions.push(question);
    }
  }

  return questions;
}
