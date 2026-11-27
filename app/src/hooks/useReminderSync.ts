// Keeps the daily reminder in line with the settings: scheduled at the chosen time
// when on, removed when off, rewritten when the app language changes.
// Mounted once in the root layout.

import { getPermissionsAsync } from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useT } from '@/i18n';
import { cancelReminders, scheduleDailyReminder } from '@/services/reminders';
import { useSettingsStore } from '@/store/settingsStore';

/** `ready`: the saved settings are loaded (before that the defaults would cancel the reminder). */
export function useReminderSync(ready: boolean) {
  const t = useT();
  const enabled = useSettingsStore((state) => state.reminderEnabled);
  const time = useSettingsStore((state) => state.reminderTime);
  const pendingSync = useRef(Promise.resolve());

  useEffect(() => {
    // Local notifications don't exist on the web
    if (Platform.OS === 'web' || !ready) {
      return;
    }

    let cancelled = false;
    const sync = async () => {
      if (cancelled) {
        return;
      }
      if (!enabled) {
        await cancelReminders();
        return;
      }
      // Permission is asked when the user turns the reminder on, never at startup
      const { granted } = await getPermissionsAsync();
      if (granted && !cancelled) {
        await scheduleDailyReminder(time, { title: t.reminder.title, body: t.reminder.body });
      }
    };

    // Finish the previous native update before applying a newer choice.
    pendingSync.current = pendingSync.current.then(sync).catch((error) => console.warn('Reminder error:', error));
    return () => {
      cancelled = true;
    };
  }, [ready, enabled, time, t]);
}