// Sheet opened by "Categories" on the words of the day card: which categories the words of
// the day come from. Several can be chosen; "All" = every word. Saved at once (settingsStore);
// today's words change as soon as the sheet is closed. The counters say how many new words
// are left in each category at the chosen level.

import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ChoiceChips } from '@/components/ChoiceChips';
import { Section } from '@/components/Section';
import { WORD_BANK } from '@/content/wordBank';
import { remainingCount } from '@/domain/dailyWords';
import { normalizeText } from '@/domain/text';
import { TOPIC_IDS, type TopicId } from '@/domain/topics';
import { TopicIcon } from '@/components/TopicBadge';
import { useT } from '@/i18n';
import { useKnownIds } from '@/store/dailyStore';
import { useActivePair, useSettingsStore } from '@/store/settingsStore';
import { useWordsOfPair } from '@/store/wordStore';
import { spacing, useTheme } from '@/theme';

export default function DailyTopicsSheet() {
  const t = useT();
  const { colors } = useTheme();
  const pair = useActivePair();
  const level = useSettingsStore((state) => state.dailyLevel);
  const topics = useSettingsStore((state) => state.dailyTopics);
  const setTopics = useSettingsStore((state) => state.setDailyTopics);
  const knownIds = new Set(useKnownIds(pair.source));
  const vocabularyTerms = new Set(useWordsOfPair(pair).map((word) => normalizeText(word.term)));

  const count = (chosen: TopicId[]) => remainingCount(WORD_BANK, { pair, level, topics: chosen, knownIds, vocabularyTerms });

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">
          {t.daily.topicsTitle}
        </AppText>
        <AppText color="textMuted" style={styles.centered}>
          {t.daily.topicsSubtitle}
        </AppText>
      </View>

      <Section title={t.daily.categories} hint={t.daily.topicsHint}>
        <ChoiceChips
          options={TOPIC_IDS.map((topic) => ({
            value: topic,
            label: t.topicsShort[topic],
            icon: <TopicIcon topic={topic} />,
            count: count([topic]),
          }))}
          value={topics}
          onChange={setTopics}
          allLabel={t.daily.topicsAll}
          accessibilityLabelFor={(option) => t.daily.topicsAccessibility(t.topics[option.value], option.count ?? 0)}
        />
      </Section>

      <AppText variant="small" color="textMuted" style={styles.centered}>
        {t.daily.topicsChanged}
      </AppText>

      <Button label={t.filters.done} onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  heading: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  centered: {
    textAlign: 'center',
  },
});
