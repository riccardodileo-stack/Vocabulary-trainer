// Background check of the kind of word (noun, verb…) on Wiktionary.
// Meanings whose kind was only guessed offline (partOfSpeechSource 'guess') are looked up one
// at a time while the app is open; the result is saved with source 'dictionary', so each
// meaning is looked up once (and the answers are remembered, see services/netCache.ts).
// A choice made by hand ('user') is never touched.

import { useEffect } from 'react';

import { fetchPartOfSpeech } from '@/services/wiktionary';
import { useWordStore } from '@/store/wordStore';

/** Pause between two lookups: gentle with Wiktionary and with the phone's battery. */
const PAUSE_MS = 400;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useWordKindCheck(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;

    (async () => {
      // Read the list at every step: words can be added, edited or deleted meanwhile
      while (!cancelled) {
        const word = useWordStore
          .getState()
          .words.find((candidate) => candidate.meanings.some((meaning) => meaning.partOfSpeechSource === 'guess'));
        const meaning = word?.meanings.find((candidate) => candidate.partOfSpeechSource === 'guess');
        if (!word || !meaning) {
          return;
        }
        try {
          const kind = await fetchPartOfSpeech({ source: word.sourceLang, target: word.targetLang }, word.term, [meaning.text]);
          const current = useWordStore.getState().words.find((candidate) => candidate.id === word.id);
          if (!cancelled && current) {
            // Not found on Wiktionary: the guess stays, but it isn't looked up again
            useWordStore.getState().updateWord(word.id, {
              meanings: current.meanings.map((candidate) =>
                candidate.text === meaning.text && candidate.partOfSpeechSource === 'guess'
                  ? { ...candidate, partOfSpeech: kind ?? candidate.partOfSpeech, partOfSpeechSource: 'dictionary' as const }
                  : candidate
              ),
            });
          }
        } catch {
          // Offline or Wiktionary unavailable: try again at the next launch
          return;
        }
        await wait(PAUSE_MS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
