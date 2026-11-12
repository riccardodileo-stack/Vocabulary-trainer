// Suggests the topics of a word: a small neural network that runs on the phone, offline.
//
// How it works (details and training in design/topic-model/README.md):
// 1. On a computer, a language model (Qwen2.5) labelled a sample of the vocabulary and a
//    classifier on multilingual embeddings learnt from it, then labelled ~75,000 common words
//    of the five languages; the result ships as a lexicon per language (word -> topics) plus
//    a list of known words that have no topic.
// 2. Words not in the lexicon go through a small "student" network (hashed letter groups ->
//    24 neurons -> 12 topics) trained to imitate the big one; it recognises pieces like
//    "cardio", "program", "cucin" in words it has never seen.
// Topics belong to each meaning, decided mainly by its translation (see suggestMeaningTopics).

import { TOPIC_MODEL } from '@/content/topicModel';

import type { LanguageCode, LanguagePair } from './languages';
import { splitSlashOptions, stripLeadingWord } from './text';
import { TOPIC_IDS, type TopicId } from './topics';

/** Minimum student-network probability to suggest a topic: high, to be right ~3 times out of 4. */
export const STUDENT_THRESHOLD = 0.8;
/** Suggestions per meaning are capped: more would be noise. */
export const MAX_SUGGESTED_TOPICS = 3;

/** Same folding as the training script: lower case, no accents, single spaces. */
export function foldForModel(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/’/g, "'")
    .trim()
    .split(/\s+/)
    .join(' ');
}

/** 32-bit FNV-1a over UTF-16 code units (the training script does the same). */
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** The whole word plus its letter groups of 2–5 letters, with "<" and ">" marking start and end. */
export function featureStrings(folded: string): string[] {
  const padded = `<${folded}>`;
  const features = [`W:${folded}`];
  for (let n = 2; n <= 5; n++) {
    for (let i = 0; i + n <= padded.length; i++) {
      features.push(padded.slice(i, i + n));
    }
  }
  return features;
}

type Model = {
  lexicon: Map<string, number>;
  known: Set<number>;
  w1: Int8Array;
  w1Scale: number[];
  b1: number[];
  w2: number[];
  b2: number[];
  hidden: number;
  buckets: number;
};

let model: Model | null = null;

function decodeBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Unpacks the model the first time it's needed (a few ms), then keeps it. */
function loadModel(): Model {
  if (model) {
    return model;
  }
  // Keys are "lang:word": the same spelling can be two different words (it/es "burro")
  const lexicon = new Map<string, number>();
  for (const [language, groups] of Object.entries(TOPIC_MODEL.lexicon)) {
    for (const group of groups.split(';').filter(Boolean)) {
      const [mask, words] = group.split(':');
      const bits = Number.parseInt(mask, 16);
      for (const word of words.split(',')) {
        lexicon.set(`${language}:${word}`, bits);
      }
    }
  }

  const knownBytes = decodeBase64(TOPIC_MODEL.known);
  const known = new Set<number>();
  for (let i = 0; i < knownBytes.length; i += 3) {
    known.add((knownBytes[i] << 16) | (knownBytes[i + 1] << 8) | knownBytes[i + 2]);
  }

  const w1Bytes = decodeBase64(TOPIC_MODEL.w1);
  model = {
    lexicon,
    known,
    w1: new Int8Array(w1Bytes.buffer, w1Bytes.byteOffset, w1Bytes.length),
    w1Scale: TOPIC_MODEL.w1Scale,
    b1: TOPIC_MODEL.b1,
    w2: TOPIC_MODEL.w2,
    b2: TOPIC_MODEL.b2,
    hidden: TOPIC_MODEL.hidden,
    buckets: 1 << TOPIC_MODEL.bits,
  };
  return model;
}

