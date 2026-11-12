// Reads the meanings of a word, grouped by sense, from the raw text (wikitext) of an
// English Wiktionary page. Pure functions: the download is in services/wiktionary.ts.
//
// Two cases:
// - English word: the "Translations" tables, one per sense, e.g. "stroke":
//     (act of hitting) colpo · (swimming) bracciata · (medicine) ictus, accidente cerebrovascolare
// - word of another language, translated into English: the definitions of its section,
//   e.g. Italian "casa": (noun) house, home · (noun) household, family

import type { LanguageCode } from './languages';
import type { PartOfSpeech } from './partOfSpeech';

export type SenseGroup = {
  /** Kind of word of this sense (from the heading: Noun, Verb…). */
  partOfSpeech: PartOfSpeech;
  /** What this sense means, in English (empty when Wiktionary gives none). */
  gloss: string;
  /** The translations for this sense, best first. */
  translations: string[];
  /**
   * How common the sense is, estimated by how many languages Wiktionary translates it into:
   * editors translate the everyday senses first ("stroke": caress 76, brain 48, hit 31…,
   * "rower nearest to the stern" 2). 0 when unknown (definitions of other languages).
   */
  popularity: number;
};

/** Name of each language as Wiktionary writes it in headings and translation lines. */
const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  it: 'Italian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
};

const KINDS: Record<string, PartOfSpeech> = {
  noun: 'noun',
  'proper noun': 'noun',
  verb: 'verb',
  adjective: 'adjective',
};

/** Groups kept at most (the most common senses come first on Wiktionary). */
export const MAX_SENSE_GROUPS = 25;
/** Translations per group at most. */
const MAX_TRANSLATIONS = 4;

/** The part of the page about one language: from "==Italian==" to the next language. */
export function languageSection(wikitext: string, language: LanguageCode): string {
  const heading = new RegExp(`^==\\s*${LANGUAGE_NAMES[language]}\\s*==\\s*$`, 'm');
  const start = wikitext.search(heading);
  if (start < 0) {
    return '';
  }
  const rest = wikitext.slice(start + 2);
  const next = rest.search(/^==[^=]/m);
  return next < 0 ? rest : rest.slice(0, next);
}

