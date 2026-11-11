// The study choices: language I study, my language, level of the words of the day.
// Shown both in the language sheet (from Home) and in the full settings.

import type { DailyLevel } from '@/domain/dailyWords';
import { LANGUAGE_CODES, LANGUAGES, studyLanguagesFor, type LanguageCode } from '@/domain/languages';
import { useT } from '@/i18n';
import { useDailyStore, useKnownIds } from '@/store/dailyStore';
import { useSettingsStore } from '@/store/settingsStore';

import { Button } from './Button';
import { OptionList } from './OptionList';
import { Section } from './Section';
import { SegmentedControl } from './SegmentedControl';

/** Short names of the levels of the words of the day ('all' is translated). */
export const DAILY_LEVEL_LABELS: Record<Exclude<DailyLevel, 'all'>, string> = {
  beginner: 'A1–A2',
  intermediate: 'B1–B2',
  advanced: 'C1–C2',
};

export function StudySettings() {
  const t = useT();
  const settings = useSettingsStore();
  const knownIds = useKnownIds(settings.studyLanguage);
  const clearKnown = useDailyStore((state) => state.clearKnown);

  const languageOption = (code: LanguageCode) => ({
    value: code,
    label: t.languages[code],
    icon: LANGUAGES[code].flag,
  });

  const dailyLevelOptions: { value: DailyLevel; label: string }[] = [
    { value: 'all', label: t.settings.dailyLevelAll },
    { value: 'beginner', label: DAILY_LEVEL_LABELS.beginner },
    { value: 'intermediate', label: DAILY_LEVEL_LABELS.intermediate },
    { value: 'advanced', label: DAILY_LEVEL_LABELS.advanced },
  ];

  return (
    <>
      <Section title={t.settings.studyLanguage}>
        <OptionList
          options={studyLanguagesFor(settings.nativeLanguage).map(languageOption)}
          value={settings.studyLanguage}
          onChange={settings.setStudyLanguage}
        />
      </Section>

      <Section title={t.settings.nativeLanguage} hint={t.settings.nativeLanguageHint}>
        <OptionList
          options={LANGUAGE_CODES.map(languageOption)}
          value={settings.nativeLanguage}
          onChange={settings.setNativeLanguage}
        />
      </Section>

      <Section title={t.settings.dailyLevel} hint={t.settings.dailyLevelHint}>
        <SegmentedControl options={dailyLevelOptions} value={settings.dailyLevel} onChange={settings.setDailyLevel} />
        {knownIds.length > 0 ? (
          <Button
            label={t.settings.resetKnown(knownIds.length)}
            tone="secondary"
            onPress={() => clearKnown(settings.studyLanguage)}
          />
        ) : null}
      </Section>
    </>
  );
}