/** Student network: probability of each topic (TOPIC_IDS order) for one folded word or phrase. */
export function studentProbabilities(folded: string): number[] {
  const { w1, w1Scale, b1, w2, b2, hidden, buckets } = loadModel();

  // Letter groups -> buckets with their counts, normalised to length 1
  const counts = new Map<number, number>();
  for (const feature of featureStrings(folded)) {
    const bucket = fnv1a(feature) & (buckets - 1);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  let norm = 0;
  counts.forEach((count) => (norm += count * count));
  norm = Math.sqrt(norm);

  const h = [...b1];
  counts.forEach((count, bucket) => {
    const value = count / norm;
    const row = bucket * hidden;
    for (let j = 0; j < hidden; j++) {
      h[j] += value * w1[row + j] * w1Scale[j];
    }
  });

  const topics = b2.length;
  const out = [...b2];
  for (let j = 0; j < hidden; j++) {
    const activation = Math.max(h[j], 0);
    if (activation > 0) {
      for (let k = 0; k < topics; k++) {
        out[k] += activation * w2[j * topics + k];
      }
    }
  }
  return out.map((logit) => 1 / (1 + Math.exp(-logit)));
}

type PieceResult = {
  /** false when neither the lexicon nor a confident student network knows the text. */
  known: boolean;
  /** Probability of each topic (TOPIC_IDS order); lexicon answers are 0 or 1. */
  scores: number[];
};

const NO_SCORES = TOPIC_IDS.map(() => 0);

/** Topics of one word or phrase: lexicon first, the student network for unknown words. */
function pieceResult(text: string, language: LanguageCode): PieceResult {
  const folded = foldForModel(stripLeadingWord(text.trim().toLowerCase(), language));
  if (folded.length < 2) {
    return { known: false, scores: NO_SCORES };
  }
  const { lexicon, known } = loadModel();

  const mask = lexicon.get(`${language}:${folded}`);
  if (mask !== undefined) {
    return { known: true, scores: TOPIC_IDS.map((_, i) => (mask & (1 << i) ? 1 : 0)) };
  }
  if (known.has(fnv1a(`K:${language}:${folded}`) & 0xffffff)) {
    return { known: true, scores: NO_SCORES };
  }
  const scores = studentProbabilities(folded);
  return { known: scores.some((score) => score >= STUDENT_THRESHOLD), scores };
}

/** "grano / frumento": the alternatives together (a topic of either counts). */
function textResult(text: string, language: LanguageCode): PieceResult {
  const parts = splitSlashOptions(text).map((part) => pieceResult(part, language));
  return {
    known: parts.some((part) => part.known),
    scores: TOPIC_IDS.map((_, i) => Math.max(0, ...parts.map((part) => part.scores[i]))),
  };
}

function bestTopics(scores: number[]): TopicId[] {
  return TOPIC_IDS.map((topic, i) => ({ topic, score: scores[i] }))
    .filter(({ score }) => score >= STUDENT_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTED_TOPICS)
    .map(({ topic }) => topic);
}

/**
 * Topics of ONE meaning of a word. The translation decides: "stroke" = "ictus" is health,
 * "stroke" = "bracciata" is sport. The studied word helps only when the word has a single
 * meaning and its translation is unknown to the network ("rash" = "eruzione cutanea").
 * A translation the network knows to have no topic ("caserma") gets none.
 * Empty when nothing is clear: better no topic than a wrong one.
 */
export function suggestMeaningTopics(
  term: string,
  meaning: string,
  { source, target }: LanguagePair,
  onlyMeaning: boolean
): TopicId[] {
  const fromMeaning = textResult(meaning, target);
  if (fromMeaning.known || !onlyMeaning) {
    return bestTopics(fromMeaning.scores);
  }
  return bestTopics(textResult(term, source).scores);
}

/**
 * Topics of a whole word: those of each meaning together (the word alone when it has no
 * meaning yet).
 */
export function suggestTopics(term: string, meanings: string[], pair: LanguagePair): TopicId[] {
  const texts = meanings.filter((meaning) => meaning.trim());
  if (texts.length === 0) {
    return bestTopics(textResult(term, pair.source).scores);
  }
  const found = new Set(texts.flatMap((meaning) => suggestMeaningTopics(term, meaning, pair, texts.length === 1)));
  return TOPIC_IDS.filter((topic) => found.has(topic));
}

/**
 * Topics of a field label written in English ("medicine", "cricket", "cooking"), e.g. the
 * label of a Wiktionary sense. Empty when the label isn't a clear field.
 */
export function topicsOfLabel(label: string): TopicId[] {
  const result = textResult(label, 'en');
  return result.known ? bestTopics(result.scores) : [];
}
