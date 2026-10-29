// A quiz session. Options arrive as route params, so Home can open
// the mistakes review directly. Every answer updates the word stats.

import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DictionaryLinks } from '@/components/DictionaryLinks';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { TextField, type TextFieldRef } from '@/components/TextField';
import { buildQuiz, type QuizDirection, type QuizMode, type QuizOptions, type QuizQuestion } from '@/domain/quiz';
import { isAnswerAccepted } from '@/domain/text';
import { meaningsToText } from '@/domain/word';
import { useT } from '@/i18n';
import { useActivePair } from '@/store/settingsStore';
import { useWordStore, useWordsOfPair } from '@/store/wordStore';
import { spacing } from '@/theme';

type QuizParams = { direction?: string; mode?: string; count?: string };

type Mistake = { question: QuizQuestion; given: string };

function optionsFromParams(params: QuizParams): QuizOptions {
  return {
    direction: (params.direction === 'backward' ? 'backward' : 'forward') satisfies QuizDirection,
    mode: (params.mode === 'mistakes' ? 'mistakes' : 'all') satisfies QuizMode,
    count: Number(params.count) || 0,
  };
}

export default function QuizScreen() {
  const t = useT();
  const options = optionsFromParams(useLocalSearchParams<QuizParams>());
  const pair = useActivePair();
  const words = useWordsOfPair(pair);
  const recordAnswer = useWordStore((state) => state.recordAnswer);
  const inputRef = useRef<TextFieldRef>(null);

  // The questions are chosen once per round, so stats updates don't reshuffle them
  const [questions, setQuestions] = useState(() => buildQuiz(words, options));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);

  const question = questions[index];
  const finished = index >= questions.length;
  const isLast = index === questions.length - 1;

  const submit = (given: string) => {
    const correct = isAnswerAccepted(given, question.accepted);
    recordAnswer(question.word.id, correct);
    setResult(correct ? 'correct' : 'wrong');
    if (!correct) {
      setMistakes((current) => [...current, { question, given }]);
    }
  };

  const check = () => {
    if (answer.trim()) {
      submit(answer);
    }
  };

  const next = () => {
    setIndex(index + 1);
    setAnswer('');
    setResult(null);
    inputRef.current?.focus();
  };

  const restart = () => {
    setQuestions(buildQuiz(words, options));
    setIndex(0);
    setAnswer('');
    setResult(null);
    setMistakes([]);
  };

  if (questions.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: t.train.title, headerLargeTitle: false }} />

        <Screen>
          <Card>
            <AppText color="textMuted">{t.train.noWords}</AppText>
          </Card>
          <Button label={t.quiz.done} tone="secondary" onPress={() => router.back()} />
        </Screen>
      </>
    );
  }

  if (finished) {
    const correctCount = questions.length - mistakes.length;

    return (
      <>
        <Stack.Screen options={{ title: t.quiz.resultTitle, headerLargeTitle: false }} />

        <Screen>
          <Card tone="primary">
            <AppText variant="hero">
              {correctCount} / {questions.length}
            </AppText>
            <AppText color="textMuted">{t.quiz.score(correctCount, questions.length)}</AppText>
          </Card>

          <Section title={t.quiz.mistakes}>
            {mistakes.length === 0 ? (
              <Card>
                <AppText>{t.quiz.perfect}</AppText>
              </Card>
            ) : (
              mistakes.map(({ question: wrong, given }) => (
                <Card key={wrong.word.id}>
                  <AppText variant="bodyBold">
                    {wrong.prompt} → {wrong.correctText}
                  </AppText>
                  <AppText variant="small" color="textMuted">
                    {t.quiz.yourAnswer} {given || '–'}
                  </AppText>
                </Card>
              ))
            )}
          </Section>

          <Button label={t.quiz.again} onPress={restart} />
          <Button label={t.quiz.done} tone="secondary" onPress={() => router.back()} />
        </Screen>
      </>
    );
  }

  const examples = question.word.meanings.flatMap((meaning) => meaning.examples).slice(0, 3);

  return (
    <>
      <Stack.Screen options={{ title: t.quiz.progress(index + 1, questions.length), headerLargeTitle: false }} />

      <Screen>
        <Card style={styles.questionCard}>
          <AppText variant="hero" style={styles.centered}>
            {question.prompt}
          </AppText>
          {question.note ? (
            <AppText color="textMuted" style={styles.centered}>
              ({question.note})
            </AppText>
          ) : null}
        </Card>

        <TextField
          ref={inputRef}
          value={answer}
          onChangeText={setAnswer}
          placeholder={t.quiz.answerPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType={result === null ? 'done' : 'next'}
          submitBehavior="submit"
          onSubmitEditing={result === null ? check : next}
        />

        {result ? (
          <Card tone={result === 'correct' ? 'primary' : 'default'}>
            <Pill label={result === 'correct' ? t.quiz.correct : t.quiz.wrong} tone={result === 'correct' ? 'primary' : 'warning'} />
            {result === 'wrong' ? (
              <AppText>
                {t.quiz.correctAnswer} <AppText variant="bodyBold">{question.correctText}</AppText>
              </AppText>
            ) : null}
            <AppText color="textMuted">
              {question.word.term} → {meaningsToText(question.word)}
            </AppText>
          </Card>
        ) : null}

        {result && examples.length > 0 ? (
          <Section title={t.quiz.examples}>
            <Card>
              {examples.map((example) => (
                <AppText key={example}>• {example}</AppText>
              ))}
            </Card>
          </Section>
        ) : null}

        {result ? <DictionaryLinks pair={pair} term={question.word.term} /> : null}

        <View style={styles.actions}>
          {result === null ? (
            <>
              <Button label={t.quiz.check} onPress={check} disabled={!answer.trim()} />
              <Button label={t.quiz.skip} tone="secondary" onPress={() => submit('')} />
            </>
          ) : (
            <Button label={isLast ? t.quiz.finish : t.quiz.next} onPress={next} />
          )}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    textAlign: 'center',
  },
  questionCard: {
    paddingVertical: spacing.xl,
  },
  actions: {
    gap: spacing.md,
  },
});
