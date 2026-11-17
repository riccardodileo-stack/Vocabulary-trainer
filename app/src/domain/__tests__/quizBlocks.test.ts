import { describe, expect, it } from '@jest/globals';

import { buildQuiz, getQuizBlocks, QUIZ_BLOCK_SIZE } from '../quiz';
import { makeWord } from './helpers';

describe('quiz blocks', () => {
  it('sorts from oldest to newest and includes the final partial block', () => {
    const words = Array.from({ length: 320 }, (_, index) => ({
      ...makeWord(`word ${index}`, [`translation ${index}`]),
      createdAt: new Date(index * 1000).toISOString(),
    }));
    const descending = [...words].reverse();

    expect(getQuizBlocks(descending).map((block) => block.length)).toEqual([50, 50, 50, 50, 50, 50, 20]);
    expect(getQuizBlocks(descending).flat()).toEqual(words);
    expect(descending[0]).toBe(words[319]);
    expect(getQuizBlocks([])).toEqual([]);
    expect(getQuizBlocks(words.slice(0, QUIZ_BLOCK_SIZE)).map((block) => block.length)).toEqual([50]);
  });

  it('keeps the beginning of each block when words are appended on the same date', () => {
    const createdAt = '2026-11-17T10:00:00.000Z';
    const words = Array.from({ length: 51 }, (_, index) => ({
      ...makeWord(`word ${index}`, [`translation ${index}`]),
      createdAt,
    }));
    const last = { ...makeWord('new word', ['nuova parola']), createdAt };

    expect(getQuizBlocks([...words, last])[1]).toEqual([words[50], last]);
  });

  it('asks both words in a block even when the reverse questions share a prompt', () => {
    const words = [makeWord('boring', ['noioso']), makeWord('dull', ['noioso'])];
    const options = { direction: 'backward', mode: 'all', count: 0, wordIds: words.map((word) => word.id) } as const;

    expect(buildQuiz(words, options)).toHaveLength(1);
    expect(buildQuiz(words, { ...options, allowRepeatedPrompts: true })).toHaveLength(2);
  });
});