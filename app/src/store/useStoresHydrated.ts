// Saved data is read asynchronously at startup.
// The root layout keeps the splash screen visible until every store is loaded.

import { useSyncExternalStore } from 'react';

import { useActivityStore } from './activityStore';
import { useDailyStore } from './dailyStore';
import { useSettingsStore } from './settingsStore';
import { useWordStore } from './wordStore';

/** Every store that uses `persist`. Add new persisted stores here. */
const PERSISTED_STORES = [useSettingsStore, useWordStore, useActivityStore, useDailyStore];

function allHydrated(): boolean {
  return PERSISTED_STORES.every((store) => store.persist.hasHydrated());
}

function subscribe(onChange: () => void): () => void {
  const unsubscribers = PERSISTED_STORES.map((store) => store.persist.onFinishHydration(onChange));
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export function useStoresHydrated(): boolean {
  return useSyncExternalStore(subscribe, allHydrated);
}
