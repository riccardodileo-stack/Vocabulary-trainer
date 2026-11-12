// User preferences: theme, app language, native and studied language, daily words level,
// sounds, the daily reminder and the last number of quiz questions.

import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { DailyLevel } from '@/domain/dailyWords';
import type { PartOfSpeech } from '@/domain/partOfSpeech';
import { clampQuizCount, QUIZ_CUSTOM_DEFAULT } from '@/domain/quiz';
import type { TopicId } from '@/domain/topics';
import { isLanguageCode, studyLanguagesFor, type LanguageCode, type LanguagePair } from '@/domain/languages';
import type { UiLanguage } from '@/i18n';

import { persistStorage } from './persistStorage';

export type ThemePreference = 'system' | 'light' | 'dark';

export type QuizCountChoice = '10' | '20' | '0' | 'custom';

type SettingsState = {
  themePreference: ThemePreference;
  /** 'system' follows the phone language. */
  uiLanguage: UiLanguage | 'system';
  nativeLanguage: LanguageCode;
  studyLanguage: LanguageCode;
  /** Difficulty of the words of the day. */
  dailyLevel: DailyLevel;
  /** Short sounds for right / wrong answers in the quiz. */
  soundsEnabled: boolean;
  /** Daily local notification reminding to review. */
  reminderEnabled: boolean;
  /** Time of the reminder, minutes after midnight (e.g. 1080 = 18:00). */
  reminderTime: number;
  /** Last choice of the number of questions: '10', '20', '0' (all) or 'custom'. */
  quizCountChoice: QuizCountChoice;
  /** The number used when quizCountChoice is 'custom'. */
  quizCustomCount: number;
  /** Topics chosen for the quiz; empty = every topic. */
  quizTopics: TopicId[];
  /** Kinds of word chosen for the quiz; empty = every kind. */
  quizPartsOfSpeech: PartOfSpeech[];

  setQuizTopics: (topics: TopicId[]) => void;
  setQuizPartsOfSpeech: (kinds: PartOfSpeech[]) => void;

  setQuizCountChoice: (choice: QuizCountChoice) => void;
  setQuizCustomCount: (count: number) => void;
  setSoundsEnabled: (enabled: boolean) => void;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderTime: (minutes: number) => void;
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
      soundsEnabled: true,
      reminderEnabled: false,
      reminderTime: 18 * 60,
      quizCountChoice: '10',
      quizCustomCount: QUIZ_CUSTOM_DEFAULT,
      quizTopics: [],
      quizPartsOfSpeech: [],

      setQuizTopics: (quizTopics) => set({ quizTopics }),
      setQuizPartsOfSpeech: (quizPartsOfSpeech) => set({ quizPartsOfSpeech }),

      setQuizCountChoice: (quizCountChoice) => set({ quizCountChoice }),
      setQuizCustomCount: (count) => set({ quizCustomCount: clampQuizCount(count) }),

      setSoundsEnabled: (soundsEnabled) => set({ soundsEnabled }),
      setReminderEnabled: (reminderEnabled) => set({ reminderEnabled }),
      setReminderTime: (reminderTime) => set({ reminderTime }),
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
