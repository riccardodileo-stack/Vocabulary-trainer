import { describe, expect, it } from '@jest/globals';

import { buildChoiceQuiz, CHOICE_OPTIONS } from '../choiceQuiz';
import { makeWord } from './helpers';

const OPTIONS = { direction: 'forward', mode: 'all', count: 0 } as const;

describe('buildChoiceQuiz', () => {
  const words = [
    makeWord('house', ['casa']),
    makeWord('dog', ['cane']),
    makeWord('to run', ['correre']),
    makeWord('boring', ['noioso', 'tedioso']),
    makeWord('cat', ['gatto']),
  ];

  it('gives four different answers, one of them right', () => {
    const questions = buildChoiceQuiz(words, OPTIONS);
    expect(questions).toHaveLength(5);
    for (const question of questions) {
      expect(question.options).toHaveLength(CHOICE_OPTIONS);
      expect(new Set(question.options).size).toBe(CHOICE_OPTIONS);
      const right = question.options[question.correctIndex];
      expect(question.word.meanings.map((meaning) => meaning.text)).toContain(right);
      // No other translation of the same word among the wrong answers
      const wrong = question.options.filter((_, i) => i !== question.correctIndex);
      expect(wrong.some((answer) => question.word.meanings.some((meaning) => meaning.text === answer))).toBe(false);
    }
  });

  it('asks backward too: a translation, and the studied words as answers', () => {
    const [question] = buildChoiceQuiz(words, { ...OPTIONS, direction: 'backward', wordIds: [words[0].id] });
    expect(question.prompt).toBe('casa');
    expect(question.options[question.correctIndex]).toBe('house');
  });

  it('uses spare answers when the vocabulary is small, and skips what cannot be asked', () => {
    const one = [makeWord('house', ['casa'])];
    expect(buildChoiceQuiz(one, OPTIONS)).toHaveLength(0);
    const [question] = buildChoiceQuiz(one, OPTIONS, ['cane', 'gatto', 'casa', 'sole']);
    expect(question.options).toHaveLength(CHOICE_OPTIONS);
    expect(question.options.filter((answer) => answer === 'casa')).toHaveLength(1);
  });

  it('respects the number of questions and the filters', () => {
    expect(buildChoiceQuiz(words, { ...OPTIONS, count: 2 })).toHaveLength(2);
    const verbs = buildChoiceQuiz(words, { ...OPTIONS, partsOfSpeech: ['verb'] });
    expect(verbs.map((question) => question.word.term)).toEqual(['to run']);
  });
});
