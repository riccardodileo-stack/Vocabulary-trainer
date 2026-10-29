// Pure text helpers shared by the word list, the quiz and the import.

import type { LanguageCode } from './languages';

export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** "perché" -> "perche": used only to forgive missing accents, never to store text. */
export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** "batteria / pila" -> ["batteria", "pila"] (the format used by the PWA). */
export function splitSlashOptions(text: string): string[] {
  return text
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Small words that may or may not be written before the answer:
 * "the battery" = "battery", "to run" = "run", "la casa" = "casa".
 */
const LEADING_WORDS: Record<LanguageCode, string[]> = {
  en: ['the', 'a', 'an', 'to'],
  it: ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', "l'", "un'"],
  es: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'],
  fr: ['le', 'la', 'les', 'un', 'une', 'des', "l'", 'se', "s'"],
  de: ['der', 'die', 'das', 'ein', 'eine', 'einen'],
};

function stripLeadingWord(text: string, language: LanguageCode | undefined): string {
  if (!language) {
    return text;
  }

  for (const word of LEADING_WORDS[language]) {
    // "l'" and "un'" are glued to the next word, the others are followed by a space
    const prefix = word.endsWith("'") ? word : `${word} `;
    if (text.startsWith(prefix) && text.length > prefix.length) {
      return text.slice(prefix.length).trim();
    }
  }
  return text;
}

/** Form used to compare answers: lower case, single spaces, ’ written as ', no leading article. */
function comparable(text: string, language?: LanguageCode): string {
  return stripLeadingWord(normalizeText(text).replace(/[’`]/g, "'"), language);
}

/** Number of single-letter edits (insert, delete, replace) that turn `a` into `b`. */
export function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

/** Below this length one wrong letter often makes another word ("casa" / "cosa"). */
export const TYPO_MIN_LENGTH = 6;

/**
 * - correct: one of the accepted answers (case, extra spaces and articles are ignored)
 * - almost:  the right word with a missing accent or one wrong letter. It counts as
 *            correct, but the quiz shows the right spelling.
 * - wrong:   anything else
 */
export type AnswerVerdict = 'correct' | 'almost' | 'wrong';

function verdictForOption(option: string, accepted: string[]): AnswerVerdict {
  if (accepted.includes(option)) {
    return 'correct';
  }

  const plain = removeAccents(option);
  const acceptedPlain = accepted.map(removeAccents);

  if (acceptedPlain.includes(plain)) {
    return 'almost';
  }
  if (plain.length >= TYPO_MIN_LENGTH && acceptedPlain.some((answer) => editDistance(answer, plain) <= 1)) {
    return 'almost';
  }
  return 'wrong';
}

/**
 * Checks every option written by the user: "pila", "batteria" and "pila / batteria"
 * are all right for ["batteria", "pila"]. The result is the worst verdict among the options.
 * `language` is the language the answer is written in, used to ignore its articles.
 */
export function evaluateAnswer(userAnswer: string, acceptedAnswers: string[], language?: LanguageCode): AnswerVerdict {
  const options = splitSlashOptions(userAnswer).map((option) => comparable(option, language));
  const accepted = acceptedAnswers.flatMap(splitSlashOptions).map((answer) => comparable(answer, language));

  if (options.length === 0 || accepted.length === 0) {
    return 'wrong';
  }

  const verdicts = options.map((option) => verdictForOption(option, accepted));

  if (verdicts.includes('wrong')) {
    return 'wrong';
  }
  return verdicts.includes('almost') ? 'almost' : 'correct';
}

/** True if the answer counts as right ("almost" included). */
export function isAnswerAccepted(userAnswer: string, acceptedAnswers: string[], language?: LanguageCode): boolean {
  return evaluateAnswer(userAnswer, acceptedAnswers, language) !== 'wrong';
}
