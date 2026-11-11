// Looks up example sentences for a word on Tatoeba and lets the user keep some.
// The word is in bold in the sentence, its translations in bold in the translation.

import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { LanguagePair } from '@/domain/languages';
import { useT } from '@/i18n';
import { fetchExampleSentences, type ExampleSentence } from '@/services/tatoeba';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { HighlightedText } from './HighlightedText';

type ExampleFinderProps = {
  pair: LanguagePair;
  term: string;
  /** Translations typed so far: shown in bold in the translated sentence. */
  meanings: string[];
  onAdd: (sentence: ExampleSentence) => void;
};

type Status = 'idle' | 'loading' | 'done' | 'error';

export function ExampleFinder({ pair, term, meanings, onAdd }: ExampleFinderProps) {
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
            <HighlightedText text={sentence.text} terms={[term]} language={pair.source} />
            <HighlightedText text={sentence.translation} terms={meanings} language={pair.target} color="textMuted" />
            <View style={styles.add}>
              <Button
                label={added ? t.examples.added : t.examples.add}
                tone="secondary"
                size="sm"
                disabled={added}
                onPress={() => add(sentence)}
              />
            </View>
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
