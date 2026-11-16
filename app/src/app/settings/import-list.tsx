// Import words from a list: pasted text or a text/CSV file, one "word - translation" per line.
// What will be added is shown while typing; kinds and categories are assigned as for any new word.

import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/Appear';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { TextField } from '@/components/TextField';
import { LANGUAGES } from '@/domain/languages';
import { createWord } from '@/domain/word';
import { parseWordList } from '@/domain/wordList';
import { useT } from '@/i18n';
import { pickBackupText } from '@/services/backupFiles';
import { useActivePair } from '@/store/settingsStore';
import { useWordStore } from '@/store/wordStore';
import { radius, spacing, useTheme } from '@/theme';

/** Entries shown in the preview. */
const PREVIEW_ENTRIES = 5;

export default function ImportListScreen() {
  const t = useT();
  const { colors } = useTheme();
  const pair = useActivePair();
  const [text, setText] = useState('');

  const { entries, invalidLines } = parseWordList(text);
  const pairLabel = `${LANGUAGES[pair.source].flag} ${t.languages[pair.source]} → ${LANGUAGES[pair.target].flag} ${t.languages[pair.target]}`;

  const pickFile = async () => {
    try {
      const fileText = await pickBackupText();
      if (fileText !== null) {
        setText(fileText);
      }
    } catch (error) {
      console.error('List file error:', error);
      Alert.alert(t.settings.importError);
    }
  };

  const importList = () => {
    const words = entries.map((entry) =>
      createWord(pair, { term: entry.term, meanings: entry.meanings.map((meaning) => ({ text: meaning, examples: [] })) })
    );
    const { added, updated, skipped } = useWordStore.getState().importWords(words);
    Alert.alert(t.settings.importDoneTitle, t.settings.importDone(added, updated, skipped));
    router.back();
  };

  return (
    <Screen>
      <Section title={t.importList.listTitle} hint={t.importList.hint}>
        <Pill label={pairLabel} tone="primary" />
        <TextField
          value={text}
          onChangeText={setText}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t.importList.placeholder}
          accessibilityLabel={t.importList.listTitle}
          style={styles.input}
        />
        <Button label={t.importList.pickFile} tone="secondary" onPress={pickFile} />
      </Section>

      {entries.length > 0 || invalidLines.length > 0 ? (
        <Appear from="down">
          <Section title={t.importList.preview}>
            <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {entries.slice(0, PREVIEW_ENTRIES).map((entry, index) => (
                <View
                  key={entry.term}
                  style={[styles.row, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <AppText variant="bodyBold" style={styles.term} numberOfLines={1}>
                    {entry.term}
                  </AppText>
                  <AppText color="textMuted" style={styles.meanings} numberOfLines={1}>
                    {entry.meanings.join(', ')}
                  </AppText>
                </View>
              ))}
              {entries.length > PREVIEW_ENTRIES ? (
                <AppText variant="small" color="textMuted" style={styles.more}>
                  {t.importList.more(entries.length - PREVIEW_ENTRIES)}
                </AppText>
              ) : null}
              {entries.length === 0 ? (
                <AppText color="textMuted" style={styles.more}>
                  {t.importList.nothing}
                </AppText>
              ) : null}
            </View>
            {invalidLines.length > 0 ? (
              <AppText variant="small" color="warning">
                {t.importList.invalid(invalidLines.length, invalidLines[0])}
              </AppText>
            ) : null}
          </Section>
        </Appear>
      ) : null}

      <Button label={t.importList.add(entries.length)} onPress={importList} disabled={entries.length === 0} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 160,
  },
  preview: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  term: {
    flexShrink: 1,
    maxWidth: '45%',
  },
  meanings: {
    flex: 1,
    textAlign: 'right',
  },
  more: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
});
