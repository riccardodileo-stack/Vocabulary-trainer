// Quiz setup: direction, which words (to learn / all / mistakes) with the "Filter" button
// under them (topics and kinds of word, in a sheet: app/quiz-filters.tsx), number of
// questions (10, 20, all or a custom number). Filters and number are remembered.

import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Appear } from '@/components/Appear';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ExerciseCard } from '@/components/ExerciseCard';
import { FilterSummary } from '@/components/FilterSummary';
import { NumberStepper } from '@/components/NumberStepper';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { LANGUAGES } from '@/domain/languages';
import { QUIZ_COUNTS, QUIZ_CUSTOM_MAX, QUIZ_CUSTOM_MIN, quizPool, type QuizDirection, type QuizMode } from '@/domain/quiz';
import { TOPIC_ICONS } from '@/domain/topics';
import { useT } from '@/i18n';
import { useActivePair, useSettingsStore, type QuizCountChoice } from '@/store/settingsStore';
import { useWordsOfPair } from '@/store/wordStore';
import { spacing } from '@/theme';

export default function TrainScreen() {
  const t = useT();
  const pair = useActivePair();
  const words = useWordsOfPair(pair);
  const [direction, setDirection] = useState<QuizDirection>('forward');
  // Start on the review when there is something to review
  const [mode, setMode] = useState<QuizMode>(() => (quizPool(words, { mode: 'due' }).length > 0 ? 'due' : 'all'));
  const countChoice = useSettingsStore((state) => state.quizCountChoice);
  const customCount = useSettingsStore((state) => state.quizCustomCount);
  const setCountChoice = useSettingsStore((state) => state.setQuizCountChoice);
  const setCustomCount = useSettingsStore((state) => state.setQuizCustomCount);
  const count = countChoice === 'custom' ? String(customCount) : countChoice;
  const topics = useSettingsStore((state) => state.quizTopics);
  const kinds = useSettingsStore((state) => state.quizPartsOfSpeech);
  const setTopics = useSettingsStore((state) => state.setQuizTopics);
  const setKinds = useSettingsStore((state) => state.setQuizPartsOfSpeech);

  const availableCount = quizPool(words, { mode, topics, partsOfSpeech: kinds }).length;
  const openFilters = () => router.push({ pathname: '/quiz-filters', params: { mode } });
  const source = LANGUAGES[pair.source].flag;
  const target = LANGUAGES[pair.target].flag;

  const modeHints: Record<QuizMode, string> = {
    due: t.train.modeDueHint,
    all: t.train.modeAllHint,
    mistakes: t.train.modeMistakesHint,
  };

  const exerciseParams = { direction, mode, count, topics: topics.join(','), kinds: kinds.join(',') };
  const start = () => router.push({ pathname: '/quiz', params: exerciseParams });
  /** The other exercises use the same choices made above (words, filters, number of questions). */
  const startChoice = (kind: 'choice' | 'listen') =>
    router.push({ pathname: '/choice', params: { ...exerciseParams, kind } });

  return (
    <>
      <Stack.Screen options={{ title: t.train.title }} />

      <Screen tab="/train">
      
        <SegmentedControl
          options={[
            { value: 'forward', label: `${source} → ${target}` },
            { value: 'backward', label: `${target} → ${source}` },
          ]}
          value={direction}
          onChange={setDirection}
        />

        <Section title={t.train.mode}>
          <SegmentedControl
            options={[
              { value: 'due', label: t.train.modeDue },
              { value: 'all', label: t.train.modeAll },
              { value: 'mistakes', label: t.train.modeMistakes },
            ]}
            value={mode}
            onChange={setMode}
          />
          {/* The hint right under the choice it explains (Section would put it at the end) */}
          <Appear key={mode}>
            <AppText variant="small" color="textMuted" style={styles.hint}>
              {modeHints[mode]}
            </AppText>
          </Appear>
          {/* Under the three choices: the filter button and the active filters, removable one by one */}
          <FilterSummary
            label={t.filters.button}
            accessibilityLabel={t.filters.buttonAccessibility(topics.length + kinds.length)}
            chips={[
              ...topics.map((topic) => ({
                key: topic,
                label: `${TOPIC_ICONS[topic]} ${t.topicsShort[topic]}`,
                onRemove: () => setTopics(topics.filter((other) => other !== topic)),
              })),
              ...kinds.map((kind) => ({
                key: kind,
                label: t.partsOfSpeechPlural[kind],
                onRemove: () => setKinds(kinds.filter((other) => other !== kind)),
              })),
            ]}
            removeLabel={t.filters.remove}
            onOpen={openFilters}
          />
        </Section>

        <Section title={t.train.count}>
          <SegmentedControl<QuizCountChoice>
            options={[
              ...QUIZ_COUNTS.map((value) => ({
                value: String(value) as QuizCountChoice,
                label: value === 0 ? t.train.countAll : String(value),
              })),
              { value: 'custom', label: t.train.countCustom },
            ]}
            value={countChoice}
            onChange={setCountChoice}
          />
          {countChoice === 'custom' ? (
            <Appear from="down">
              <NumberStepper
                value={customCount}
                onChange={setCustomCount}
                min={QUIZ_CUSTOM_MIN}
                max={QUIZ_CUSTOM_MAX}
                accessibilityLabel={t.train.count}
                decreaseLabel={t.train.countLess}
                increaseLabel={t.train.countMore}
              />
            </Appear>
          ) : null}
        </Section>

        <Card>
          <AppText color="textMuted">
            {availableCount === 0 ? t.train.noWords : t.train.available(availableCount)}
          </AppText>
          <Button label={t.train.start} onPress={start} disabled={availableCount === 0} />
        </Card>

        {/* A section of its own for the exercises that aren't the written quiz */}
        <Section title={t.exercises.title} hint={t.exercises.hint}>
          <ExerciseCard
            icon="🔤"
            title={t.exercises.choiceTitle}
            description={t.exercises.choiceDescription}
            onPress={() => startChoice('choice')}
            disabled={availableCount === 0}
          />
          <ExerciseCard
            icon="🎧"
            title={t.exercises.listenTitle}
            description={t.exercises.listenDescription}
            onPress={() => startChoice('listen')}
            disabled={availableCount === 0}
          />
        </Section>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginLeft: spacing.xs,
  },
});
