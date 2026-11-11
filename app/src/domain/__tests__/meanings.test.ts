import { describe, expect, it } from '@jest/globals';

import { pickMeanings, type TranslationMatch } from '../meanings';

const match = (segment: string, translation: string, quality = 74, score = 1): TranslationMatch => ({
  segment,
  translation,
  quality: String(quality),
  match: score,
});

describe('pickMeanings', () => {
  it('keeps the translations of the word, best first, in lower case', () => {
    const matches = [match('boring', 'tedioso', 60), match('boring', 'Noioso', 74), match('boring ', 'annoiato ', 74, 0.99)];
    expect(pickMeanings('boring', matches, 'it')).toEqual(['noioso', 'annoiato', 'tedioso']);
  });

  it('drops duplicates, other texts and untranslated entries', () => {
    const matches = [
      match('boring', 'noioso'),
      match('Boring', 'Noioso.'),
      match('boring machine', 'macchina noiosa'),
      match('boring', 'boring'),
      match('boring', 'noioso', 80, 0.5),
    ];
    expect(pickMeanings('boring', matches, 'it')).toEqual(['noioso']);
  });

  it('keeps German nouns capitalised', () => {
    expect(pickMeanings('house', [match('house', 'Haus')], 'de')).toEqual(['Haus']);
  });

  it('drops sentences', () => {
    expect(pickMeanings('boring', [match('boring', 'una cosa che non ha nessun interesse per nessuno qui')], 'it')).toEqual([]);
  });
});
