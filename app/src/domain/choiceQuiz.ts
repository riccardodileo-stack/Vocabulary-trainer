// Multiple-choice questions: a word and four answers, one right.
// Used by "Multiple choice" (the word is shown; only words below CHOICE_MAX_BOX) and by
// "Listen and choose" (the word is only heard). Wrong answers look like the right one:
// at least one written in a similar way (though / through) and the others of the same kind
// of word and topic when possible, so the answer can't be guessed by elimination.

import { dayKey, type DayKey } from './dates';
import type { PartOfSpeech } from './partOfSpeech';
import { meaningsInScope, quizPool, shuffle, type QuizOptions } from './quiz';
import { compareByUrgency, reviewBox } from './review';
import { normalizeText, splitSlashOptions } from './text';
import type { TopicId } from './topics';
import { CHOICE_MAX_BOX, type Meaning, type Word } from './word';

/** Answers shown for each question. */
export const CHOICE_OPTIONS = 4;

/** From this spelling similarity (0–1) a wrong answer counts as a "look-alike". */
export const LOOK_ALIKE_MIN = 0.5;

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

/** A possible wrong answer, with what makes it look like the right one. */
export type AnswerCandidate = {
  text: string;
  kind?: PartOfSpeech;
  topics: TopicId[];
  /** From the user's vocabulary (preferred to the built-in list when as similar). */
  own?: boolean;
};

export type ChoiceOptions = QuizOptions & {
  /** Only words below CHOICE_MAX_BOX (the multiple-choice exercise); listening asks every word. */
  belowChoiceBox?: boolean;
};

/** One answer per meaning or word: "colour / color" shows only its first form. */
function short(text: string): string {
  return splitSlashOptions(text)[0] ?? text;
}

/** Edit distance between two strings (insert, delete, change one letter). */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

/** How alike two answers are written, from 0 (nothing in common) to 1 (the same). */
export function spellingSimilarity(a: string, b: string): number {
  const x = normalizeText(a);
  const y = normalizeText(b);
  const longest = Math.max(x.length, y.length);
  return longest === 0 ? 1 : 1 - editDistance(x, y) / longest;
}

/**
 * Wrong answers for a question: the most similar written candidate if it is a look-alike,
 * then the others by score: same kind of word (2), a topic in common (1), from the user's
 * own words (½); random within the same score. Answers that would also be right are never used.
 */
export function pickDistractors(
  correct: AnswerCandidate,
  alsoRight: string[],
  candidates: AnswerCandidate[],
  count: number = CHOICE_OPTIONS - 1
): string[] {
  const taken = new Set([correct.text, ...alsoRight].map(normalizeText));
  const unique: AnswerCandidate[] = [];
  for (const candidate of shuffle(candidates)) {
    const key = normalizeText(candidate.text);
    if (key && !taken.has(key)) {
      taken.add(key);
      unique.push(candidate);
    }
  }

  const result: AnswerCandidate[] = [];
  const lookAlike = unique
    .map((candidate) => ({ candidate, similarity: spellingSimilarity(candidate.text, correct.text) }))
    .filter(({ similarity }) => similarity >= LOOK_ALIKE_MIN)
    .sort((a, b) => b.similarity - a.similarity)[0];
  if (lookAlike) {
    result.push(lookAlike.candidate);
  }

  const score = (candidate: AnswerCandidate) =>
    (correct.kind && candidate.kind === correct.kind ? 2 : 0) +
    (candidate.topics.some((topic) => correct.topics.includes(topic)) ? 1 : 0) +
    (candidate.own ? 0.5 : 0);
  // Stable sort of a shuffled list: random within the same score
  const rest = unique.filter((candidate) => candidate !== lookAlike?.candidate).sort((a, b) => score(b) - score(a));
  for (const candidate of rest) {
    if (result.length >= count) {
      break;
    }
    result.push(candidate);
  }
  return result.map((candidate) => candidate.text);
}

/** Words asked: those of the quiz options, the most urgent first, at most `count`. */
function choicePool(vocabulary: Word[], options: ChoiceOptions, today: DayKey): Word[] {
  const pool = shuffle(quizPool(vocabulary, options, today)).filter(
    (word) => !options.belowChoiceBox || reviewBox(word) < CHOICE_MAX_BOX
  );
  return options.mode === 'due' || options.belowChoiceBox ? pool.sort(compareByUrgency(today)) : pool;
}

/**
 * The questions of one multiple-choice round.
 * `spare` are extra candidates in the language of the answers (e.g. the built-in word
 * list), used when the vocabulary has too few words; a question without at least one wrong
 * answer is skipped.
 */
export function buildChoiceQuiz(
  vocabulary: Word[],
  options: ChoiceOptions,
  spare: AnswerCandidate[] = [],
  today: DayKey = dayKey()
): ChoiceQuestion[] {
  const forward = options.direction === 'forward';
  const limit = options.count > 0 ? options.count : Infinity;
  const questions: ChoiceQuestion[] = [];
  const asked = new Set<string>();

  for (const word of choicePool(vocabulary, options, today)) {
    if (questions.length >= limit) {
      break;
    }
    const inScope = meaningsInScope(word, options.topics);
    if (inScope.length === 0) {
      continue;
    }
    const meaning: Meaning = inScope[Math.floor(Math.random() * inScope.length)];
    const prompt = forward ? short(word.term) : short(meaning.text);
    const correctText = forward ? short(meaning.text) : short(word.term);
    if (!options.allowRepeatedPrompts && asked.has(normalizeText(prompt))) {
      continue;
    }

    // Everything that would also be right can't be a wrong answer
    const alsoRight = forward
      ? word.meanings.flatMap((m) => splitSlashOptions(m.text))
      : vocabulary
          .filter((other) => other.meanings.some((m) => normalizeText(m.text) === normalizeText(meaning.text)))
          .flatMap((other) => splitSlashOptions(other.term));

    const candidates: AnswerCandidate[] = [
      ...vocabulary
        .filter((other) => other.id !== word.id)
        .flatMap((other) =>
          forward
            ? other.meanings.map((m) => ({
                text: short(m.text),
                kind: other.partOfSpeech,
                topics: m.topics ?? other.topics,
                own: true,
              }))
            : [{ text: short(other.term), kind: other.partOfSpeech, topics: other.topics, own: true }]
        ),
      ...spare.map((candidate) => ({ ...candidate, text: short(candidate.text) })),
    ];
    const correct: AnswerCandidate = { text: correctText, kind: word.partOfSpeech, topics: meaning.topics ?? word.topics };
    const wrong = pickDistractors(correct, alsoRight, candidates);
    if (wrong.length === 0) {
      continue;
    }

    const answers = shuffle([correctText, ...wrong]);
    asked.add(normalizeText(prompt));
    questions.push({
      word,
      prompt,
      options: answers,
      correctIndex: answers.indexOf(correctText),
      topicHint:
        inScope.length < word.meanings.length
          ? options.topics?.find((topic) => meaning.topics?.includes(topic))
          : undefined,
    });
  }

  return questions;
}
