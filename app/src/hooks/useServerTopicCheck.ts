// Background check of the topics on the server, for the meanings the phone left without topics
// (rare words, new pairs: "stroke" = "bracciata"). One meaning at a time while the app is open;
// each meaning is asked once (topicsChecked). Topics chosen by hand are never touched.
// The server answers from its Wiktionary pairs; a pair it doesn't know (not_found) keeps the
// phone's guess. Offline, or when the server can't answer: stops and tries again at the next
// launch.

import { useEffect } from 'react';

import { isTopicId } from '@/domain/topics';
import { meaningToCheckOnServer } from '@/domain/word';
import { classifyOnServer } from '@/services/topicServer';
import { useWordStore } from '@/store/wordStore';

/** Pause between two meanings: gentle with the server and with the phone's battery. */
const PAUSE_MS = 500;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useServerTopicCheck(enabled: boolean) {
  // Restarted when words are added or removed, so a new word is checked without a new launch
  const wordCount = useWordStore((state) => state.words.length);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;

    (async () => {
      // Read the list at every step: words can be added, edited or deleted meanwhile
      while (!cancelled) {
        const next = meaningToCheckOnServer(useWordStore.getState().words);
        if (!next) {
          return;
        }
        const { word, index } = next;
        const meaning = word.meanings[index];
        const answer = await classifyOnServer({ source: word.sourceLang, target: word.targetLang }, word.term, meaning.text);
        // Offline, timeout, server not answering: try again at the next launch
        if (cancelled || !answer || (!answer.ok && answer.error === 'unavailable')) {
          return;
        }

        const current = useWordStore.getState().words.find((candidate) => candidate.id === word.id);
        const currentMeaning = current?.meanings[index];
        // Still the same meaning, still without topics chosen meanwhile
        if (current && currentMeaning && currentMeaning.text === meaning.text && !currentMeaning.topicsByUser) {
          const topics = answer.ok ? answer.topics.filter(isTopicId) : [];
          const keep = (currentMeaning.topics?.length ?? 0) > 0 ? currentMeaning.topics : topics;
          useWordStore.getState().updateWord(word.id, {
            meanings: current.meanings.map((other, i) => (i === index ? { ...other, topics: keep, topicsChecked: true } : other)),
          });
        }
        await wait(PAUSE_MS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, wordCount]);
}
