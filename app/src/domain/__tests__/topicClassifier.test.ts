import { describe, expect, it } from '@jest/globals';

import { TOPIC_MODEL, TOPIC_MODEL_REFERENCE } from '@/content/topicModel';

import { featureStrings, fnv1a, foldForModel, studentProbabilities, suggestMeaningTopics, suggestTopics } from '../topicClassifier';
import { TOPIC_IDS } from '../topics';
import { createWord, withClassification } from '../word';

const EN_IT = { source: 'en', target: 'it' } as const;

describe('topic model', () => {
  it('has the topics in the same order as the app', () => {
    expect(TOPIC_MODEL.topics).toEqual([...TOPIC_IDS]);
  });

  it('computes the same features and outputs as the Python training script', () => {
    expect(foldForModel('  Perché  NO ')).toBe('perche no');
    expect(featureStrings('ab')).toEqual(['W:ab', '<a', 'ab', 'b>', '<ab', 'ab>', '<ab>']);
    // Values printed by design/topic-model/features.py
    expect(fnv1a('W:ciao')).toBe(441140944);
    expect(fnv1a('<c')).toBe(1727453512);

    for (const [word, expected] of Object.entries(TOPIC_MODEL_REFERENCE)) {
      studentProbabilities(word).forEach((p, i) => expect(p).toBeCloseTo(expected[i], 3));
    }
  });
});

describe('suggestTopics', () => {
  it('finds the topics of common words, also from the translation', () => {
    expect(suggestTopics('hospital', ['ospedale'], EN_IT)).toContain('health');
    expect(suggestTopics('keyboard', [], EN_IT)).toContain('tech');
    expect(suggestTopics('xyzzy', ['pane'], EN_IT)).toContain('food');
  });

  it('gives several topics when a word has them', () => {
    expect(suggestTopics('mouse', ['mouse', 'topo'], EN_IT)).toEqual(expect.arrayContaining(['tech', 'nature']));
  });

  it('ignores articles and "to"', () => {
    expect(suggestTopics('the hospital', ['l\'ospedale'], EN_IT)).toContain('health');
    expect(suggestTopics('to cook', ['cucinare'], EN_IT)).toContain('food');
  });

  it('suggests nothing for everyday words', () => {
    expect(suggestTopics('always', ['sempre'], EN_IT)).toEqual([]);
    expect(suggestTopics('to become', ['diventare'], EN_IT)).toEqual([]);
  });

  it('uses the student network for words it has never seen', () => {
    // Not a real word, but made of pieces of medical words
    const probabilities = studentProbabilities('cardiologico');
    expect(probabilities[TOPIC_IDS.indexOf('health')]).toBeGreaterThan(probabilities[TOPIC_IDS.indexOf('sport')]);
  });

  it('gives each meaning its own topics', () => {
    expect(suggestMeaningTopics('stroke', 'ictus', EN_IT, false)).toEqual(['health']);
    expect(suggestMeaningTopics('stroke', 'colpo', EN_IT, false)).toEqual([]);
    // A translation known to have no topic gets none, even if the word alone would
    expect(suggestMeaningTopics('barracks', 'caserma', EN_IT, true)).toEqual([]);
  });

  it('suggests at most three topics per meaning', () => {
    expect(suggestMeaningTopics('kitchen', 'cucina', EN_IT, true).length).toBeLessThanOrEqual(3);
  });
});

describe('words get topics and a kind automatically', () => {
  it('per meaning when created, unless given', () => {
    const word = createWord(EN_IT, {
      term: 'stroke',
      meanings: [
        { text: 'ictus', examples: [] },
        { text: 'colpo', examples: [] },
      ],
    });
    expect(word.meanings.map((meaning) => meaning.topics)).toEqual([['health'], []]);
    expect(word.topics).toEqual(['health']);
    expect(word.partOfSpeechSource).toBe('guess');

    const chosen = createWord(EN_IT, {
      term: 'stroke',
      meanings: [{ text: 'bracciata', examples: [], topics: ['sport'], topicsByUser: true }],
      partOfSpeech: 'noun',
    });
    expect(chosen.topics).toEqual(['sport']);
    expect(chosen.meanings[0].topicsByUser).toBe(true);
    expect(chosen.partOfSpeechSource).toBe('user');

    // Old saved word without the new fields (store migrations)
    const old: Partial<typeof word> = { ...word, meanings: word.meanings.map(({ text, examples }) => ({ text, examples })) };
    delete old.topics;
    delete old.partOfSpeech;
    delete old.partOfSpeechSource;
    expect(withClassification(old as Parameters<typeof withClassification>[0])).toMatchObject({
      topics: ['health'],
      partOfSpeech: 'noun',
      partOfSpeechSource: 'guess',
    });
  });
});
