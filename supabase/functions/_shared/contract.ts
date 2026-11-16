// What classify-meaning receives and returns. The app has the same types: keep the two in step
// (copy this file to app/src/services/serverContract.ts when the app starts calling the server).

export const LANGUAGES = ['en', 'it', 'es', 'fr', 'de'] as const;
export type LanguageCode = (typeof LANGUAGES)[number];

/** Same ids and order as TOPIC_IDS in app/src/domain/topics.ts. */
export const TOPIC_IDS = [
  'tech',
  'health',
  'food',
  'travel',
  'work',
  'home',
  'nature',
  'people',
  'school',
  'sport',
  'culture',
  'feelings',
] as const;
export type TopicId = (typeof TOPIC_IDS)[number];

export const PARTS_OF_SPEECH = ['noun', 'verb', 'adjective', 'other'] as const;
export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];

/** Topics of one meaning at most (same rule as the app). */
export const MAX_TOPICS = 3;

/** POST body. */
export type ClassifyRequest = {
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  /** The studied word, e.g. "stroke". */
  term: string;
  /** One of its translations, e.g. "ictus": it picks the meaning. */
  translation: string;
  /** Optional example sentence: helps the model with rare meanings. */
  example?: string;
};

export type ClassifyResponse =
  | {
      ok: true;
      topics: TopicId[];
      partOfSpeech: PartOfSpeech | null;
      /** Who decided: dictionary, model or user (hand-checked). */
      source: 'dictionary' | 'model' | 'user';
      /** true when the answer was already saved (no model call). */
      cached: boolean;
    }
  | {
      ok: false;
      /**
       * bad_request: the body is wrong (fix the app);
       * unavailable: no model right now (no key, daily cap reached, model error): the app keeps
       * its own offline guess and may ask again another day.
       */
      error: 'bad_request' | 'unavailable';
      message: string;
    };
