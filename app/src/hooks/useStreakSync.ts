// Sends the streak to the server (services/streaks.ts) when the app opens, when it comes back
// to the foreground (the day may have changed: a save used, a streak broken) and a moment
// after a training day is recorded. Mounted once in app/_layout.tsx, only with an account.
// Offline nothing happens: the next occasion sends the numbers again.

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { streakSnapshot } from '@/domain/activity';
import { saveStreak } from '@/services/streaks';
import { useActivityStore } from '@/store/activityStore';

/** Wait after a change of the training days, so a quiz sends once. */
const SYNC_DELAY_MS = 2000;

/** The last numbers the server accepted: the same ones aren't sent twice. */
let lastSent = '';

export async function syncStreak(): Promise<void> {
  const { days, bestStreak } = useActivityStore.getState();
  const snapshot = streakSnapshot(days, bestStreak);
  const key = JSON.stringify(snapshot);
  if (key === lastSent) {
    return;
  }
  try {
    const serverBest = await saveStreak(snapshot);
    lastSent = key;
    // A record from another phone (or before reinstalling) comes back here
    if (serverBest > useActivityStore.getState().bestStreak) {
      useActivityStore.setState({ bestStreak: serverBest });
    }
  } catch {
    // Offline or no profile yet: tried again next time
  }
}

export function useStreakSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    // Maybe another account than last time: send again
    lastSent = '';
    syncStreak();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useActivityStore.subscribe((state, previous) => {
      if (state.days !== previous.days) {
        clearTimeout(timer);
        timer = setTimeout(syncStreak, SYNC_DELAY_MS);
      }
    });
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        syncStreak();
      }
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
      appState.remove();
    };
  }, [enabled]);
}
