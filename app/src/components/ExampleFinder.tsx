// Looks up example sentences for a word on Tatoeba and lets the user keep some.

import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import type { LanguagePair } from '@/domain/languages';
import { useT } from '@/i18n';
import { fetchExampleSentences, type ExampleSentence } from '@/services/tatoeba';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';

type ExampleFinderProps = {
  pair: LanguagePair;
  term: string;
  onAdd: (sentence: ExampleSentence) => void;
};

type Status = 'idle' | 'loading' | 'done' | 'error';

export function ExampleFinder({ pair, term, onAdd }: ExampleFinderProps) {
  const t = useT();
  const { colors } = useTheme();
  const [status, setStatus] = useState<Status>('idle');
  const [sentences, setSentences] = useState<ExampleSentence[]>([]);
  const [addedIds, setAddedIds] = useState<number[]>([]);

  const search = async () => {
    setStatus('loading');
    try {
      setSentences(await fetchExampleSentences(pair, term));
      setStatus('done');
    } catch (error) {
      console.error('Tatoeba error:', error);
      setStatus('error');
    }
  };

  const add = (sentence: ExampleSentence) => {
    onAdd(sentence);
    setAddedIds([...addedIds, sentence.id]);
  };

  return (
    <>
      <Button label={t.examples.find} tone="secondary" onPress={search} disabled={!term.trim() || status === 'loading'} />

      {status === 'loading' ? <ActivityIndicator color={colors.primary} /> : null}
      {status === 'error' ? <AppText color="danger">{t.examples.error}</AppText> : null}
      {status === 'done' && sentences.length === 0 ? <AppText color="textMuted">{t.examples.none}</AppText> : null}

      {sentences.map((sentence) => {
        const added = addedIds.includes(sentence.id);

        return (
          <Card key={sentence.id}>
            <AppText variant="bodyBold">{sentence.text}</AppText>
            <AppText color="textMuted">{sentence.translation}</AppText>
            <Pressable onPress={() => add(sentence)} disabled={added} hitSlop={8} style={styles.add}>
              <AppText variant="small" color={added ? 'textMuted' : 'primary'}>
                {added ? t.examples.added : t.examples.add}
              </AppText>
            </Pressable>
          </Card>
        );
      })}

      {status === 'done' && sentences.length > 0 ? (
        <AppText variant="small" color="textMuted">
          {t.examples.credit}
        </AppText>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  add: {
    alignSelf: 'flex-end',
  },
});
