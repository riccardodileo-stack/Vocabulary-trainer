// Multiple-choice exercises: a word and four answers, one right.
// Used by "Multiple choice" (the word is shown) and "Listen and choose" (the word is heard).
// The words asked follow the same rules as the written quiz (mode, filters, number).

import { dayKey, type DayKey } from './dates';
import { buildOrderedPool, meaningsInScope, shuffle, type QuizOptions } from './quiz';
import { normalizeText, splitSlashOptions } from './text';
import type { TopicId } from './topics';
import type { Meaning, Word } from './word';

/** Answers shown for each question. */
export const CHOICE_OPTIONS = 4;

export type ChoiceQuestion = {
  /** The word whose stats are updated by the answer. */
  word: Word;
  /** What is shown (or read aloud): the studied word, or a translation when asking backward. */
  prompt: string;
  options: string[];
  correctIndex: number;
  /** Topic of the asked meaning when a topic filter is on (shown as context). */
  topicHint?: TopicId;
};

/** One answer per meaning or word: "colour / color" shows only its first form. */
function short(text: string): string {
  return splitSlashOptions(text)[0] ?? text;
}

/**
 * Wrong answers for a question: first the answers of other words of the same kind (a verb
 * among verbs is harder to spot than a verb among nouns), then of any kind, then `spare`
 * (e.g. the built-in word list) when the vocabulary is still small.
 */
function distractors(correct: string[], sameKind: string[], others: string[], spare: string[], count: number): string[] {
  const taken = new Set(correct.map(normalizeText));
  const result: string[] = [];
  for (const candidate of [...shuffle(sameKind), ...shuffle(others), ...shuffle(spare)]) {
    const key = normalizeText(candidate);
    if (key && !taken.has(key)) {
      taken.add(key);
      result.push(candidate);
      if (result.length === count) {
        break;
      }
    }
  }
  return result;
}

/**
 * The questions of one multiple-choice round.
 * `spareAnswers` are extra wrong answers in the language of the answers, used only when the
 * vocabulary has too few words; a question without at least one wrong answer is skipped.
 */
export function buildChoiceQuiz(
  vocabulary: Word[],
  options: QuizOptions,
  spareAnswers: string[] = [],
  today: DayKey = dayKey()
): ChoiceQuestion[] {
  const forward = options.direction === 'forward';
  const questions: ChoiceQuestion[] = [];
  const asked = new Set<string>();

  for (const word of buildOrderedPool(vocabulary, options, today)) {
    const inScope = meaningsInScope(word, options);
    if (inScope.length === 0) {
      continue;
    }
    const meaning: Meaning = inScope[Math.floor(Math.random() * inScope.length)];
    const prompt = forward ? short(word.term) : short(meaning.text);
    const correct = forward ? short(meaning.text) : short(word.term);
    if (asked.has(normalizeText(prompt))) {
      continue;
    }

    // Everything that would also be right can't be a wrong answer
    const alsoRight = forward
      ? word.meanings.flatMap((m) => splitSlashOptions(m.text))
      : vocabulary
          .filter((other) => other.meanings.some((m) => normalizeText(m.text) === normalizeText(meaning.text)))
          .flatMap((other) => splitSlashOptions(other.term));

    const kind = meaning.partOfSpeech ?? word.partOfSpeech;
    const others = vocabulary.filter((other) => other.id !== word.id);
    const answersOf = (other: Word, sameKind: boolean) =>
      forward
        ? other.meanings.filter((m) => ((m.partOfSpeech ?? other.partOfSpeech) === kind) === sameKind).map((m) => short(m.text))
        : (other.partOfSpeech === kind) === sameKind
          ? [short(other.term)]
          : [];

    const wrong = distractors(
      [correct, ...alsoRight],
      others.flatMap((other) => answersOf(other, true)),
      others.flatMap((other) => answersOf(other, false)),
      spareAnswers.map(short),
      CHOICE_OPTIONS - 1
    );
    if (wrong.length === 0) {
      continue;
    }

    const answers = shuffle([correct, ...wrong]);
    asked.add(normalizeText(prompt));
    questions.push({
      word,
      prompt,
      options: answers,
      correctIndex: answers.indexOf(correct),
      topicHint:
        inScope.length < word.meanings.length
          ? options.topics?.find((topic) => meaning.topics?.includes(topic))
          : undefined,
    });
  }

  return options.mode === 'due' ? shuffle(questions) : questions;
}
