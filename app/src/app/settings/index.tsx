// Main settings page: the theme right here, everything else in categories.

import { router } from 'expo-router';

import { ListGroup, ListRow } from '@/components/ListGroup';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { DAILY_LEVEL_LABELS } from '@/components/StudySettings';
import { LANGUAGES } from '@/domain/languages';
import { useT } from '@/i18n';
import { formatTime } from '@/services/reminders';
import { useSettingsStore, type ThemePreference } from '@/store/settingsStore';

export default function SettingsScreen() {
  const t = useT();
  const settings = useSettingsStore();

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t.settings.themeSystem },
    { value: 'light', label: t.settings.themeLight },
    { value: 'dark', label: t.settings.themeDark },
  ];

  const level = settings.dailyLevel === 'all' ? t.settings.dailyLevelAll : DAILY_LEVEL_LABELS[settings.dailyLevel];
  const languagesSummary = `${LANGUAGES[settings.studyLanguage].flag} → ${LANGUAGES[settings.nativeLanguage].flag} · ${level}`;

  return (
    <Screen>
      <Section title={t.settings.appearance}>
        <SegmentedControl
          options={themeOptions}
          value={settings.themePreference}
          onChange={settings.setThemePreference}
        />
      </Section>

      <ListGroup>
        <ListRow
          icon="🌍"
          label={t.settings.languagesCategory}
          value={languagesSummary}
          onPress={() => router.push('/settings/languages')}
        />
        <ListRow
          icon="🔊"
          label={t.settings.sounds}
          value={settings.soundsEnabled ? t.settings.on : t.settings.off}
          onPress={() => router.push('/settings/sounds')}
        />
        <ListRow
          icon="🔔"
          label={t.settings.notifications}
          value={settings.reminderEnabled ? formatTime(settings.reminderTime) : t.settings.off}
          onPress={() => router.push('/settings/notifications')}
        />
        <ListRow icon="💾" label={t.settings.backup} onPress={() => router.push('/settings/backup')} />
      </ListGroup>
    </Screen>
  );
}
