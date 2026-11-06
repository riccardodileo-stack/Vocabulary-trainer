// Daily reminder: a local notification ("time to review!") at the time chosen
// in the settings. Local notifications need no server and work in Expo Go.
//
// The reminder is (re)scheduled by useReminderSync (root layout) whenever the
// setting or the time changes, so this file only talks to the OS.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'daily-reminder';

/** Show the reminder even when the app is open. Call once at startup. */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Asks for permission if needed. Returns false if the user refused. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // On Android 13+ the permission prompt appears only once a channel exists
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily reminder',
      // eslint-disable-next-line import/namespace -- re-exported with `export *`, the lint rule can't follow it
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  if (!current.canAskAgain) {
    return false;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export type ReminderContent = { title: string; body: string };

/** Replaces any reminder with one every day at `minutes` after midnight. */
export async function scheduleDailyReminder(minutes: number, content: ReminderContent): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: content.title, body: content.body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: Math.floor(minutes / 60),
      minute: minutes % 60,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    },
  });
}

export async function cancelReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** "20:00" */
export function formatTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
