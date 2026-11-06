// Notifications: the daily reminder and its time.

import { Alert, Platform } from 'react-native';

import { Appear } from '@/components/Appear';
import { ListGroup, ListRow } from '@/components/ListGroup';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useT } from '@/i18n';
import { ensureNotificationPermission, formatTime } from '@/services/reminders';
import { useSettingsStore } from '@/store/settingsStore';

/** Times offered for the daily reminder, in minutes after midnight. */
const REMINDER_TIMES = [8 * 60, 13 * 60, 18 * 60, 21 * 60];

export default function NotificationsSettingsScreen() {
  const t = useT();
  const settings = useSettingsStore();

  const reminderOptions = REMINDER_TIMES.map((minutes) => ({ value: String(minutes), label: formatTime(minutes) }));

  const toggleReminder = async (enabled: boolean) => {
    if (!enabled) {
      settings.setReminderEnabled(false);
      return;
    }
    // Permission is asked only now, when the user turns the reminder on
    const granted = Platform.OS !== 'web' && (await ensureNotificationPermission());
    if (granted) {
      settings.setReminderEnabled(true);
    } else {
      Alert.alert(t.settings.notificationsDenied);
    }
  };

  return (
    <Screen>
      <Section title={t.settings.reminderSection} hint={t.settings.reminderHint}>
        <ListGroup>
          <ListRow
            icon="🔔"
            label={t.settings.reminderLabel}
            toggle={{ value: settings.reminderEnabled, onChange: toggleReminder }}
          />
        </ListGroup>
      </Section>

      {settings.reminderEnabled ? (
        <Appear from="down">
          <Section title={t.settings.reminderTimeTitle}>
            <SegmentedControl
              options={reminderOptions}
              value={String(settings.reminderTime)}
              onChange={(value) => settings.setReminderTime(Number(value))}
            />
          </Section>
        </Appear>
      ) : null}
    </Screen>
  );
}
