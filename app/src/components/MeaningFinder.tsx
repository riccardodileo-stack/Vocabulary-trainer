// "Find meanings": looks up the translations of the word online (MyMemory) and shows them
// as chips; tapping one puts it among the meanings of the word.

import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { LanguagePair } from '@/domain/languages';
import { normalizeText } from '@/domain/text';
import { useT } from '@/i18n';
import { fetchMeanings } from '@/services/meanings';
import { radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Appear } from './Appear';
import { Button } from './Button';

type MeaningFinderProps = {
  pair: LanguagePair;
  term: string;
  /** Meanings already in the form: their chips show ✓ and can't be added twice. */
  meanings: string[];
  onAdd: (meaning: string) => void;
};

type Result =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'done'; term: string; meanings: string[] };

export function MeaningFinder({ pair, term, meanings, onAdd }: MeaningFinderProps) {
  const t = useT();
  const { colors } = useTheme();
  const [result, setResult] = useState<Result>({ status: 'idle' });

  const search = async () => {
    setResult({ status: 'loading' });
    try {
      setResult({ status: 'done', term, meanings: await fetchMeanings(pair, term) });
    } catch (error) {
      console.error('Meanings error:', error);
      setResult({ status: 'error' });
    }
  };

  const present = new Set(meanings.map(normalizeText));
  // Results of a word that has since been changed are hidden
  const shown = result.status === 'done' && normalizeText(result.term) === normalizeText(term) ? result : null;

  return (
    <>
      <Button
        label={t.meanings.find}
        tone="secondary"
        onPress={search}
        disabled={!term.trim() || result.status === 'loading'}
      />

      {result.status === 'loading' ? <ActivityIndicator color={colors.primary} /> : null}
      {result.status === 'error' ? <AppText color="danger">{t.meanings.error}</AppText> : null}

      {shown ? (
        <Appear key={shown.term} from="down" style={styles.results}>
          {shown.meanings.length === 0 ? <AppText color="textMuted">{t.meanings.none}</AppText> : null}
          <View style={styles.chips}>
            {shown.meanings.map((meaning) => {
              const added = present.has(normalizeText(meaning));
              return (
                <Pressable
                  key={meaning}
                  onPress={() => onAdd(meaning)}
                  disabled={added}
                  accessibilityRole="button"
                  accessibilityLabel={t.meanings.addAccessibility(meaning)}
                  accessibilityState={{ disabled: added }}
                  style={({ pressed }) => [
                    styles.chip,
                    { backgroundColor: added ? colors.primarySoft : colors.card, borderColor: added ? colors.primary : colors.border },
                    pressed && styles.pressed,
                  ]}>
                  <AppText variant="bodyBold" color={added ? 'primaryStrong' : 'text'}>
                    {added ? `✓ ${meaning}` : `+ ${meaning}`}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {shown.meanings.length > 0 ? (
            <AppText variant="small" color="textMuted">
              {t.meanings.credit}
            </AppText>
          ) : null}
        </Appear>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  results: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: touchTarget - spacing.xs,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
