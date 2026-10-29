// Screen to edit or delete an existing word.

import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { WordForm } from '@/components/WordForm';
import { belongsToPair, hasSameTerm, type Word } from '@/domain/word';
import { useT } from '@/i18n';
import { useWord, useWordStore } from '@/store/wordStore';

export default function EditWordScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const word = useWord(id);
  const updateWord = useWordStore((state) => state.updateWord);
  const removeWord = useWordStore((state) => state.removeWord);

  const isDuplicate = (current: Word, term: string) =>
    useWordStore
      .getState()
      .words.some(
        (other) =>
          other.id !== current.id &&
          belongsToPair(other, { source: current.sourceLang, target: current.targetLang }) &&
          hasSameTerm(other, term)
      );

  const confirmDelete = (current: Word) =>
    Alert.alert(t.wordForm.deleteConfirmTitle, t.wordForm.deleteConfirmMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: () => {
          router.back();
          removeWord(current.id);
        },
      },
    ]);

  return (
    <>
      <Stack.Screen options={{ title: t.wordForm.editTitle, headerLargeTitle: false }} />

      <Screen>
        {word ? (
          <WordForm
            pair={{ source: word.sourceLang, target: word.targetLang }}
            initialWord={word}
            onSave={(input) => {
              if (isDuplicate(word, input.term)) {
                return t.wordForm.errorDuplicate;
              }

              updateWord(word.id, input);
              router.back();
              return null;
            }}
            onDelete={() => confirmDelete(word)}
          />
        ) : (
          <Card>
            <AppText color="textMuted">{t.wordForm.notFound}</AppText>
          </Card>
        )}
      </Screen>
    </>
  );
}
