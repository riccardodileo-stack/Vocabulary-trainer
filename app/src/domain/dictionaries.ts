// Online dictionaries opened inside the app for a word of the active pair.

import { LANGUAGES, type LanguagePair } from './languages';

export type Dictionary = {
  name: string;
  url: string;
};

/** WordReference only has dictionaries between English and the other languages. */
function wordReferenceUrl({ source, target }: LanguagePair, term: string): string | null {
  if (source !== 'en' && target !== 'en') {
    return null;
  }
  return `https://www.wordreference.com/${source}${target}/${encodeURIComponent(term)}`;
}

/** Reverso Context also shows the word used in real sentences. */
function reversoUrl({ source, target }: LanguagePair, term: string): string {
  const languages = `${LANGUAGES[source].englishName}-${LANGUAGES[target].englishName}`;
  return `https://context.reverso.net/translation/${languages}/${encodeURIComponent(term)}`;
}

export function dictionariesFor(pair: LanguagePair, term: string): Dictionary[] {
  const wordReference = wordReferenceUrl(pair, term);

  return [
    ...(wordReference ? [{ name: 'WordReference', url: wordReference }] : []),
    { name: 'Reverso', url: reversoUrl(pair, term) },
  ];
}
