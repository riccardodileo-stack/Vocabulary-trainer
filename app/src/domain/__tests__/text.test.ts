import { describe, expect, it } from '@jest/globals';

import { editDistance, evaluateAnswer, isAnswerAccepted } from '../text';

describe('evaluateAnswer', () => {
  const accepted = ['batteria', 'pila'];

  it('accepts any accepted option, alone or combined with "/"', () => {
    expect(evaluateAnswer('pila', accepted)).toBe('correct');
    expect(evaluateAnswer('  Batteria ', accepted)).toBe('correct');
    expect(evaluateAnswer('pila / batteria', accepted)).toBe('correct');
  });

  it('rejects wrong or empty answers', () => {
    expect(evaluateAnswer('torcia', accepted)).toBe('wrong');
    expect(evaluateAnswer('', accepted)).toBe('wrong');
    expect(evaluateAnswer('pila / torcia', accepted)).toBe('wrong');
  });

  it('ignores articles of the answer language', () => {
    expect(evaluateAnswer('la batteria', accepted, 'it')).toBe('correct');
    expect(evaluateAnswer('to run', ['run'], 'en')).toBe('correct');
    expect(evaluateAnswer('run', ['to run'], 'en')).toBe('correct');
    expect(evaluateAnswer("l'acqua", ['acqua'], 'it')).toBe('correct');
    expect(evaluateAnswer('die Batterie', ['Batterie'], 'de')).toBe('correct');
  });

  it('does not strip articles without a language, nor a lone article', () => {
    expect(evaluateAnswer('la batteria', accepted)).toBe('wrong');
    expect(evaluateAnswer('la', ['la'], 'it')).toBe('correct');
  });

  it('marks a missing accent as "almost"', () => {
    expect(evaluateAnswer('citta', ['città'])).toBe('almost');
    expect(evaluateAnswer('perche', ['perché'])).toBe('almost');
  });

  it('marks one wrong letter in a long word as "almost"', () => {
    expect(evaluateAnswer('batterai', accepted)).toBe('wrong'); // two edits
    expect(evaluateAnswer('baterria', accepted)).toBe('wrong'); // two edits
    expect(evaluateAnswer('bateria', accepted)).toBe('almost'); // one missing letter
    expect(evaluateAnswer('environmant', ['environment'])).toBe('almost');
  });

  it('is strict with short words, where one letter makes another word', () => {
    expect(evaluateAnswer('cosa', ['casa'])).toBe('wrong');
  });

  it('accepts typographic apostrophes', () => {
    expect(evaluateAnswer('essere d’accordo', ["essere d'accordo"])).toBe('correct');
  });

  it('counts "almost" as accepted', () => {
    expect(isAnswerAccepted('citta', ['città'])).toBe(true);
    expect(isAnswerAccepted('cane', ['gatto'])).toBe(false);
  });
});

describe('editDistance', () => {
  it('counts single-letter edits', () => {
    expect(editDistance('casa', 'casa')).toBe(0);
    expect(editDistance('casa', 'cosa')).toBe(1);
    expect(editDistance('casa', 'case')).toBe(1);
    expect(editDistance('', 'abc')).toBe(3);
    expect(editDistance('kitten', 'sitting')).toBe(3);
  });
});
