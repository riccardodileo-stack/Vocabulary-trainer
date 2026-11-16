import { describe, expect, it } from '@jest/globals';

import { parseWordList } from '../wordList';

describe('parseWordList', () => {
  it('reads the common ways of writing a list', () => {
    const { entries, invalidLines } = parseWordList(
      ['stroke - colpo, ictus', 'barracks = caserma', 'to heal;guarire', 'house\tcasa', '"dog","cane"', 'well-known: famoso'].join('\n')
    );
    expect(invalidLines).toEqual([]);
    expect(entries).toEqual([
      { term: 'stroke', meanings: ['colpo', 'ictus'] },
      { term: 'barracks', meanings: ['caserma'] },
      { term: 'to heal', meanings: ['guarire'] },
      { term: 'house', meanings: ['casa'] },
      { term: 'dog', meanings: ['cane'] },
      { term: 'well-known', meanings: ['famoso'] },
    ]);
  });

  it('skips empty lines, comments, bullets and numbers', () => {
    const { entries } = parseWordList('# animali\n\n- cat - gatto\n2. bird – uccello\r\n• cow — mucca');
    expect(entries.map((entry) => entry.term)).toEqual(['cat', 'bird', 'cow']);
  });

  it('joins the same word written twice', () => {
    const { entries } = parseWordList('Stroke - colpo\nstroke - ictus, colpo');
    expect(entries).toEqual([{ term: 'Stroke', meanings: ['colpo', 'ictus'] }]);
  });

  it('reports the lines without a translation', () => {
    const { entries, invalidLines } = parseWordList('hello\ncat - gatto\ndog -');
    expect(entries).toHaveLength(1);
    expect(invalidLines).toEqual(['hello', 'dog -']);
  });
});
