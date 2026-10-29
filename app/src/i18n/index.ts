// UI translations. Usage in a component:
//   const t = useT();
//   <Text>{t.home.greeting}</Text>
// To add a UI language: create xx.ts with the same keys as en.ts and add it to TRANSLATIONS.

import { useLocales } from 'expo-localization';

import { useSettingsStore } from '@/store/settingsStore';

import { en, type Translations } from './en';
import { it } from './it';

const TRANSLATIONS = { en, it } satisfies Record<string, Translations>;

export type UiLanguage = keyof typeof TRANSLATIONS;

export const UI_LANGUAGES = Object.keys(TRANSLATIONS) as UiLanguage[];

/** Phones in a language we don't translate get English. */
const FALLBACK_LANGUAGE: UiLanguage = 'en';

function isUiLanguage(value: unknown): value is UiLanguage {
  return typeof value === 'string' && value in TRANSLATIONS;
}

export function useUiLanguage(): UiLanguage {
  const preference = useSettingsStore((state) => state.uiLanguage);
  const systemLanguage = useLocales()[0]?.languageCode;

  if (preference !== 'system') {
    return preference;
  }

  return isUiLanguage(systemLanguage) ? systemLanguage : FALLBACK_LANGUAGE;
}

export function useT(): Translations {
  return TRANSLATIONS[useUiLanguage()];
}