/** "[[a|b]]" -> "b", "[[a]]" -> "a", "{{w|x}}" -> "x", other templates removed. */
export function plainText(wikitext: string): string {
  return wikitext
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\{\{(?:w|l|m|ll)\|(?:[a-z-]+\|)?([^}|]*)[^}]*\}\}/g, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/'''?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Heading of the kind of word ("====Verb====") -> 'verb'; null for other headings. */
function headingKind(line: string): PartOfSpeech | null | undefined {
  const match = line.match(/^=+\s*([^=]+?)\s*=+\s*$/);
  if (!match) {
    return undefined;
  }
  const name = match[1].toLowerCase();
  if (KINDS[name]) {
    return KINDS[name];
  }
  // Adverb, Pronoun, Phrase…: real kinds of word; Etymology, Translations…: not kinds
  return ['adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'phrase', 'prepositional phrase', 'idiom'].includes(
    name
  )
    ? 'other'
    : null;
}

/** Words of one language in a translation line: {{t+|it|colpo|m}}, {{tt|it|ictus}}, [[word]]. */
function translationsInLine(line: string, code: string): string[] {
  const words: string[] = [];
  for (const match of line.matchAll(/\{\{t{1,2}\+?\|([a-z-]+)\|([^}|]+)[^}]*\}\}/g)) {
    if (match[1] === code) {
      words.push(plainText(match[2]));
    }
  }
  if (words.length === 0) {
    for (const match of line.matchAll(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g)) {
      words.push(match[1]);
    }
  }
  return words.filter(Boolean);
}

function addGroup(groups: SenseGroup[], group: SenseGroup) {
  // Single words before expressions ("ictus" before "accidente cerebrovascolare"): Wiktionary
  // lists them alphabetically, and the one-word translation is usually the everyday one
  const translations = [...new Set(group.translations.map((t) => t.trim()).filter(Boolean))]
    .map((text, index) => ({ text, index, words: text.split(/\s+/).length }))
    .sort((a, b) => a.words - b.words || a.index - b.index)
    .map(({ text }) => text)
    .slice(0, MAX_TRANSLATIONS);
  if (translations.length === 0) {
    return;
  }
  // The same translations under the same kind: one group is enough (the more common one)
  const key = translations.join('|').toLowerCase();
  const same = groups.find((g) => g.partOfSpeech === group.partOfSpeech && g.translations.join('|').toLowerCase() === key);
  if (same) {
    same.popularity = Math.max(same.popularity, group.popularity);
    return;
  }
  groups.push({ ...group, translations });
}

/** Most common senses first; equal ones keep Wiktionary's order. */
export function byPopularity(groups: SenseGroup[]): SenseGroup[] {
  return groups
    .map((group, index) => ({ group, index }))
    .sort((a, b) => b.group.popularity - a.group.popularity || a.index - b.index)
    .map(({ group }) => group);
}

/**
 * English word: one group per translation table that has the target language.
 * `{{trans-see|…}}` (translations kept on another page) is skipped; `{{trans-top-see|…}}` has them.
 */
export function sensesFromTranslationTables(englishSection: string, target: LanguageCode): SenseGroup[] {
  const name = LANGUAGE_NAMES[target];
  const groups: SenseGroup[] = [];
  let kind: PartOfSpeech = 'other';
  let current: SenseGroup | null = null;

  for (const line of englishSection.split('\n')) {
    const heading = headingKind(line);
    if (heading) {
      kind = heading;
      continue;
    }
    const top = line.match(/^\{\{trans-top(?:-also|-see)?\|([^|}]*)/);
    if (top) {
      current = { partOfSpeech: kind, gloss: plainText(top[1]), translations: [], popularity: 0 };
      continue;
    }
    if (line.startsWith('{{trans-bottom')) {
      if (current) {
        addGroup(groups, current);
      }
      current = null;
      continue;
    }
    if (!current) {
      continue;
    }
    // Every "* Language:" line is one more language this sense is translated into
    if (/^\*:?\s*[^:{}[\]]+:/.test(line)) {
      current.popularity += 1;
    }
    // "* Italian: …" (also "*: Italian:" for sub-languages)
    if (new RegExp(`^\\*:?\\s*${name}:`).test(line)) {
      current.translations.push(...translationsInLine(line, target));
    }
  }
  return byPopularity(groups).slice(0, MAX_SENSE_GROUPS);
}

/**
 * Word of another language translated into English: each definition line ("# …") of its
 * section is a group; labels like {{lb|it|medicine}} become the gloss.
 */
export function sensesFromDefinitions(section: string): SenseGroup[] {
  const groups: SenseGroup[] = [];
  let kind: PartOfSpeech | null = null;

  for (const line of section.split('\n')) {
    const heading = headingKind(line);
    if (heading !== undefined) {
      kind = heading;
      continue;
    }
    if (!kind || !/^#\s/.test(line)) {
      continue;
    }
    // Form-of definitions ("plural of …", {{inflection of|…}}) aren't meanings
    if (/\{\{[^}]*(form of|inflection of|plural of|feminine of|participle of)/i.test(line)) {
      continue;
    }
    const labels = [...line.matchAll(/\{\{(?:lb|lbl|label)\|[a-z-]+\|([^}]*)\}\}/g)]
      .flatMap((match) => match[1].split('|'))
      .filter((label) => !['_', 'or', 'and'].includes(label));
    const text = plainText(line.slice(1)).replace(/\([^)]*\)/g, '');
    const translations = text
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter((part) => part && part.split(' ').length <= 4);
    addGroup(groups, { partOfSpeech: kind, gloss: labels.join(', '), translations, popularity: 0 });
  }
  return groups.slice(0, MAX_SENSE_GROUPS);
}

/**
 * The base word when the page is only a form of it: "barracks" -> "barrack",
 * "running" -> "run". null when the page is a word of its own.
 */
export function lemmaOf(englishSection: string): string | null {
  const match = englishSection.match(
    /\{\{(?:plural of|en-plural of|inflection of|past of|en-past of|en-simple past of|en-third-person singular of|present participle of|en-ing form of|en-past participle of|alternative form of|alt form of|alternative spelling of)\|en\|([^}|]+)/
  );
  return match ? plainText(match[1]) : null;
}

/**
 * Field label at the start of a gloss: "(medicine) loss of brain function" -> "medicine",
 * "(cricket) action of hitting…" -> "cricket". Used to give the meaning its topic.
 */
export function glossLabel(gloss: string): string | null {
  const match = gloss.match(/^\(([^)]+)\)/);
  return match ? match[1].split(/[,;]/)[0].trim() : null;
}

/** The translation subpages a page points to ("{{see translation subpage|Verb}}"). */
export function hasTranslationSubpage(englishSection: string): boolean {
  return /\{\{see translation subpage/.test(englishSection);
}

/** Can Wiktionary give grouped meanings for this pair? English on one side is needed. */
export function sensesAvailable(source: LanguageCode, target: LanguageCode): boolean {
  return source === 'en' || target === 'en';
}
