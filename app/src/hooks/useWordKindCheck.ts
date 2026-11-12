// Background check of the kind of word (noun, verb…) on Wiktionary.
// Words whose kind was only guessed offline (partOfSpeechSource 'guess') are looked up one at a
// time while the app is open; the result is saved with source 'dictionary', so each word is
// looked up once. A choice made by hand ('user') is never touched.

import { useEffect } from 'react';

import { fetchPartOfSpeech } from '@/services/wiktionary';
import { useWordStore } from '@/store/wordStore';

/** Pause between two words: gentle with Wiktionary and with the phone's battery. */
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
        const word = useWordStore.getState().words.find((candidate) => candidate.partOfSpeechSource === 'guess');
        if (!word) {
          return;
        }
        try {
          const kind = await fetchPartOfSpeech(
            { source: word.sourceLang, target: word.targetLang },
            word.term,
            word.meanings.map((meaning) => meaning.text)
          );
          const current = useWordStore.getState().words.find((candidate) => candidate.id === word.id);
          // Not found on Wiktionary: the guess stays, but it isn't looked up again
          if (!cancelled && current?.partOfSpeechSource === 'guess') {
            useWordStore.getState().updateWord(word.id, {
              partOfSpeech: kind ?? current.partOfSpeech,
              partOfSpeechSource: 'dictionary',
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
