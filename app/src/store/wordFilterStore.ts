// Filters of the Dictionary list (categories and kinds of word).
// Not saved: opening the app with a forgotten filter on would look like missing words.

import { create } from 'zustand';

import type { PartOfSpeech } from '@/domain/partOfSpeech';
import type { TopicId } from '@/domain/topics';

type WordFilterState = {
  /** Empty = every category. */
  topics: TopicId[];
  /** Empty = every kind. */
  kinds: PartOfSpeech[];
  setTopics: (topics: TopicId[]) => void;
  setKinds: (kinds: PartOfSpeech[]) => void;
};

export const useWordFilterStore = create<WordFilterState>()((set) => ({
  topics: [],
  kinds: [],
  setTopics: (topics) => set({ topics }),
  setKinds: (kinds) => set({ kinds }),
}));
