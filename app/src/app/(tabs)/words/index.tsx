// Word list of the active language pair, with search and sorting.
// "Mistakes" is also a filter: it shows only the words answered wrong at least once,
// the most mistaken first, each with its wrong / right counters.

import { Stack, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { memo, useDeferredValue, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HeaderButton } from '@/components/HeaderButton';
import { LanguagePairChip } from '@/components/LanguagePairChip';
import { Pill } from '@/components/Pill';
import { MasteryMeter } from '@/components/MasteryMeter';
import { ListScreen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { MASTERED_BOX, reviewBox } from '@/domain/review';
import { normalizeText } from '@/domain/text';
import { meaningsToText, type Word } from '@/domain/word';
import { useT } from '@/i18n';
import { useActivePair } from '@/store/settingsStore';
import { useWordsOfPair } from '@/store/wordStore';
import { iconSize, radius, spacing, useTheme } from '@/theme';

type SortOrder = 'alphabetical' | 'recent' | 'mistakes';

// A Collator is much faster than calling localeCompare on every comparison
const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

const COMPARE: Record<SortOrder, (a: Word, b: Word) => number> = {
  alphabetical: (a, b) => collator.compare(a.term, b.term),
  recent: (a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0),
  mistakes: (a, b) => b.stats.wrong - a.stats.wrong || collator.compare(a.term, b.term),
};

/** Words answered wrong at least once (the only ones shown in "Mistakes"). */
function hasMistakes(word: Word): boolean {
  return word.stats.wrong > 0;
}

function matchesSearch(word: Word, query: string): boolean {
  return (
    normalizeText(word.term).includes(query) ||
    word.meanings.some((meaning) => normalizeText(meaning.text).includes(query)) ||
    word.tags.some((tag) => normalizeText(tag).includes(query))
  );
}

function openNewWord() {
  router.push('/words/new');
}

function openWord(id: string) {
  router.push({ pathname: '/words/[id]', params: { id } });
}

/** Memoized: re-sorting moves rows around without re-rendering each of them. */
type WordRowProps = { word: Word; errorsLabel?: string; correctLabel?: string; masteryLabel: string };

const MASTERY_SPARKLE = { ios: 'sparkle', android: 'auto_awesome', web: 'auto_awesome' } as const;

const WordRow = memo(function WordRow({ word, errorsLabel, correctLabel, masteryLabel }: WordRowProps) {
  const { colors } = useTheme();
  const box = reviewBox(word);
  const mastered = box === MASTERED_BOX;

  return (
    <Card
      onPress={() => openWord(word.id)}
      accessibilityRole="button"
      style={mastered ? [styles.masteredCard, { borderColor: colors.gold }] : undefined}>
      <View style={styles.row}>
        <AppText variant="bodyBold" style={styles.term}>
          {word.term}
        </AppText>
        {errorsLabel ? <Pill label={errorsLabel} tone="warning" /> : null}
        {correctLabel ? <Pill label={correctLabel} /> : null}

        <View style={styles.mastery}>
          <MasteryMeter box={box} accessibilityLabel={masteryLabel} />
          {mastered ? (
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.masteryBadge, { backgroundColor: colors.goldSoft }]}>
              <SymbolView name={MASTERY_SPARKLE} size={spacing.sm} tintColor={colors.gold} />
              <SymbolView
                name={{ ios: 'star.fill', android: 'star_rate', web: 'star_rate' }}
                size={iconSize.md}
                tintColor={colors.gold}
              />
              <SymbolView name={MASTERY_SPARKLE} size={iconSize.sm / 2} tintColor={colors.gold} />
            </View>
          ) : null}
        </View>
      </View>
      <AppText color="textMuted" numberOfLines={2}>
        {meaningsToText(word)}
      </AppText>
    </Card>
  );
});

export default function WordsScreen() {
  const t = useT();
  const pair = useActivePair();
  const words = useWordsOfPair(pair);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('alphabetical');

  // Deferred: the tapped control updates at once, the list follows right after
  const deferredSearch = useDeferredValue(search);
  const deferredSortOrder = useDeferredValue(sortOrder);

  const visibleWords = useMemo(() => {
    const query = normalizeText(deferredSearch);
    return words
      .filter((word) => deferredSortOrder !== 'mistakes' || hasMistakes(word))
      .filter((word) => !query || matchesSearch(word, query))
      .sort(COMPARE[deferredSortOrder]);
  }, [words, deferredSearch, deferredSortOrder]);

  const showingMistakes = sortOrder === 'mistakes';
  const mistakenCount = words.filter(hasMistakes).length;

  const sortOptions: { value: SortOrder; label: string }[] = [
    { value: 'alphabetical', label: t.words.sortAlphabetical },
    { value: 'recent', label: t.words.sortRecent },
    { value: 'mistakes', label: t.words.sortMistakes },
  ];

  // An element (not a component), so the search field keeps focus while typing
  const header = (
    <View style={styles.header}>
      <View style={styles.toolbar}>
        <LanguagePairChip pair={pair} onPress={() => router.push('/languages')} />
        <Pill
          label={showingMistakes ? t.words.mistakenWords(mistakenCount) : t.common.words(words.length)}
          tone={showingMistakes ? 'warning' : 'primary'}
        />
      </View>

      {words.length === 0 ? (
        <Card>
          <AppText color="textMuted">{t.words.empty}</AppText>
          <Button label={t.words.add} onPress={openNewWord} />
        </Card>
      ) : (
        <>
          <TextField
            value={search}
            onChangeText={setSearch}
            placeholder={t.words.searchPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          <SegmentedControl options={sortOptions} value={sortOrder} onChange={setSortOrder} />
          {visibleWords.length === 0 ? (
            <AppText color="textMuted">{showingMistakes && mistakenCount === 0 ? t.words.noMistakes : t.words.noResults}</AppText>
          ) : null}
        </>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: t.words.title,
          headerRight: () => <HeaderButton label="+" onPress={openNewWord} accessibilityLabel={t.words.add} />,
        }}
      />

      <ListScreen
        tab="/words"
        data={visibleWords}
        keyExtractor={(word) => word.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <WordRow
            word={item}
            errorsLabel={item.stats.wrong > 0 ? t.words.errorsCount(item.stats.wrong) : undefined}
            correctLabel={showingMistakes ? t.words.correctCount(item.stats.correct) : undefined}
            masteryLabel={t.words.mastery(reviewBox(item), MASTERED_BOX)}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({

  masteredCard: {
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  mastery: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  masteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.pill,
  },

  header: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  term: {
    flex: 1,
  },
});
