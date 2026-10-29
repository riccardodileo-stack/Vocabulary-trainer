// Example sentences from Tatoeba (tatoeba.org, free, CC BY licence).
// Docs: https://api.tatoeba.org

import { LANGUAGES, type LanguagePair } from '@/domain/languages';

export type ExampleSentence = {
  id: number;
  text: string;
  translation: string;
};

type TatoebaSentence = {
  id: number;
  text: string;
  translations: { text: string }[];
};

const API_URL = 'https://api.tatoeba.org/unstable/sentences';

/** "give up" -> "=give =up": exact words, so "boring" doesn't also find "bored". */
function exactQuery(term: string): string {
  const words = term.trim().split(/\s+/).map((word) => `=${word}`);
  return `"${words.join(' ')}"`;
}

/** Short sentences containing the word, each with a translation in the native language. */
export async function fetchExampleSentences(
  { source, target }: LanguagePair,
  term: string,
  limit = 5
): Promise<ExampleSentence[]> {
  const params = new URLSearchParams({
    lang: LANGUAGES[source].tatoeba,
    q: exactQuery(term),
    'trans:lang': LANGUAGES[target].tatoeba,
    showtrans: 'matching',
    sort: 'words',
    limit: String(limit),
  });

  const response = await fetch(`${API_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Tatoeba error ${response.status}`);
  }

  const { data } = (await response.json()) as { data: TatoebaSentence[] };

  return data
    .filter((sentence) => sentence.translations.length > 0)
    .map((sentence) => ({
      id: sentence.id,
      text: sentence.text,
      translation: sentence.translations[0].text,
    }));
}
