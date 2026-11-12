import { describe, expect, it } from '@jest/globals';

import { topicsOfLabel } from '../topicClassifier';
import {
  glossLabel,
  hasTranslationSubpage,
  languageSection,
  lemmaOf,
  plainText,
  sensesFromDefinitions,
  sensesFromTranslationTables,
} from '../wiktionarySenses';

// Shortened from the real pages
const STROKE = `==English==
===Etymology 1===
====Noun====
# An act of hitting.
=====Translations=====
{{trans-top-also|act of hitting|blow|hit}}
* French: {{t+|fr|coup|m}}
* Italian: {{t+|it|colpo|m}}
{{trans-bottom}}
{{trans-top|specific combination of movements of the arms and legs of a swimmer}}
* Italian: {{t+|it|bracciata}}
{{trans-bottom}}
{{trans-see|beat or throb|beat}}
{{trans-top-see|(medicine) loss of brain function|ictus}}
* German: {{t+|de|Schlaganfall|m}}
* Italian: {{t|it|accidente cerebrovascolare}}, {{t+|it|ictus}}
{{trans-bottom}}
====Verb====
=====Translations=====
{{trans-top|to caress}}
* Italian: {{t+|it|accarezzare}}
{{trans-bottom}}
==Hungarian==
===Noun===
{{trans-top|nothing}}
* Italian: {{t|it|sbagliato}}
{{trans-bottom}}`;

const CASA = `==Aragonese==
===Noun===
# [[house]]
==Italian==
===Noun===
{{it-noun|f}}
# [[house]], [[home]]
# {{lb|it|board games}} [[square]]
# {{plural of|it|caso}}
===Verb===
# {{inflection of|it|casare||3|s|pres|ind}}`;

describe('Wiktionary senses', () => {
  it('reads the translation tables of an English word, one group per sense', () => {
    const groups = sensesFromTranslationTables(languageSection(STROKE, 'en'), 'it');
    // Most common first (more languages translated); equal ones in page order
    expect(groups).toEqual([
      { partOfSpeech: 'noun', gloss: 'act of hitting', translations: ['colpo'], popularity: 2 },
      { partOfSpeech: 'noun', gloss: '(medicine) loss of brain function', translations: ['ictus', 'accidente cerebrovascolare'], popularity: 2 },
      { partOfSpeech: 'noun', gloss: 'specific combination of movements of the arms and legs of a swimmer', translations: ['bracciata'], popularity: 1 },
      { partOfSpeech: 'verb', gloss: 'to caress', translations: ['accarezzare'], popularity: 1 },
    ]);
    // Other target languages
    expect(sensesFromTranslationTables(languageSection(STROKE, 'en'), 'de')[0].translations).toEqual(['Schlaganfall']);
  });

  it('reads the definitions of a word of another language translated into English', () => {
    expect(sensesFromDefinitions(languageSection(CASA, 'it'))).toEqual([
      { partOfSpeech: 'noun', gloss: '', translations: ['house', 'home'], popularity: 0 },
      { partOfSpeech: 'noun', gloss: 'board games', translations: ['square'], popularity: 0 },
    ]);
  });

  it('finds the base word of forms and the translation subpages', () => {
    expect(lemmaOf('==English==\n===Noun===\n# {{plural of|en|barrack}}')).toBe('barrack');
    expect(lemmaOf(STROKE)).toBeNull();
    expect(hasTranslationSubpage('{{see translation subpage|Verb}}')).toBe(true);
  });

  it('cleans wiki markup and reads field labels', () => {
    expect(plainText("[[house|houses]] of '''[[god]]''' {{q|rare}}")).toBe('houses of god');
    expect(glossLabel('(medicine) loss of brain function')).toBe('medicine');
    expect(glossLabel('act of hitting')).toBeNull();
  });

  it('turns field labels into categories', () => {
    expect(topicsOfLabel('medicine')).toContain('health');
    expect(topicsOfLabel('tennis')).toContain('sport');
    expect(topicsOfLabel('rare')).toEqual([]);
  });
});
