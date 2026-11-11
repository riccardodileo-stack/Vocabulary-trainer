// Languages: language of the app, studied language, my language, daily words level.

import { OptionList } from '@/components/OptionList';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { StudySettings } from '@/components/StudySettings';
import { LANGUAGES } from '@/domain/languages';
import { UI_LANGUAGES, useT, type UiLanguage } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';

export default function LanguagesSettingsScreen() {
  const t = useT();
  const uiLanguage = useSettingsStore((state) => state.uiLanguage);
  const setUiLanguage = useSettingsStore((state) => state.setUiLanguage);

  // UI languages are shown in their own language, so anyone can find theirs
  const uiLanguageOptions: { value: UiLanguage | 'system'; label: string; icon?: string }[] = [
    { value: 'system', label: t.settings.appLanguageSystem, icon: '📱' },
    ...UI_LANGUAGES.map((code) => ({ value: code, label: LANGUAGES[code].nativeName, icon: LANGUAGES[code].flag })),
  ];

  return (
    <Screen>
      <StudySettings />

      <Section title={t.settings.appLanguage}>
        <OptionList options={uiLanguageOptions} value={uiLanguage} onChange={setUiLanguage} />
      </Section>
    </Screen>
  );
}
