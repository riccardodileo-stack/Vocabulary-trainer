// Translations of a word from MyMemory (mymemory.translated.net): a free translation memory,
// no account or key needed (anonymous limit: about 5000 characters a day per device).
// Docs: https://mymemory.translated.net/doc/spec.php

import type { LanguagePair } from '@/domain/languages';
import { pickMeanings, type TranslationMatch } from '@/domain/meanings';

const API_URL = 'https://api.mymemory.translated.net/get';

type MyMemoryResponse = {
  responseStatus: number | string;
  responseData: { translatedText: string; match: number };
  matches?: TranslationMatch[];
};

/** The meanings of `term` in the native language, best first (empty if none found). */
export async function fetchMeanings({ source, target }: LanguagePair, term: string): Promise<string[]> {
  const params = new URLSearchParams({ q: term.trim(), langpair: `${source}|${target}` });

  const response = await fetch(`${API_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`MyMemory error ${response.status}`);
  }

  const data = (await response.json()) as MyMemoryResponse;
  if (Number(data.responseStatus) !== 200) {
    throw new Error(`MyMemory error ${data.responseStatus}`);
  }

  // The main translation counts too, in case it is not among the matches
  const main: TranslationMatch = { segment: term, translation: data.responseData.translatedText, quality: 70, match: 1 };
  return pickMeanings(term, [...(data.matches ?? []), main], target);
}
