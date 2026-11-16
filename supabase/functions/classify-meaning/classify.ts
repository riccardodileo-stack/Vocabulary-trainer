// The pure part of classify-meaning: checking the request, the prompt for the model and
// reading its answer. No network and no database here, so it is all covered by classify.test.ts.

import {
  type ClassifyRequest,
  LANGUAGES,
  MAX_TOPICS,
  PARTS_OF_SPEECH,
  type PartOfSpeech,
  TOPIC_IDS,
  type TopicId,
} from '../_shared/contract.ts';

/** Same as normalizeText in the app: the database key must match what the app sends. */
export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

const LIMITS = { term: 80, translation: 120, example: 300 };

/** The request, normalized, or a message saying what is wrong with it. */
export function parseRequest(body: unknown): ClassifyRequest | string {
  if (typeof body !== 'object' || body === null) {
    return 'The body must be a JSON object.';
  }
  const { sourceLang, targetLang, term, translation, example } = body as Record<string, unknown>;
  const isLanguage = (value: unknown) => (LANGUAGES as readonly unknown[]).includes(value);
  if (!isLanguage(sourceLang) || !isLanguage(targetLang) || sourceLang === targetLang) {
    return `sourceLang and targetLang must be two different languages among ${LANGUAGES.join(', ')}.`;
  }
  if (typeof term !== 'string' || typeof translation !== 'string') {
    return 'term and translation must be strings.';
  }
  const request: ClassifyRequest = {
    sourceLang: sourceLang as ClassifyRequest['sourceLang'],
    targetLang: targetLang as ClassifyRequest['targetLang'],
    term: normalizeText(term),
    translation: normalizeText(translation),
  };
  if (!request.term || request.term.length > LIMITS.term) {
    return `term must have 1 to ${LIMITS.term} characters.`;
  }
  if (!request.translation || request.translation.length > LIMITS.translation) {
    return `translation must have 1 to ${LIMITS.translation} characters.`;
  }
  if (typeof example === 'string' && example.trim()) {
    request.example = example.trim().slice(0, LIMITS.example);
  }
  return request;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  it: 'Italian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
};

/** What each topic covers, for the model (same meaning as the topic names in the app). */
const TOPIC_DESCRIPTIONS: Record<TopicId, string> = {
  tech: 'computers, internet, software, electronics, devices',
  health: 'medicine, illnesses, body care, doctors, hospitals, drugs',
  food: 'food, drinks, cooking, kitchen tools, restaurants',
  travel: 'travel, transport, vehicles, tourism, hotels, directions',
  work: 'jobs, office, business, money, economy, law',
  home: 'house, rooms, furniture, household objects, chores, clothes',
  nature: 'animals, plants, farming, weather, landscape, environment',
  people: 'family, relationships, ages, social life, appearance',
  school: 'school, university, studying, science, mathematics',
  sport: 'sports, games, hobbies, free time, fitness',
  culture: 'art, music, literature, cinema, theatre, history, religion',
  feelings: 'emotions, moods, personality, character traits',
};

/** The instruction for the model. The translation decides the meaning: "stroke" = "ictus" is medicine. */
export function buildPrompt(request: ClassifyRequest): string {
  const source = LANGUAGE_NAMES[request.sourceLang];
  const target = LANGUAGE_NAMES[request.targetLang];
  const topics = TOPIC_IDS.map((id) => `- ${id}: ${TOPIC_DESCRIPTIONS[id]}`).join('\n');
  return [
    `A language learner studies the ${source} word "${request.term}" with the ${target} translation "${request.translation}".`,
    'The translation tells which meaning of the word is meant: classify only that meaning.',
    request.example ? `Example sentence: "${request.example}"` : null,
    '',
    `Give the topics of this meaning (0 to ${MAX_TOPICS}), only those a learner would clearly expect to find it under:`,
    topics,
    'General words (always, thing, to put, maybe, whole) have no topic: answer an empty list.',
    'Give also its part of speech: noun, verb, adjective, or other (adverbs, pronouns, phrases...).',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/** JSON schema of the answer (Gemini "responseSchema" format). */
export const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    topics: { type: 'ARRAY', items: { type: 'STRING', enum: [...TOPIC_IDS] } },
    partOfSpeech: { type: 'STRING', enum: [...PARTS_OF_SPEECH] },
  },
  required: ['topics', 'partOfSpeech'],
};

export type ModelAnswer = { topics: TopicId[]; partOfSpeech: PartOfSpeech | null };

/** Reads the model's JSON answer; unknown topics are dropped, at most MAX_TOPICS are kept. */
export function parseModelAnswer(text: string): ModelAnswer | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null || !Array.isArray((data as { topics?: unknown }).topics)) {
    return null;
  }
  const { topics, partOfSpeech } = data as { topics: unknown[]; partOfSpeech?: unknown };
  const valid = TOPIC_IDS.filter((id) => topics.includes(id)).slice(0, MAX_TOPICS);
  const kind = (PARTS_OF_SPEECH as readonly unknown[]).includes(partOfSpeech) ? (partOfSpeech as PartOfSpeech) : null;
  return { topics: valid, partOfSpeech: kind };
}
