import { describe, expect, it } from '@jest/globals';

import { SENSE_TOPICS } from '@/content/senseTopics';
import { TOPIC_MODEL, TOPIC_MODEL_REFERENCE } from '@/content/topicModel';

import {
  dictionaryPairTopics,
  dictionaryWordTopics,
  featureStrings,
  fnv1a,
  foldForModel,
  studentProbabilities,
  suggestMeaningTopics,
  suggestTopics,
} from '../topicClassifier';
import { TOPIC_IDS } from '../topics';
import { createWord, meaningToCheckOnServer, withClassification } from '../word';

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

describe('Wiktionary senses', () => {
  it('has every language and language pair', () => {
    expect(Object.keys(SENSE_TOPICS.words).sort()).toEqual(['de', 'en', 'es', 'fr', 'it']);
    expect(Object.keys(SENSE_TOPICS.pairs)).toHaveLength(10);
  });

  it('knows a word with one translation, in both directions and with articles', () => {
    expect(dictionaryPairTopics('court', 'campo', EN_IT)).toEqual(['sport']);
    expect(dictionaryPairTopics('campo', 'court', { source: 'it', target: 'en' })).toEqual(['sport']);
    expect(dictionaryPairTopics('the court', 'il campo', EN_IT)).toEqual(['sport']);
    expect(dictionaryPairTopics('xyzzy', 'campo', EN_IT)).toBeNull();
  });

  it('knows the usual topics of a translation', () => {
    expect(dictionaryWordTopics('ictus', 'it')).toEqual(['health']);
    expect(dictionaryWordTopics('der Schlaganfall', 'de')).toEqual(['health']);
    expect(dictionaryWordTopics('colpo', 'it')).toBeNull();
  });

  it('picks the meaning from the translation where the network alone could not', () => {
    // "campo" alone is a field, a camp, a court…: the pair says which
    expect(suggestMeaningTopics('court', 'campo', EN_IT, false)).toEqual(['sport']);
    expect(suggestMeaningTopics('bank', 'riva', EN_IT, false)).toEqual(['nature']);
    // Between two languages without English, through the same Wiktionary sense
    expect(suggestMeaningTopics('Schlaganfall', 'ictus', { source: 'de', target: 'it' }, false)).toEqual(['health']);
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

describe('meanings asked to the server', () => {
  it('are those left without topics, not chosen by hand and not asked yet', () => {
    const word = createWord(EN_IT, {
      term: 'stroke',
      meanings: [
        { text: 'ictus', examples: [] },
        { text: 'colpo', examples: [] },
      ],
    });
    // "ictus" has topics on the phone, "colpo" doesn't
    expect(meaningToCheckOnServer([word])).toEqual({ word, index: 1 });

    const asked = { ...word, meanings: word.meanings.map((meaning) => ({ ...meaning, topicsChecked: true })) };
    expect(meaningToCheckOnServer([asked])).toBeNull();

    const byHand = { ...word, meanings: word.meanings.map((meaning) => ({ ...meaning, topicsByUser: true })) };
    expect(meaningToCheckOnServer([byHand])).toBeNull();
  });
});
