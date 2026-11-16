import { describe, expect, it, jest } from '@jest/globals';

// The phone's storage: a Map that survives "restarts" of the app (fresh copies of netCache)
const mockStorage = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (key: string) => mockStorage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      mockStorage.set(key, value);
    },
    multiRemove: async (keys: string[]) => {
      keys.forEach((key) => mockStorage.delete(key));
    },
  },
}));

/** A fresh copy of netCache, as after opening the app again. */
async function freshCache() {
  let module: typeof import('../netCache') | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    module = require('../netCache');
  });
  return module!.cached;
}

describe('netCache', () => {
  it('asks the service once, then answers from what it remembers', async () => {
    const cached = await freshCache();
    const load = jest.fn(async () => ['colpo', 'ictus']);
    expect(await cached('mm:en:it:stroke', load)).toEqual(['colpo', 'ictus']);
    expect(await cached('mm:en:it:stroke', load)).toEqual(['colpo', 'ictus']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps the answer after the app is opened again', async () => {
    await (await freshCache())('tt:en:it:3:house', async () => ['a house']);
    const load = jest.fn(async () => ['other']);
    expect(await (await freshCache())('tt:en:it:3:house', load)).toEqual(['a house']);
    expect(load).not.toHaveBeenCalled();
  });

  it('throws when offline and nothing is saved', async () => {
    const cached = await freshCache();
    await expect(cached('wk-kinds:en:nothing', async () => Promise.reject(new Error('offline')))).rejects.toThrow('offline');
  });
});
