import { describe, expect, it } from '@jest/globals';

import { highlightTerms, splitExample } from '../highlight';

/** "This is **boring**" style, easier to read in the tests. */
function marked(text: string, terms: string[], language?: Parameters<typeof highlightTerms>[2]): string {
  return highlightTerms(text, terms, language)
    .map((part) => (part.bold ? `**${part.text}**` : part.text))
    .join('');
}

describe('highlightTerms', () => {
  it('bolds the word, ignoring case and punctuation', () => {
    expect(marked('Boring! This film is so boring.', ['boring'])).toBe('**Boring**! This film is so **boring**.');
  });

  it('finds other forms of the word', () => {
    expect(marked('Le lezioni sono noiose.', ['noioso'])).toBe('Le lezioni sono **noiose**.');
    expect(marked('I am running late.', ['to run'], 'en')).toBe('I am **running** late.');
    expect(marked('She tries and tried.', ['try'])).toBe('She **tries** and **tried**.');
  });

  it('drops the article or "to" of the term', () => {
    expect(marked('The battery is dead, the end.', ['the battery'], 'en')).toBe('The **battery** is dead, the end.');
  });

  it('ignores accents and keeps the original text', () => {
    expect(marked('Perché no?', ['perche'])).toBe('**Perché** no?');
  });

  it('does not bold longer unrelated words', () => {
    expect(marked('Run to the runway.', ['run'])).toBe('**Run** to the runway.');
  });

  it('bolds every word of a multi-word term and any of several meanings', () => {
    expect(marked("Don't give up now. Up! Give it to me.", ['give up'], 'en')).toBe("Don't **give up** now. Up! Give it to me.");
    expect(marked('È noioso e tedioso.', ['noioso', 'tedioso'])).toBe('È **noioso** e **tedioso**.');
  });

  it('returns the text as is when there is nothing to find', () => {
    expect(highlightTerms('Hello world', [])).toEqual([{ text: 'Hello world', bold: false }]);
  });
});

describe('splitExample', () => {
  it('splits sentence and translation', () => {
    expect(splitExample('It is boring. — È noioso.')).toEqual({ sentence: 'It is boring.', translation: 'È noioso.' });
    expect(splitExample('Only a sentence')).toEqual({ sentence: 'Only a sentence' });
  });
});
