import { router } from 'expo-router';
import { Keyboard, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { HeaderButton } from '@/components/HeaderButton';
import { Screen } from '@/components/Screen';
import { WordForm } from '@/components/WordForm';
import { belongsToPair, hasSameTerm, type NewWordInput } from '@/domain/word';
import { useT } from '@/i18n';
import { useActivePair } from '@/store/settingsStore';
import { useWordStore } from '@/store/wordStore';
import { spacing } from '@/theme';

export default function AddWordSheet() {
  const t = useT();
  const pair = useActivePair();

  function close() {
    Keyboard.dismiss();
    router.back();
  }

  function saveWord(input: NewWordInput): string | null {
    const { words, addWord } = useWordStore.getState();
    if (words.some((word) => belongsToPair(word, pair) && hasSameTerm(word, input.term))) {
      return t.wordForm.errorDuplicate;
    }

    addWord(pair, input);
    close();
    return null;
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header" style={styles.title}>
          {t.words.add}
        </AppText>
        <HeaderButton label={t.common.cancel} onPress={close} />
      </View>
      <WordForm pair={pair} autoFocus={false} onSave={saveWord} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: 1 },
});