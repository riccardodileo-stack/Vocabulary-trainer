// Kind of word (noun, verb…) and meanings grouped by sense from Wiktionary (en.wiktionary.org):
// free, no account needed.
// The English Wiktionary describes words of every language, grouped by language code.
// Docs: https://en.wiktionary.org/api/rest_v1/#/Page%20content/get_page_definition__term_

import type { LanguageCode, LanguagePair } from '@/domain/languages';
import { pickPartOfSpeech, type PartOfSpeech } from '@/domain/partOfSpeech';
import { splitSlashOptions, stripLeadingWord } from '@/domain/text';
import {
  byPopularity,
  hasTranslationSubpage,
  languageSection,
  lemmaOf,
  sensesAvailable,
  sensesFromDefinitions,
  sensesFromTranslationTables,
  type SenseGroup,
} from '@/domain/wiktionarySenses';

const API_URL = 'https://en.wiktionary.org/api/rest_v1/page/definition/';

/** Wikimedia asks apps to say who they are (browsers can't set User-Agent, this header works). */
const HEADERS = { 'Api-User-Agent': 'VocabularyTrainer/1.0 (Expo app)' };

const KINDS: Record<string, PartOfSpeech> = {
  Noun: 'noun',
  'Proper noun': 'noun',
  Verb: 'verb',
  Adjective: 'adjective',
};

/** Kinds Wiktionary lists for a word in one language, in its order (empty if the word isn't there). */
async function kindsOf(text: string, language: LanguageCode): Promise<PartOfSpeech[]> {
  const title = stripLeadingWord(text.trim(), language).replace(/ /g, '_');
  const response = await fetch(API_URL + encodeURIComponent(title), { headers: HEADERS });
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`Wiktionary error ${response.status}`);
  }
  const data = (await response.json()) as Record<string, { partOfSpeech: string }[] | undefined>;
  const kinds = (data[language] ?? []).map((entry) => KINDS[entry.partOfSpeech] ?? 'other');
  return [...new Set(kinds)];
}

/**
 * The kind of `term`, also looking at its first translation to choose when the word
 * has several ("boring" + "noioso" -> adjective). null when Wiktionary doesn't know it.
 * Throws on network errors (the caller retries later).
 */
export async function fetchPartOfSpeech(
  { source, target }: LanguagePair,
  term: string,
  meanings: string[]
): Promise<PartOfSpeech | null> {
  const firstTerm = splitSlashOptions(term)[0] ?? term;
  const firstMeaning = meanings.flatMap(splitSlashOptions)[0];
  const [termKinds, meaningKinds] = await Promise.all([
    kindsOf(firstTerm, source),
    firstMeaning ? kindsOf(firstMeaning, target) : Promise.resolve([]),
  ]);
  return pickPartOfSpeech(termKinds, meaningKinds, firstTerm);
}

const RAW_URL = 'https://en.wiktionary.org/w/index.php?action=raw&title=';

/** Raw text of a page, or '' when the page doesn't exist. */
async function rawPage(title: string): Promise<string> {
  const response = await fetch(RAW_URL + encodeURIComponent(title.replace(/ /g, '_')), { headers: HEADERS });
  if (response.status === 404) {
    return '';
  }
  if (!response.ok) {
    throw new Error(`Wiktionary error ${response.status}`);
  }
  return response.text();
}

/**
 * The meanings of `term` grouped by sense ("stroke": colpo · bracciata · ictus…).
 * Empty when Wiktionary has nothing for this pair or word (the caller falls back to MyMemory).
 * Throws on network errors.
 */
export async function fetchSenses({ source, target }: LanguagePair, term: string): Promise<SenseGroup[]> {
  if (!sensesAvailable(source, target)) {
    return [];
  }
  const word = stripLeadingWord(splitSlashOptions(term)[0] ?? term, source);

  if (source !== 'en') {
    // Italian "casa" -> English: its definitions are the translations
    return sensesFromDefinitions(languageSection(await rawPage(word), source));
  }

  let section = languageSection(await rawPage(word), 'en');
  let groups = sensesFromTranslationTables(section, target);
  // "barracks" is only "plural of barrack": the translations are on the base word
  const lemma = groups.length === 0 ? lemmaOf(section) : null;
  if (lemma) {
    section = languageSection(await rawPage(lemma), 'en');
    groups = sensesFromTranslationTables(section, target);
  }
  // Long pages ("run") keep their translations on a subpage
  if (hasTranslationSubpage(section)) {
    const subpage = languageSection(await rawPage(`${lemma ?? word}/translations`), 'en');
    groups = byPopularity([...groups, ...sensesFromTranslationTables(subpage, target)]);
  }
  return groups;
}
