// Sheet opened by "Filter": categories and kinds of word. Used by Train (filters of the
// exercises, saved in settingsStore) and by the Dictionary (filters of the list, target=words).
// Several of each can be chosen; "All" = no filter. Choices apply at once; the counters say
// how many words each choice gives with the others as they are.
// Params: mode=due|all|mistakes (Train: the counters follow the chosen mode), target=words.

import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ChoiceChips } from '@/components/ChoiceChips';
import { Section } from '@/components/Section';
import { PARTS_OF_SPEECH, type PartOfSpeech } from '@/domain/partOfSpeech';
import { QUIZ_MODES, quizPool, type QuizMode } from '@/domain/quiz';
import { TOPIC_ICONS, TOPIC_IDS, type TopicId } from '@/domain/topics';
import { useT } from '@/i18n';
import { useActivePair, useSettingsStore } from '@/store/settingsStore';
import { useWordFilterStore } from '@/store/wordFilterStore';
import { useWordsOfPair } from '@/store/wordStore';
import { spacing, useTheme } from '@/theme';

export default function QuizFiltersSheet() {
  const t = useT();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ mode?: string; target?: string }>();
  const forWords = params.target === 'words';
  const mode: QuizMode = QUIZ_MODES.includes(params.mode as QuizMode) ? (params.mode as QuizMode) : 'all';
  const words = useWordsOfPair(useActivePair());
  const quiz = useSettingsStore();
  const list = useWordFilterStore();
  const topics = forWords ? list.topics : quiz.quizTopics;
  const kinds = forWords ? list.kinds : quiz.quizPartsOfSpeech;
  const setTopics = forWords ? list.setTopics : quiz.setQuizTopics;
  const setKinds = forWords ? list.setKinds : quiz.setQuizPartsOfSpeech;

  const available = quizPool(words, { mode, topics, partsOfSpeech: kinds }).length;
  const topicCount = (topic: TopicId) => quizPool(words, { mode, topics: [topic], partsOfSpeech: kinds }).length;
  const kindCount = (kind: PartOfSpeech) => quizPool(words, { mode, topics, partsOfSpeech: [kind] }).length;
  const active = topics.length + kinds.length;

  const reset = () => {
    setTopics([]);
    setKinds([]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">
          {t.filters.title}
        </AppText>
        <AppText color="textMuted">{available === 0 ? t.train.noWords : t.train.available(available)}</AppText>
      </View>

      <Section title={t.filters.topics} hint={t.filters.topicsHint}>
        <ChoiceChips
          options={TOPIC_IDS.map((topic) => ({
            value: topic,
            label: t.topicsShort[topic],
            icon: TOPIC_ICONS[topic],
            count: topicCount(topic),
          }))}
          value={topics}
          onChange={setTopics}
          allLabel={t.train.allTopics}
          accessibilityLabelFor={(option) => t.train.filterAccessibility(t.topics[option.value], option.count ?? 0)}
        />
      </Section>

      <Section title={t.filters.kinds}>
        <ChoiceChips
          options={PARTS_OF_SPEECH.map((kind) => ({ value: kind, label: t.partsOfSpeechPlural[kind], count: kindCount(kind) }))}
          value={kinds}
          onChange={setKinds}
          allLabel={t.train.allKinds}
          accessibilityLabelFor={(option) => t.train.filterAccessibility(option.label, option.count ?? 0)}
        />
      </Section>

      <View style={styles.actions}>
        <Button label={t.filters.done} onPress={() => router.back()} />
        {active > 0 ? <Button label={t.filters.reset} tone="secondary" onPress={reset} /> : null}
      </View>
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
  actions: {
    gap: spacing.md,
  },
});
