import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { HeaderButton } from '@/components/HeaderButton';
import { isMastered } from '@/domain/review';
import { meaningsToText } from '@/domain/word';
import { useT } from '@/i18n';
import { useActivePair } from '@/store/settingsStore';
import { useWordsOfPair } from '@/store/wordStore';
import { iconSize, radius, spacing, useTheme } from '@/theme';

const STAR = { ios: 'star.fill', android: 'star_rate', web: 'star_rate' } as const;

export default function LearnedWordsSheet() {
  const t = useT();
  const { colors } = useTheme();
  const pair = useActivePair();
  const words = useWordsOfPair(pair);
  const learnedWords = useMemo(() => {
    const collator = new Intl.Collator(pair.source, { sensitivity: 'base' });
    return words.filter(isMastered).sort((a, b) => collator.compare(a.term, b.term));
  }, [pair.source, words]);

  return (
    <FlatList
      data={learnedWords}
      keyExtractor={(word) => word.id}
      style={[styles.list, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      nestedScrollEnabled
      stickyHeaderIndices={[0]}
      ListHeaderComponent={
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <AppText variant="title" accessibilityRole="header" style={styles.word}>
            {t.home.learnedTitle}
          </AppText>
          <HeaderButton label={t.medalSheet.close} onPress={() => router.back()} />
        </View>
      }
      ListEmptyComponent={
        <Card>
          <AppText color="textMuted">{t.home.learnedEmpty}</AppText>
        </Card>
      }
      renderItem={({ item }) => (
        <Card style={styles.row}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.badge, { backgroundColor: colors.goldSoft }]}>
            <SymbolView name={STAR} size={iconSize.sm} tintColor={colors.gold} />
          </View>
          <View style={styles.word}>
            <AppText variant="bodyBold">{item.term}</AppText>
            <AppText variant="small" color="textMuted">{meaningsToText(item)}</AppText>
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  badge: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: { flex: 1 },
});