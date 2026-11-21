// Sends the summary of the user's studies to the server (services/profileStats.ts), so friends
// can see it in their profile: when the app opens, when it comes back to the foreground and a
// moment after words, medals or the privacy switch change. Only a summary leaves the phone.
// Mounted once in app/_layout.tsx, only with an account. Offline nothing happens: the next
// occasion sends it again.

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { computeAchievements } from '@/domain/achievements';
import { buildProfileStats } from '@/domain/friendProfile';
import { saveProfileStats } from '@/services/profileStats';
import { useActivityStore } from '@/store/activityStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useWordStore } from '@/store/wordStore';

/** Wait after a change, so a quiz (many answers) sends once. */
const SYNC_DELAY_MS = 5000;

/** The last summary the server accepted: the same one isn't sent twice. */
let lastSent = '';

export async function syncProfileStats(): Promise<void> {
  const { words } = useWordStore.getState();
  const { bestStreak, perfectQuizzes } = useActivityStore.getState();
  const { shareStats, nativeLanguage } = useSettingsStore.getState();
  const stats = buildProfileStats(words, computeAchievements({ words, bestStreak, perfectQuizzes }), nativeLanguage);
  const key = JSON.stringify({ shareStats, stats: shareStats ? stats : null });
  if (key === lastSent) {
    return;
  }
  try {
    await saveProfileStats(shareStats, stats);
    lastSent = key;
  } catch {
    // Offline or no profile yet: tried again next time
  }
}

export function useProfileStatsSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    // Maybe another account than last time: send again
    lastSent = '';
    syncProfileStats();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(syncProfileStats, SYNC_DELAY_MS);
    };
    const unsubscribers = [
      useWordStore.subscribe((state, previous) => state.words !== previous.words && later()),
      useActivityStore.subscribe(
        (state, previous) =>
          (state.bestStreak !== previous.bestStreak || state.perfectQuizzes !== previous.perfectQuizzes) && later()
      ),
      useSettingsStore.subscribe((state, previous) => {
        // The privacy switch is sent at once: the user expects it to work right away
        if (state.shareStats !== previous.shareStats) {
          clearTimeout(timer);
          syncProfileStats();
        } else if (state.nativeLanguage !== previous.nativeLanguage) {
          later();
        }
      }),
    ];
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        syncProfileStats();
      }
    });
    return () => {
      clearTimeout(timer);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      appState.remove();
    };
  }, [enabled]);
}
