// The pure part of classify-meaning: checking the request and the database key.
// No network and no database here, so it is all covered by classify.test.ts.

import { type ClassifyRequest, type LanguageCode, LANGUAGES } from '../_shared/contract.ts';

/** Lower case, trimmed, single spaces (normalizeText in the app): the form shown to the model. */
export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Same as LEADING_WORDS in app/src/domain/text.ts. */
const LEADING_WORDS: Record<LanguageCode, string[]> = {
  en: ['the', 'a', 'an', 'to'],
  it: ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', "l'", "un'"],
  es: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'],
  fr: ['le', 'la', 'les', 'un', 'une', 'des', "l'", 'se', "s'"],
  de: ['der', 'die', 'das', 'ein', 'eine', 'einen'],
};

/**
 * The form used as database key, the same as dictionaryForm in the app and the Wiktionary
 * lists: no leading article or "to", no accents, ’ written as '. "The Court" -> "court",
 * "la città" -> "citta". So "to bake" and "bake" are the same row.
 */
export function keyForm(text: string, language: LanguageCode): string {
  let folded = text.trim().toLowerCase();
  for (const word of LEADING_WORDS[language]) {
    const prefix = word.endsWith("'") ? word : `${word} `;
    if (folded.startsWith(prefix) && folded.length > prefix.length) {
      folded = folded.slice(prefix.length).trim();
      break;
    }
  }
  return folded
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/’/g, "'")
    .split(/\s+/)
    .join(' ');
}

const LIMITS = { term: 80, translation: 120, example: 300 };

/** Database key of a request: (languages, word, translation) in keyForm. */
export function storageKey(request: ClassifyRequest) {
  return {
    source_lang: request.sourceLang,
    target_lang: request.targetLang,
    term: keyForm(request.term, request.sourceLang),
    translation: keyForm(request.translation, request.targetLang),
  };
}

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
