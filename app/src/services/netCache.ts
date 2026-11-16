// Remembers the answers of the online services (Wiktionary, MyMemory, Tatoeba) on the phone:
// the second time a word is looked up the answer is instant, works offline and doesn't count
// against the services' request limits.

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'net:';
const INDEX_KEY = 'net-index';
/** Answers kept at most; the oldest are dropped first. */
const MAX_ENTRIES = 400;
/** Dictionaries change slowly: an answer is good for a month. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

type Entry<T> = { savedAt: number; value: T };

/** Answers already read in this session (no storage round trip). */
const memory = new Map<string, Entry<unknown>>();

async function remember(key: string, entry: Entry<unknown>) {
  memory.set(key, entry);
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
    const index: string[] = JSON.parse((await AsyncStorage.getItem(INDEX_KEY)) ?? '[]');
    const keys = [...index.filter((k) => k !== key), key];
    const dropped = keys.splice(0, Math.max(keys.length - MAX_ENTRIES, 0));
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(keys));
    if (dropped.length > 0) {
      await AsyncStorage.multiRemove(dropped.map((k) => PREFIX + k));
    }
  } catch {
    // Storage full or unavailable: the answer still worked, it just isn't saved
  }
}

/**
 * The saved answer for `key` if there is a fresh one, otherwise `load()` (and its answer is
 * saved). When `load` fails (offline) an old answer is better than none. Errors of `load`
 * are thrown only when nothing is saved.
 */
export async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  let entry = memory.get(key) as Entry<T> | undefined;
  if (!entry) {
    try {
      const saved = await AsyncStorage.getItem(PREFIX + key);
      entry = saved ? (JSON.parse(saved) as Entry<T>) : undefined;
    } catch {
      entry = undefined;
    }
  }
  if (entry && Date.now() - entry.savedAt < MAX_AGE_MS) {
    memory.set(key, entry);
    return entry.value;
  }
  try {
    const value = await load();
    await remember(key, { savedAt: Date.now(), value });
    return value;
  } catch (error) {
    if (entry) {
      return entry.value;
    }
    throw error;
  }
}
