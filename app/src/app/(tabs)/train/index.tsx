// Quiz setup: direction, which words (to learn / all / mistakes), number of questions
// (10, 20, all or a custom number; the last choice is remembered).

import { Stack, router } from 'expo-router';
import { useState } from 'react';

import { AppText } from '@/components/AppText';
import { Appear } from '@/components/Appear';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { NumberStepper } from '@/components/NumberStepper';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { LANGUAGES } from '@/domain/languages';
import { QUIZ_COUNTS, QUIZ_CUSTOM_MAX, QUIZ_CUSTOM_MIN, quizPool, type QuizDirection, type QuizMode } from '@/domain/quiz';
import { useT } from '@/i18n';
import { useActivePair, useSettingsStore, type QuizCountChoice } from '@/store/settingsStore';
import { useWordsOfPair } from '@/store/wordStore';

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

  const availableCount = quizPool(words, { mode }).length;
  const source = LANGUAGES[pair.source].flag;
  const target = LANGUAGES[pair.target].flag;

  const modeHints: Record<QuizMode, string> = {
    due: t.train.modeDueHint,
    all: t.train.modeAllHint,
    mistakes: t.train.modeMistakesHint,
  };

  const start = () => router.push({ pathname: '/train/quiz', params: { direction, mode, count } });

  return (
    <>
      <Stack.Screen options={{ title: t.train.title }} />

      <Screen tab="/train">
        <Section title={t.train.direction}>
          <SegmentedControl
            options={[
              { value: 'forward', label: `${source} → ${target}` },
              { value: 'backward', label: `${target} → ${source}` },
            ]}
            value={direction}
            onChange={setDirection}
          />
        </Section>

        <Section title={t.train.mode} hint={modeHints[mode]}>
          <SegmentedControl
            options={[
              { value: 'due', label: t.train.modeDue },
              { value: 'all', label: t.train.modeAll },
              { value: 'mistakes', label: t.train.modeMistakes },
            ]}
            value={mode}
            onChange={setMode}
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
      </Screen>
    </>
  );
}
