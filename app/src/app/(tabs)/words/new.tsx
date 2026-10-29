// Screen to add a word to the active language pair.

import { Stack, router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { WordForm } from '@/components/WordForm';
import { hasSameTerm } from '@/domain/word';
import { useT } from '@/i18n';
import { useActivePair } from '@/store/settingsStore';
import { useWordStore, useWordsOfPair } from '@/store/wordStore';

export default function NewWordScreen() {
  const t = useT();
  const pair = useActivePair();
  const words = useWordsOfPair(pair);
  const addWord = useWordStore((state) => state.addWord);

  return (
    <>
      <Stack.Screen options={{ title: t.wordForm.newTitle, headerLargeTitle: false }} />

      <Screen>
        <WordForm
          pair={pair}
          onSave={(input) => {
            if (words.some((word) => hasSameTerm(word, input.term))) {
              return t.wordForm.errorDuplicate;
            }

            addWord(pair, input);
            router.back();
            return null;
          }}
        />
      </Screen>
    </>
  );
}
