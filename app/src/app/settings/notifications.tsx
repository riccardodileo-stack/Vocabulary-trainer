// Notifications: the daily reminder and its time.

import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { Appear } from '@/components/Appear';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ListGroup, ListRow } from '@/components/ListGroup';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useT } from '@/i18n';
import { ensureNotificationPermission, formatTime } from '@/services/reminders';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

const REMINDER_TIMES = [8 * 60, 13 * 60, 18 * 60, 21 * 60];
const REMINDER_OPTIONS = REMINDER_TIMES.map((time) => ({ value: String(time), label: formatTime(time) }));

export default function NotificationsSettingsScreen() {
  const t = useT();
  const { colors, scheme } = useTheme();
  const settings = useSettingsStore();
  const [draftTime, setDraftTime] = useState<Date | null>(null);
  const isAndroid = Platform.OS === 'android';
  const customTime = REMINDER_TIMES.includes(settings.reminderTime)
    ? undefined
    : formatTime(settings.reminderTime);

  const closeTimePicker = () => setDraftTime(null);

  const openTimePicker = () => {
    const minutes = settings.reminderTime;
    // Use a fixed local day so a DST change today can't shift the selected hour.
    setDraftTime((draft) => draft ?? new Date(2024, 0, 15, Math.floor(minutes / 60), minutes % 60));
  };

  const saveTime = (minutes: number) => {
    settings.setReminderTime(minutes);
    closeTimePicker();
  };

  const savePickedTime = (date: Date) => saveTime(date.getHours() * 60 + date.getMinutes());

  const toggleReminder = async (enabled: boolean) => {
    if (!enabled) {
      closeTimePicker();
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

  const timePicker = draftTime ? (
    <DateTimePicker
      value={draftTime}
      mode="time"
      display={isAndroid ? 'default' : 'spinner'}
      presentation={isAndroid ? 'dialog' : 'inline'}
      is24Hour
      accentColor={colors.primaryStrong}
      themeVariant={scheme}
      positiveButton={{ label: t.common.save }}
      negativeButton={{ label: t.common.cancel }}
      onValueChange={(_, selectedTime) => {
        if (isAndroid) {
          savePickedTime(selectedTime);
        } else {
          setDraftTime(selectedTime);
        }
      }}
      onDismiss={closeTimePicker}
    />
  ) : null;

  return (
    <Screen>
      <Section title={t.settings.reminderSection} hint={t.settings.reminderHint}>
        <ListGroup>
          <ListRow
            label={t.settings.reminderLabel}
            toggle={{ value: settings.reminderEnabled, onChange: toggleReminder }}
          />
        </ListGroup>
      </Section>

      {settings.reminderEnabled ? (
        <Appear from="down">
          <Section title={t.settings.reminderTimeTitle}>
            <SegmentedControl
              options={REMINDER_OPTIONS}
              value={String(settings.reminderTime)}
              onChange={(value) => saveTime(Number(value))}
            />
            {Platform.OS !== 'web' ? (
              <ListGroup>
                <ListRow
                  label={t.settings.reminderCustomTime}
                  value={customTime}
                  onPress={openTimePicker}
                />
              </ListGroup>
            ) : null}
            {draftTime ? (
              isAndroid ? timePicker : (
                <Card>
                  {timePicker}
                  <Button label={t.common.save} onPress={() => savePickedTime(draftTime)} />
                  <Button label={t.common.cancel} tone="secondary" onPress={closeTimePicker} />
                </Card>
              )
            ) : null}
          </Section>
        </Appear>
      ) : null}
    </Screen>
  );
}