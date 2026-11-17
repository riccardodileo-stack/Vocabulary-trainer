// Quiz setup: direction, which words (to learn / all / mistakes) with the "Filter" button
// under them (topics and kinds of word, in a sheet: app/quiz-filters.tsx), number of
// questions (10, 20, all or a custom number). Filters and number are remembered.

import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Appear } from '@/components/Appear';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FilterButton } from '@/components/FilterButton';
import { NumberStepper } from '@/components/NumberStepper';
import { QuizBlockList } from '@/components/QuizBlockList';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { LANGUAGES } from '@/domain/languages';
import { QUIZ_COUNTS, QUIZ_CUSTOM_MAX, QUIZ_CUSTOM_MIN, QUIZ_MODES, quizPool, type QuizDirection, type QuizMode } from '@/domain/quiz';
import { TOPIC_ICONS } from '@/domain/topics';
import { useT } from '@/i18n';
import { useActivePair, useSettingsStore, type QuizCountChoice } from '@/store/settingsStore';
import { useWordsOfPair } from '@/store/wordStore';
import { radius, spacing, useTheme } from '@/theme';

type TrainMode = QuizMode | 'blocks';
const TRAIN_MODES: TrainMode[] = [...QUIZ_MODES, 'blocks'];

export default function TrainScreen() {
  const t = useT();
  const { colors } = useTheme();
  const pair = useActivePair();
  const words = useWordsOfPair(pair);
  const [direction, setDirection] = useState<QuizDirection>('forward');
  // Start on the review when there is something to review
  const [selectedMode, setSelectedMode] = useState<TrainMode>(() => (quizPool(words, { mode: 'due' }).length > 0 ? 'due' : 'all'));
  const showingBlocks = selectedMode === 'blocks';
  const mode = selectedMode === 'blocks' ? 'all' : selectedMode;
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
  const activeFilters = topics.length + kinds.length;
  // "💻 Informatica · 🍝 Cibo · Verbi": what the filters keep, shown under the choice
  const filterSummary = [
    ...topics.map((topic) => `${TOPIC_ICONS[topic]} ${t.topicsShort[topic]}`),
    ...kinds.map((kind) => t.partsOfSpeechPlural[kind]),
  ].join(' · ');
  const openFilters = () => router.push({ pathname: '/quiz-filters', params: { mode } });
  const source = LANGUAGES[pair.source].flag;
  const target = LANGUAGES[pair.target].flag;

  const modeHints: Record<TrainMode, string> = {
    due: t.train.modeDueHint,
    all: t.train.modeAllHint,
    mistakes: t.train.modeMistakesHint,
    blocks: t.train.modeBlocksHint,
  };

  const start = () =>
    router.push({
      pathname: '/quiz',
      params: { direction, mode, count, topics: topics.join(','), kinds: kinds.join(',') },
    });

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
          <SegmentedControl<TrainMode>
            options={[
              { value: 'due', label: t.train.modeDue },
              { value: 'all', label: t.train.modeAll },
              { value: 'mistakes', label: t.train.modeMistakes },
              { value: 'blocks', label: t.train.modeBlocks },
            ]}
            value={selectedMode}
            onChange={setSelectedMode}
          />
          <View style={styles.mascotRow}>
            <View style={[styles.speechBubble, { backgroundColor: colors.cardMuted }]}>
              <View
                pointerEvents="none"
                style={[styles.speechTail, { backgroundColor: colors.cardMuted }]}
              />

              <View style={styles.speechMessages}>
                {/* The overlapping messages reserve the height of the tallest one. */}
                {TRAIN_MODES.map((option, index) => {
                  const selected = option === selectedMode;

                  return (
                    <View
                      key={option}
                      aria-hidden={!selected}
                      style={[
                        styles.speechMessage,
                        index > 0 && styles.speechMessageOverlap,
                        { opacity: selected ? 1 : 0 },
                      ]}>
                      <Appear key={selected ? 'shown' : 'hidden'} exit={false}>
                        <AppText>{modeHints[option]}</AppText>
                      </Appear>
                    </View>
                  );
                })}
              </View>
            </View>
            <Image
              source={require('../../../../assets/mascot/goricheco-sleeping.png')}
              contentFit="contain"
              style={styles.mascot}
              accessible={false}
            />
          </View>
          {/* Under the three choices: the filters and, when some are on, what they keep */}
          {showingBlocks ? (
            <QuizBlockList words={words} direction={direction} />
          ) : (
          <View style={styles.filterRow}>
            <FilterButton
              label={t.filters.button}
              active={activeFilters}
              onPress={openFilters}
              accessibilityLabel={t.filters.buttonAccessibility(activeFilters)}
            />
            {activeFilters > 0 ? (
              <Appear style={styles.summary}>
                <AppText variant="small" color="primaryStrong" style={styles.flex} numberOfLines={2}>
                  {filterSummary}
                </AppText>
                <Button
                  label={t.filters.reset}
                  tone="secondary"
                  size="sm"
                  onPress={() => {
                    setTopics([]);
                    setKinds([]);
                  }}
                />
              </Appear>
            ) : null}
          </View>
          )}
        </Section>

        {!showingBlocks ? (
          <>
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
          </>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  speechBubble: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  speechMessages: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speechMessage: {
    width: '100%',
    flexShrink: 0,
  },
  speechMessageOverlap: {
    marginStart: '-100%',
  },
  speechTail: {
    position: 'absolute',
    top: '50%',
    right: -spacing.xs,
    marginTop: -spacing.sm,
    width: spacing.lg,
    height: spacing.lg,
    transform: [{ rotate: '45deg' }],
  },
  mascot: {
    width: '40%',
    maxWidth: spacing.xxl * 4.5,
    aspectRatio: 3 / 2,
    flexShrink: 0,
    marginLeft: -spacing.xl,
    marginRight: -spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  summary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
