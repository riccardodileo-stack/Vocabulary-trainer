// Kind of word: noun, verb, adjective or other (adverbs, expressions…).
// guessPartOfSpeech works offline from the shape of the word and of its translations;
// pickPartOfSpeech chooses from what a dictionary (Wiktionary) says, see services/wiktionary.ts.

import type { LanguageCode, LanguagePair } from './languages';
import { removeAccents, splitSlashOptions } from './text';

export const PARTS_OF_SPEECH = ['noun', 'verb', 'adjective', 'other'] as const;

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];

export function isPartOfSpeech(value: unknown): value is PartOfSpeech {
  return typeof value === 'string' && (PARTS_OF_SPEECH as readonly string[]).includes(value);
}

/** "noun,verb,xyz" -> ["noun", "verb"] (route params). */
export function parsePartOfSpeechList(text: string | undefined): PartOfSpeech[] {
  return (text ?? '').split(',').filter(isPartOfSpeech);
}

/** Articles that say "this is a noun" when they start a translation ("il libro", "das Haus"). */
const NOUN_ARTICLES: Record<LanguageCode, RegExp> = {
  en: /^(the|a|an) /,
  it: /^(il|lo|la|i|gli|le|un|uno|una) |^(l'|un')/,
  es: /^(el|la|los|las|un|una) /,
  fr: /^(le|la|les|un|une) |^l'/,
  de: /^(der|die|das|ein|eine) /,
};

/** Infinitive endings (single words). Italian -iere words are nouns (cameriere, bicchiere). */
const INFINITIVE: Record<LanguageCode, RegExp | null> = {
  en: null,
  it: /^(?!.*iere$)[a-z]+(are|ere|ire|arsi|ersi|irsi|urre|orre)$/,
  es: /^[a-z]+(ar|er|ir|arse|erse|irse)$/,
  fr: /^[a-z]+(er|ir|re)$/,
  de: /^[a-z]+(en|ern|eln)$/,
};

/**
 * Only endings that are rarely nouns: -ent, -ic… (student, music) are left out on purpose.
 * At least 3 letters must come before the ending ("table" is not "t + able").
 */
const ADJECTIVE_ENDINGS: Record<LanguageCode, RegExp> = {
  en: /^.{3,}(ous|ful|ive|able|ible|less|ish|ical)$/,
  it: /^.{3,}(oso|osa|osi|ose|abile|ibile|evole)$/,
  es: /^.{3,}(oso|osa|able|ible)$/,
  fr: /^.{3,}(eux|euse|able|ible|if|ive)$/,
  de: /^.{3,}(ig|lich|isch|bar|sam|los)$/,
};

const NOUN_ENDINGS: Record<LanguageCode, RegExp> = {
  en: /^.{3,}(tion|sion|ness|ment|ity|ship|hood|ism|ance|ence|ure|dom)$/,
  it: /^.{3,}(zione|sione|mento|tà|ezza|ismo|ura|aggio)$/,
  es: /^.{3,}(ción|sión|miento|dad|eza|ismo|ura|aje)$/,
  fr: /^.{3,}(tion|sion|ment|té|esse|isme|ure|age)$/,
  de: /^.{3,}(ung|heit|keit|schaft|tion|ismus|tät)$/,
};

type Piece = { text: string; lang: LanguageCode; original: string };

function pieces(term: string, meanings: string[], { source, target }: LanguagePair): Piece[] {
  return [
    ...splitSlashOptions(term).map((text) => ({ text, lang: source })),
    ...meanings.flatMap(splitSlashOptions).map((text) => ({ text, lang: target })),
  ].map(({ text, lang }) => ({ text: text.trim().toLowerCase(), lang, original: text.trim() }));
}

/**
 * Best offline guess, from the strongest clue to the weakest:
 * "to run" -> verb; "il libro" / "das Haus" -> noun; an infinitive translation ("correre") -> verb;
 * typical endings (-ous / -oso -> adjective, -tion / -zione -> noun). No clue: noun, the most common kind.
 */
export function guessPartOfSpeech(term: string, meanings: string[], pair: LanguagePair): PartOfSpeech {
  const all = pieces(term, meanings, pair);
  const single = all.filter((piece) => !piece.text.includes(' '));

  if (all.some((piece) => piece.lang === 'en' && piece.text.startsWith('to '))) {
    return 'verb';
  }
  if (all.some((piece) => NOUN_ARTICLES[piece.lang].test(piece.text))) {
    return 'noun';
  }
  // German nouns are written with a capital letter
  if (single.some((piece) => piece.lang === 'de' && /^[A-ZÄÖÜ]/.test(piece.original))) {
    return 'noun';
  }
  if (single.some((piece) => INFINITIVE[piece.lang]?.test(removeAccents(piece.text)))) {
    return 'verb';
  }
  if (single.some((piece) => ADJECTIVE_ENDINGS[piece.lang].test(piece.text))) {
    return 'adjective';
  }
  if (single.some((piece) => NOUN_ENDINGS[piece.lang].test(piece.text))) {
    return 'noun';
  }
  return all.some((piece) => piece.text.includes(' ')) ? 'other' : 'noun';
}

/**
 * Chooses from the kinds a dictionary lists, in its order, for the word and for its translation.
 * A kind both have wins ("boring": noun, verb, adjective; "noioso": adjective, noun -> adjective).
 */
export function pickPartOfSpeech(termKinds: PartOfSpeech[], meaningKinds: PartOfSpeech[], term: string): PartOfSpeech | null {
  if (/^to /i.test(term.trim()) && termKinds.includes('verb')) {
    return 'verb';
  }
  const shared = meaningKinds.filter((kind) => termKinds.includes(kind));
  return shared[0] ?? termKinds[0] ?? meaningKinds[0] ?? null;
}
