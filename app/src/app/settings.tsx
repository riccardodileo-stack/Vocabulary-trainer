// Settings modal: theme, app language, native language, studied language and backup.

import { Alert } from 'react-native';

import { Button } from '@/components/Button';
import { OptionList } from '@/components/OptionList';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { parseBackup } from '@/domain/backup';
import { LANGUAGE_CODES, LANGUAGES, studyLanguagesFor, type LanguageCode } from '@/domain/languages';
import { UI_LANGUAGES, useT, type UiLanguage } from '@/i18n';
import { pickBackupText, shareBackup } from '@/services/backupFiles';
import { useSettingsStore, type ThemePreference } from '@/store/settingsStore';
import { useWordStore } from '@/store/wordStore';

export default function SettingsScreen() {
  const t = useT();
  const settings = useSettingsStore();

  const languageOption = (code: LanguageCode) => ({
    value: code,
    label: t.languages[code],
    icon: LANGUAGES[code].flag,
  });

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t.settings.themeSystem },
    { value: 'light', label: t.settings.themeLight },
    { value: 'dark', label: t.settings.themeDark },
  ];

  // UI languages are shown in their own language, so anyone can find theirs
  const uiLanguageOptions: { value: UiLanguage | 'system'; label: string; icon?: string }[] = [
    { value: 'system', label: t.settings.appLanguageSystem, icon: '📱' },
    ...UI_LANGUAGES.map((code) => ({
      value: code,
      label: LANGUAGES[code].nativeName,
      icon: LANGUAGES[code].flag,
    })),
  ];

  const exportBackup = async () => {
    const { words } = useWordStore.getState();

    if (words.length === 0) {
      Alert.alert(t.settings.exportEmpty);
      return;
    }

    try {
      await shareBackup(words);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const importBackup = async () => {
    try {
      const text = await pickBackupText();
      if (text === null) {
        return;
      }

      const backup = parseBackup(text);
      if (!backup || backup.words.length === 0) {
        Alert.alert(t.settings.importInvalid);
        return;
      }

      const { added, updated, skipped } = useWordStore.getState().importWords(backup.words);
      Alert.alert(t.settings.importDoneTitle, t.settings.importDone(added, updated, skipped + backup.invalidCount));
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(t.settings.importError);
    }
  };

  return (
    <Screen>
      <Section title={t.settings.appearance}>
        <SegmentedControl
          options={themeOptions}
          value={settings.themePreference}
          onChange={settings.setThemePreference}
        />
      </Section>

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

      <Section title={t.settings.appLanguage}>
        <OptionList options={uiLanguageOptions} value={settings.uiLanguage} onChange={settings.setUiLanguage} />
      </Section>

      <Section title={t.settings.backup} hint={t.settings.backupHint}>
        <Button label={t.settings.exportBackup} tone="secondary" onPress={exportBackup} />
        <Button label={t.settings.importBackup} tone="secondary" onPress={importBackup} />
      </Section>
    </Screen>
  );
}
