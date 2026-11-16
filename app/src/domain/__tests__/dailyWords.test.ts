import { describe, expect, it } from '@jest/globals';

import { WORD_BANK } from '../../content/wordBank';
import { DAILY_LEVELS, pickDailySuggestions, remainingCount, suggestionFromEntry, suggestionToWordInput } from '../dailyWords';
import { LANGUAGE_CODES } from '../languages';
import { normalizeText, splitSlashOptions } from '../text';
import { isTopicId, TOPIC_IDS } from '../topics';

const PAIR = { source: 'en', target: 'it' } as const;
const NONE = new Set<string>();

const pick = (overrides: Partial<Parameters<typeof pickDailySuggestions>[1]> = {}) =>
  pickDailySuggestions(WORD_BANK, {
    pair: PAIR,
    day: '2026-10-29',
    level: 'all',
    knownIds: NONE,
    vocabularyTerms: NONE,
    ...overrides,
  });

describe('word bank', () => {
  it('has unique ids', () => {
    const ids = WORD_BANK.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has every word in every language', () => {
    for (const entry of WORD_BANK) {
      for (const code of LANGUAGE_CODES) {
        expect(splitSlashOptions(entry.text[code]).length).toBeGreaterThan(0);
      }
    }
  });

  it('has at least 30 words for each level', () => {
    for (const levels of Object.values(DAILY_LEVELS)) {
      const count = WORD_BANK.filter((entry) => levels.includes(entry.level)).length;
      expect(count).toBeGreaterThanOrEqual(30);
    }
  });
});

describe('word bank categories', () => {
  it('uses only known categories', () => {
    for (const entry of WORD_BANK) {
      expect(entry.topics.every(isTopicId)).toBe(true);
    }
  });

  it('has at least 10 words of each category for each group of levels', () => {
    for (const topic of TOPIC_IDS) {
      for (const levels of [DAILY_LEVELS.beginner, DAILY_LEVELS.intermediate, DAILY_LEVELS.advanced]) {
        const count = WORD_BANK.filter((entry) => entry.topics.includes(topic) && levels.includes(entry.level)).length;
        expect([topic, count >= 10]).toEqual([topic, true]);
      }
    }
  });
});

describe('pickDailySuggestions', () => {
  it('gives 5 words, the same ones all day', () => {
    expect(pick()).toHaveLength(5);
    expect(pick()).toEqual(pick());
  });

  it('changes words from one day to the next', () => {
    expect(pick({ day: '2026-10-30' })).not.toEqual(pick());
  });

  it('skips words already in the vocabulary or marked as known', () => {
    const first = pick();
    const again = pick({
      knownIds: new Set([first[0].id]),
      vocabularyTerms: new Set([normalizeText(first[1].term)]),
    });
    const ids = again.map((suggestion) => suggestion.id);
    expect(ids).not.toContain(first[0].id);
    expect(ids).not.toContain(first[1].id);
  });

  it('only suggests words of the chosen level', () => {
    for (const suggestion of pick({ level: 'beginner' })) {
      expect(['A1', 'A2']).toContain(suggestion.level);
    }
  });

  it('suggests C1 and C2 words at the advanced level', () => {
    const levels = new Set(pick({ level: 'advanced' }).map((suggestion) => suggestion.level));
    expect([...levels].every((level) => level === 'C1' || level === 'C2')).toBe(true);
    expect(WORD_BANK.some((entry) => entry.level === 'C2')).toBe(true);
  });

  it('never suggests the same word twice on one day', () => {
    // In Italian "improve" and "enhance" both start with "migliorare"
    for (let day = 1; day <= 28; day++) {
      const terms = pick({ pair: { source: 'it', target: 'en' }, day: `2026-02-${String(day).padStart(2, '0')}` }).map(
        (suggestion) => normalizeText(suggestion.term)
      );
      expect(new Set(terms).size).toBe(terms.length);
    }
  });

  it('suggests only words of the chosen categories', () => {
    const suggestions = pick({ topics: ['food', 'travel'] });
    expect(suggestions).toHaveLength(5);
    for (const suggestion of suggestions) {
      expect(suggestion.topics?.some((topic) => topic === 'food' || topic === 'travel')).toBe(true);
    }
    // Without categories the words are the same as before categories existed
    expect(pick({ topics: [] })).toEqual(pick());
  });

  it('counts the new words left for a choice', () => {
    const health = WORD_BANK.filter((entry) => entry.topics.includes('health'));
    const count = (knownIds: Set<string>) =>
      remainingCount(WORD_BANK, { pair: PAIR, level: 'all', topics: ['health'], knownIds, vocabularyTerms: NONE });
    expect(count(NONE)).toBe(health.length);
    expect(count(new Set([health[0].id]))).toBe(health.length - 1);
  });

  it('returns fewer words when the level is exhausted', () => {
    const allIds = new Set(WORD_BANK.map((entry) => entry.id));
    expect(pick({ knownIds: allIds })).toEqual([]);
  });
});

describe('suggestions', () => {
  it('use the first studied alternative and every translation', () => {
    const battery = WORD_BANK.find((entry) => entry.id === 'battery')!;
    const suggestion = suggestionFromEntry(battery, { source: 'it', target: 'en' });
    expect(suggestion.term).toBe('batteria');
    expect(suggestion.meanings).toEqual(['battery']);

    const input = suggestionToWordInput(suggestionFromEntry(battery, PAIR));
    expect(input.meanings.map((meaning) => meaning.text)).toEqual(['batteria', 'pila']);
    expect(input.level).toBe('B1');
  });

  it('give the words of a category their category', () => {
    const fever = WORD_BANK.find((entry) => entry.id === 'fever')!;
    const input = suggestionToWordInput(suggestionFromEntry(fever, PAIR));
    expect(input.meanings).toEqual([{ text: 'febbre', examples: [], topics: ['health'] }]);
  });
});
