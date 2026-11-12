import { describe, expect, it } from '@jest/globals';

import { guessPartOfSpeech, parsePartOfSpeechList, pickPartOfSpeech } from '../partOfSpeech';

const EN_IT = { source: 'en', target: 'it' } as const;

describe('guessPartOfSpeech', () => {
  it('recognises verbs', () => {
    expect(guessPartOfSpeech('to run', ['correre'], EN_IT)).toBe('verb');
    expect(guessPartOfSpeech('run', ['correre'], EN_IT)).toBe('verb');
  });

  it('recognises nouns from articles, capitals and endings', () => {
    expect(guessPartOfSpeech('the book', ['libro'], EN_IT)).toBe('noun');
    expect(guessPartOfSpeech('book', ['il libro'], EN_IT)).toBe('noun');
    expect(guessPartOfSpeech('Haus', ['casa'], { source: 'de', target: 'it' })).toBe('noun');
    expect(guessPartOfSpeech('happiness', ['felicità'], EN_IT)).toBe('noun');
    // -iere is a noun ending, not an infinitive
    expect(guessPartOfSpeech('waiter', ['cameriere'], EN_IT)).toBe('noun');
  });

  it('recognises adjectives from endings', () => {
    expect(guessPartOfSpeech('dangerous', ['pericoloso'], EN_IT)).toBe('adjective');
    expect(guessPartOfSpeech('boring', ['noioso'], EN_IT)).toBe('adjective');
  });

  it('falls back to noun, or other for expressions', () => {
    expect(guessPartOfSpeech('table', ['tavolo'], EN_IT)).toBe('noun');
    expect(guessPartOfSpeech('by the way', ['a proposito'], EN_IT)).toBe('other');
  });
});

describe('pickPartOfSpeech', () => {
  it('prefers what the word and its translation have in common', () => {
    expect(pickPartOfSpeech(['noun', 'verb', 'adjective'], ['adjective', 'noun'], 'boring')).toBe('adjective');
    expect(pickPartOfSpeech(['noun', 'verb'], [], 'run')).toBe('noun');
    expect(pickPartOfSpeech(['noun', 'verb'], [], 'to run')).toBe('verb');
    expect(pickPartOfSpeech([], [], 'x')).toBeNull();
  });
});

describe('parsePartOfSpeechList', () => {
  it('keeps only valid kinds', () => {
    expect(parsePartOfSpeechList('verb,xyz,noun')).toEqual(['verb', 'noun']);
    expect(parsePartOfSpeechList(undefined)).toEqual([]);
  });
});
