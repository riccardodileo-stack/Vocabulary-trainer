// Quiz setup: direction, all words or mistakes only, number of questions.

import { Stack, router } from 'expo-router';
import { useState } from 'react';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { LANGUAGES } from '@/domain/languages';
import { isMistake, QUIZ_COUNTS, type QuizDirection, type QuizMode } from '@/domain/quiz';
import { useT } from '@/i18n';
import { useActivePair } from '@/store/settingsStore';
import { useWordsOfPair } from '@/store/wordStore';

export default function TrainScreen() {
  const t = useT();
  const pair = useActivePair();
  const words = useWordsOfPair(pair);
  const [direction, setDirection] = useState<QuizDirection>('forward');
  const [mode, setMode] = useState<QuizMode>('all');
  const [count, setCount] = useState<string>(String(QUIZ_COUNTS[0]));

  const availableCount = mode === 'mistakes' ? words.filter(isMistake).length : words.length;
  const source = LANGUAGES[pair.source].flag;
  const target = LANGUAGES[pair.target].flag;

  const start = () =>
    router.push({ pathname: '/train/quiz', params: { direction, mode, count } });

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

        <Section title={t.train.mode}>
          <SegmentedControl
            options={[
              { value: 'all', label: t.train.modeAll },
              { value: 'mistakes', label: t.train.modeMistakes },
            ]}
            value={mode}
            onChange={setMode}
          />
        </Section>

        <Section title={t.train.count}>
          <SegmentedControl
            options={QUIZ_COUNTS.map((value) => ({
              value: String(value),
              label: value === 0 ? t.train.countAll : String(value),
            }))}
            value={count}
            onChange={setCount}
          />
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
