// "Find meanings": the translations of the word grouped by sense, from Wiktionary
// ("stroke": (act of hitting) colpo · (swimming) bracciata · (medicine) ictus…), so the less
// common meanings aren't lost. When Wiktionary has nothing (or the pair has no English side)
// the translation memory MyMemory gives a flat list instead. Tapping a translation adds it to
// the meanings; a sense with a field label ("(medicine)") brings its category along.

import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { LanguagePair } from '@/domain/languages';
import { normalizeText } from '@/domain/text';
import { topicsOfLabel } from '@/domain/topicClassifier';
import { TOPIC_ICONS, type TopicId } from '@/domain/topics';
import { glossLabel, type SenseGroup } from '@/domain/wiktionarySenses';
import { useT } from '@/i18n';
import { fetchMeanings } from '@/services/meanings';
import { fetchSenses } from '@/services/wiktionary';
import { radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Appear } from './Appear';
import { Button } from './Button';

type MeaningFinderProps = {
  pair: LanguagePair;
  term: string;
  /** Meanings already in the form: their chips show ✓ and can't be added twice. */
  meanings: string[];
  onAdd: (meaning: string, topics?: TopicId[]) => void;
};

/** Senses shown before "Show more". */
const FIRST_GROUPS = 5;

type Group = SenseGroup & { topics: TopicId[] };

type Result =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'done'; term: string; source: 'wiktionary'; groups: Group[] }
  | { status: 'done'; term: string; source: 'mymemory'; meanings: string[] };

export function MeaningFinder({ pair, term, meanings, onAdd }: MeaningFinderProps) {
  const t = useT();
  const { colors } = useTheme();
  const [result, setResult] = useState<Result>({ status: 'idle' });
  const [showAll, setShowAll] = useState(false);

  const search = async () => {
    setResult({ status: 'loading' });
    setShowAll(false);
    try {
      const senses = await fetchSenses(pair, term).catch(() => []);
      if (senses.length > 0) {
        const groups = senses.map((sense) => {
          const label = glossLabel(sense.gloss);
          return { ...sense, topics: label ? topicsOfLabel(label) : [] };
        });
        setResult({ status: 'done', term, source: 'wiktionary', groups });
      } else {
        setResult({ status: 'done', term, source: 'mymemory', meanings: await fetchMeanings(pair, term) });
      }
    } catch (error) {
      console.error('Meanings error:', error);
      setResult({ status: 'error' });
    }
  };

  const present = new Set(meanings.map(normalizeText));
  // Results of a word that has since been changed are hidden
  const shown = result.status === 'done' && normalizeText(result.term) === normalizeText(term) ? result : null;

  const chip = (meaning: string, topics?: TopicId[]) => {
    const added = present.has(normalizeText(meaning));
    return (
      <Pressable
        key={meaning}
        onPress={() => onAdd(meaning, topics)}
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
  };

  const groups = shown?.source === 'wiktionary' ? shown.groups : [];
  const visibleGroups = showAll ? groups : groups.slice(0, FIRST_GROUPS);

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

      {shown?.source === 'wiktionary' ? (
        <Appear key={shown.term} from="down" style={styles.results}>
          {visibleGroups.map((group, index) => (
            <View
              key={`${group.gloss}-${index}`}
              style={[styles.group, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <AppText variant="small" color="textMuted" numberOfLines={2}>
                {group.topics.length > 0 ? `${group.topics.map((topic) => TOPIC_ICONS[topic]).join(' ')} ` : ''}
                <AppText variant="small" color="text">
                  {t.partsOfSpeech[group.partOfSpeech]}
                </AppText>
                {group.gloss ? ` · ${group.gloss}` : ''}
              </AppText>
              <View style={styles.chips}>{group.translations.map((meaning) => chip(meaning, group.topics))}</View>
            </View>
          ))}
          {groups.length > FIRST_GROUPS && !showAll ? (
            <Button
              label={t.meanings.showMore(groups.length - FIRST_GROUPS)}
              tone="secondary"
              size="sm"
              onPress={() => setShowAll(true)}
            />
          ) : null}
          <AppText variant="small" color="textMuted">
            {t.meanings.creditWiktionary}
          </AppText>
        </Appear>
      ) : null}

      {shown?.source === 'mymemory' ? (
        <Appear key={shown.term} from="down" style={styles.results}>
          {shown.meanings.length === 0 ? <AppText color="textMuted">{t.meanings.none}</AppText> : null}
          <View style={styles.chips}>{shown.meanings.map((meaning) => chip(meaning))}</View>
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
  group: {
    gap: spacing.xs + 2,
    paddingTop: spacing.sm,
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
