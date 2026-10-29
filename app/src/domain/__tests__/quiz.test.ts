import { describe, expect, it } from '@jest/globals';

import { buildQuiz, quizPool } from '../quiz';
import { makeWord } from './helpers';

const TODAY = '2026-10-29';

describe('quizPool', () => {
  const learned = makeWord('house', ['casa'], { streak: 3 }, TODAY); // next review in 4 days
  const fresh = makeWord('cat', ['gatto']);
  const wrong = makeWord('dog', ['cane'], { wrong: 1, streak: 0, lastWrongAt: '2026-10-28T10:00:00Z' }, '2026-10-28');
  const vocabulary = [learned, fresh, wrong];

  it('due: new words and words whose review day has come', () => {
    expect(quizPool(vocabulary, { mode: 'due' }, TODAY).map((w) => w.term).sort()).toEqual(['cat', 'dog']);
  });

  it('mistakes: only words answered wrong and not fixed', () => {
    expect(quizPool(vocabulary, { mode: 'mistakes' }, TODAY).map((w) => w.term)).toEqual(['dog']);
  });

  it('wordIds limits the pool', () => {
    expect(quizPool(vocabulary, { mode: 'all', wordIds: [learned.id] }, TODAY)).toEqual([learned]);
  });
});

describe('buildQuiz', () => {
  const boring = makeWord('boring', ['noioso']);
  const dull = makeWord('dull', ['noioso', 'opaco']);

  it('respects the question limit', () => {
    const words = Array.from({ length: 30 }, (_, i) => makeWord(`w${i}`, [`t${i}`]));
    expect(buildQuiz(words, { direction: 'forward', mode: 'all', count: 10 }, TODAY)).toHaveLength(10);
    expect(buildQuiz(words, { direction: 'forward', mode: 'all', count: 0 }, TODAY)).toHaveLength(30);
  });

  it('forward questions accept every translation, in the native language', () => {
    const [question] = buildQuiz([dull], { direction: 'forward', mode: 'all', count: 0 }, TODAY);
    expect(question.prompt).toBe('dull');
    expect(question.accepted).toEqual(['noioso', 'opaco']);
    expect(question.answerLanguage).toBe('it');
  });

  it('backward questions accept synonyms and never repeat the same prompt', () => {
    const questions = buildQuiz([boring, dull], { direction: 'backward', mode: 'all', count: 0 }, TODAY);
    const noioso = questions.find((question) => question.prompt === 'noioso');

    expect(noioso?.accepted.sort()).toEqual(['boring', 'dull']);
    expect(noioso?.answerLanguage).toBe('en');
    expect(new Set(questions.map((question) => question.prompt)).size).toBe(questions.length);
  });

  it('due mode picks the most overdue words when there are too many', () => {
    const late = makeWord('late', ['tardi'], { streak: 1 }, '2026-10-01');
    const onTime = makeWord('early', ['presto'], { streak: 1 }, '2026-10-28');
    const questions = buildQuiz([onTime, late], { direction: 'forward', mode: 'due', count: 1 }, TODAY);
    expect(questions.map((question) => question.prompt)).toEqual(['late']);
  });
});
