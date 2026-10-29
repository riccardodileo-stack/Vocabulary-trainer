// User preferences: theme, app language, native and studied language, daily words level.

import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { DailyLevel } from '@/domain/dailyWords';
import { isLanguageCode, studyLanguagesFor, type LanguageCode, type LanguagePair } from '@/domain/languages';
import type { UiLanguage } from '@/i18n';

import { persistStorage } from './persistStorage';

export type ThemePreference = 'system' | 'light' | 'dark';

type SettingsState = {
  themePreference: ThemePreference;
  /** 'system' follows the phone language. */
  uiLanguage: UiLanguage | 'system';
  nativeLanguage: LanguageCode;
  studyLanguage: LanguageCode;
  /** Difficulty of the words of the day. */
  dailyLevel: DailyLevel;

  setDailyLevel: (level: DailyLevel) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setUiLanguage: (language: UiLanguage | 'system') => void;
  setNativeLanguage: (language: LanguageCode) => void;
  setStudyLanguage: (language: LanguageCode) => void;
};

function deviceLanguage(): LanguageCode {
  const code = getLocales()[0]?.languageCode;
  return isLanguageCode(code) ? code : 'en';
}

function defaultStudyLanguage(nativeLanguage: LanguageCode): LanguageCode {
  return nativeLanguage === 'en' ? 'es' : 'en';
}

const initialNativeLanguage = deviceLanguage();

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      themePreference: 'system',
      uiLanguage: 'system',
      nativeLanguage: initialNativeLanguage,
      studyLanguage: defaultStudyLanguage(initialNativeLanguage),
      dailyLevel: 'all',

      setDailyLevel: (dailyLevel) => set({ dailyLevel }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setUiLanguage: (uiLanguage) => set({ uiLanguage }),

      setNativeLanguage: (nativeLanguage) => {
        // The studied language can't be the same as the native one
        const studyLanguage = studyLanguagesFor(nativeLanguage).includes(get().studyLanguage)
          ? get().studyLanguage
          : defaultStudyLanguage(nativeLanguage);

        set({ nativeLanguage, studyLanguage });
      },

      setStudyLanguage: (studyLanguage) => set({ studyLanguage }),
    }),
    {
      name: 'settings',
      // New fields with a default (like dailyLevel) need no migration:
      // persist fills them from the initial state above.
      version: 1,
      storage: persistStorage,
    }
  )
);

/** The vocabulary currently shown: studied language -> native language. */
export function useActivePair(): LanguagePair {
  const source = useSettingsStore((state) => state.studyLanguage);
  const target = useSettingsStore((state) => state.nativeLanguage);
  return { source, target };
}
