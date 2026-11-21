import { describe, expect, it } from '@jest/globals';

import {
  buildChoiceQuiz,
  CHOICE_OPTIONS,
  pickDistractors,
  spellingSimilarity,
  type AnswerCandidate,
} from '../choiceQuiz';
import { CHOICE_MAX_BOX, emptyStats, statsAfterAnswer, statsAfterChoice, type WordStats } from '../word';
import { makeWord } from './helpers';

const NOW = new Date('2026-11-21T10:00:00Z');
const stats = (streak: number, halfStep = false): WordStats => ({ ...emptyStats(), streak, halfStep });

describe('statsAfterChoice', () => {
  it('adds half a box: two right answers make one box', () => {
    const once = statsAfterChoice(stats(1), true, NOW);
    expect(once).toMatchObject({ streak: 1, halfStep: true, correct: 1 });
    const twice = statsAfterChoice(once, true, NOW);
    expect(twice).toMatchObject({ streak: 2, halfStep: false, correct: 2 });
    expect(twice.lastAnsweredAt).toBe(NOW.toISOString());
  });

  it('never goes beyond CHOICE_MAX_BOX', () => {
    expect(statsAfterChoice(stats(CHOICE_MAX_BOX - 1, true), true, NOW)).toMatchObject({ streak: CHOICE_MAX_BOX, halfStep: false });
    expect(statsAfterChoice(stats(CHOICE_MAX_BOX), true, NOW)).toMatchObject({ streak: CHOICE_MAX_BOX, halfStep: false });
    expect(statsAfterChoice(stats(4), true, NOW)).toMatchObject({ streak: 4 });
  });

  it('loses one box with a wrong answer, keeping the half', () => {
    expect(statsAfterChoice(stats(2, true), false, NOW)).toMatchObject({ streak: 1, halfStep: true, wrong: 1 });
    expect(statsAfterChoice(stats(0, true), false, NOW)).toMatchObject({ streak: 0, halfStep: false });
    expect(statsAfterChoice(stats(0), false, NOW).lastWrongAt).toBe(NOW.toISOString());
  });

  it('a written answer keeps the half when right and drops it when wrong', () => {
    expect(statsAfterAnswer(stats(1, true), true, NOW)).toMatchObject({ streak: 2, halfStep: true });
    expect(statsAfterAnswer(stats(1, true), false, NOW)).toMatchObject({ streak: 0, halfStep: false });
  });
});

describe('spellingSimilarity', () => {
  it('is high for look-alike words and low for different ones', () => {
    expect(spellingSimilarity('though', 'through')).toBeGreaterThan(0.8);
    expect(spellingSimilarity('Casa', 'casa')).toBe(1);
    expect(spellingSimilarity('cat', 'elephant')).toBeLessThan(0.3);
  });
});

describe('pickDistractors', () => {
  const candidate = (text: string, kind?: AnswerCandidate['kind'], topics: AnswerCandidate['topics'] = []) => ({ text, kind, topics });

  it('puts the look-alike first, then same kind and topic', () => {
    const wrong = pickDistractors(candidate('mela', 'noun', ['food']), [], [
      candidate('correre', 'verb'),
      candidate('pera', 'noun', ['food']),
      candidate('melo', 'noun', ['nature']),
      candidate('bello', 'adjective'),
      candidate('pane', 'noun', ['food']),
    ]);
    expect(wrong).toHaveLength(CHOICE_OPTIONS - 1);
    expect(wrong[0]).toBe('melo');
    expect(wrong.slice(1).sort()).toEqual(['pane', 'pera']);
  });

  it('never uses an answer that would also be right, nor duplicates', () => {
    const wrong = pickDistractors(candidate('casa'), ['abitazione'], [
      candidate('Casa'),
      candidate('abitazione'),
      candidate('cane'),
      candidate('cane'),
    ]);
    expect(wrong).toEqual(['cane']);
  });
});

describe('buildChoiceQuiz', () => {
  const words = [
    makeWord('apple', ['mela']),
    makeWord('pear', ['pera'], { streak: 1 }),
    makeWord('bread', ['pane'], { streak: 3 }),
    makeWord('dog', ['cane'], { streak: 5 }),
  ];
  const options = { direction: 'forward', mode: 'all', count: 0 } as const;

  it('asks only words below the multiple-choice box when asked to', () => {
    const questions = buildChoiceQuiz(words, { ...options, belowChoiceBox: true });
    expect(questions.map((q) => q.word.term).sort()).toEqual(['apple', 'pear']);
  });

  it('builds four answers with the right one at correctIndex', () => {
    const questions = buildChoiceQuiz(words, options);
    expect(questions).toHaveLength(4);
    for (const question of questions) {
      expect(question.options).toHaveLength(CHOICE_OPTIONS);
      expect(question.options[question.correctIndex]).toBe(question.word.meanings[0].text);
    }
  });

  it('asks the translation and offers studied words when backward', () => {
    const [question] = buildChoiceQuiz(words, { ...options, direction: 'backward', count: 1 });
    expect(question.options[question.correctIndex]).toBe(question.word.term);
  });

  it('uses spare answers when the vocabulary is small and skips questions without any', () => {
    const one = [makeWord('apple', ['mela'])];
    expect(buildChoiceQuiz(one, options)).toHaveLength(0);
    const [question] = buildChoiceQuiz(one, options, [{ text: 'melo', topics: [] }]);
    expect(question.options.sort()).toEqual(['mela', 'melo']);
  });
});

describe('pickDistractors with the built-in list', () => {
  it('prefers the user words to built-in ones that are just as similar', () => {
    const wrong = pickDistractors({ text: 'attraverso', topics: ['travel'] }, [], [
      { text: 'autobus', topics: ['travel'] },
      { text: 'ritardo', topics: ['travel'] },
      { text: 'pensiero', topics: ['travel'], own: true },
      { text: 'sebbene', topics: [], own: true },
    ], 2);
    expect(wrong).toEqual(['pensiero', expect.stringMatching(/autobus|ritardo/)]);
  });
});
