// Languages the user can study or use as native (translation) language.
// To add a language: add it here, then check its dictionary links in dictionaries.ts.
// `englishName` is used in Reverso links, `tatoeba` is the code of the sentences service.

export const LANGUAGES = {
  en: { flag: '🇬🇧', nativeName: 'English', englishName: 'english', tatoeba: 'eng' },
  it: { flag: '🇮🇹', nativeName: 'Italiano', englishName: 'italian', tatoeba: 'ita' },
  es: { flag: '🇪🇸', nativeName: 'Español', englishName: 'spanish', tatoeba: 'spa' },
  fr: { flag: '🇫🇷', nativeName: 'Français', englishName: 'french', tatoeba: 'fra' },
  de: { flag: '🇩🇪', nativeName: 'Deutsch', englishName: 'german', tatoeba: 'deu' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[];

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && value in LANGUAGES;
}

/** A vocabulary is identified by the language studied and the language of the translations. */
export type LanguagePair = {
  source: LanguageCode;
  target: LanguageCode;
};

export function studyLanguagesFor(nativeLanguage: LanguageCode): LanguageCode[] {
  return LANGUAGE_CODES.filter((code) => code !== nativeLanguage);
}
