// A quiz session. Options arrive as route params, so Home can open the review,
// the mistakes or the new words directly. Every answer updates the word stats.
//
// Params: direction=forward|backward, mode=due|all|mistakes, count=number (0 = all),
//         ids=comma separated word ids (optional, limits the quiz to those words)

import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DictionaryLinks } from '@/components/DictionaryLinks';
import { HeaderButton } from '@/components/HeaderButton';
import { Pill } from '@/components/Pill';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { TextField, type TextFieldRef } from '@/components/TextField';
import { buildQuiz, QUIZ_MODES, type QuizMode, type QuizOptions, type QuizQuestion } from '@/domain/quiz';
import { evaluateAnswer, type AnswerVerdict } from '@/domain/text';
import { meaningsToText } from '@/domain/word';
import { useT } from '@/i18n';
import { useActivePair } from '@/store/settingsStore';
import { useWordStore, useWordsOfPair } from '@/store/wordStore';
import { spacing } from '@/theme';

type QuizParams = { direction?: string; mode?: string; count?: string; ids?: string };

type Mistake = { question: QuizQuestion; given: string };

function optionsFromParams(params: QuizParams): QuizOptions {
  const ids = params.ids?.split(',').filter(Boolean);
  return {
    direction: params.direction === 'backward' ? 'backward' : 'forward',
    mode: QUIZ_MODES.includes(params.mode as QuizMode) ? (params.mode as QuizMode) : 'all',
    count: Number(params.count) || 0,
    wordIds: ids && ids.length > 0 ? ids : undefined,
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
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);

  const question = questions[index];
  const finished = index >= questions.length;
  const isLast = index === questions.length - 1;
  const answeredCount = index + (verdict ? 1 : 0);

  const submit = (given: string) => {
    const result = given.trim() ? evaluateAnswer(given, question.accepted, question.answerLanguage) : 'wrong';
    recordAnswer(question.word.id, result !== 'wrong');
    setVerdict(result);
    if (result === 'wrong') {
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
    setVerdict(null);
    inputRef.current?.focus();
  };

  const startRound = (roundOptions: QuizOptions) => {
    setQuestions(buildQuiz(words, roundOptions));
    setIndex(0);
    setAnswer('');
    setVerdict(null);
    setMistakes([]);
  };

  /** Ends now: the results count only the questions already answered. */
  const endEarly = () => {
    if (answeredCount === 0) {
      router.back();
      return;
    }
    setQuestions(questions.slice(0, answeredCount));
    setIndex(answeredCount);
    setVerdict(null);
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
    const mistakeIds = mistakes.map(({ question: wrong }) => wrong.word.id);

    return (
      <>
        <Stack.Screen options={{ title: t.quiz.resultTitle, headerLargeTitle: false, headerRight: () => null }} />

        <Screen>
          <Card tone="primary" style={styles.centeredCard}>
            <AppText variant="display">
              {correctCount} / {questions.length}
            </AppText>
            <AppText color="textMuted">{t.quiz.score(correctCount, questions.length)}</AppText>
            <View style={styles.fullWidth}>
              <ProgressBar progress={correctCount / questions.length} />
            </View>
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
                    {t.quiz.yourAnswer} {given.trim() || '–'}
                  </AppText>
                </Card>
              ))
            )}
          </Section>

          {mistakes.length > 0 ? (
            <Button
              label={t.quiz.retryMistakes}
              onPress={() => startRound({ ...options, mode: 'all', count: 0, wordIds: mistakeIds })}
            />
          ) : null}
          <Button
            label={t.quiz.again}
            tone={mistakes.length > 0 ? 'secondary' : 'primary'}
            onPress={() => startRound(options)}
          />
          <Button label={t.quiz.done} tone="secondary" onPress={() => router.back()} />
        </Screen>
      </>
    );
  }

  const examples = question.word.meanings.flatMap((meaning) => meaning.examples).slice(0, 3);

  return (
    <>
      <Stack.Screen
        options={{
          title: t.quiz.progress(index + 1, questions.length),
          headerLargeTitle: false,
          headerRight: () => <HeaderButton label={t.quiz.end} onPress={endEarly} />,
        }}
      />

      <Screen>
        <ProgressBar
          progress={answeredCount / questions.length}
          accessibilityLabel={t.quiz.progressAccessibility(index + 1, questions.length)}
        />

        <Card style={styles.questionCard}>
          <AppText variant="hero" style={styles.centered} accessibilityRole="header">
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
          accessibilityLabel={t.quiz.answerPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType={verdict === null ? 'done' : 'next'}
          submitBehavior="submit"
          onSubmitEditing={verdict === null ? check : next}
        />

        {verdict ? (
          <Card tone={verdict === 'wrong' ? 'default' : 'primary'} accessibilityLiveRegion="polite">
            <Pill
              label={{ correct: t.quiz.correct, almost: t.quiz.almost, wrong: t.quiz.wrong }[verdict]}
              tone={verdict === 'wrong' ? 'warning' : 'primary'}
            />
            {verdict === 'wrong' ? (
              <AppText>
                {t.quiz.correctAnswer} <AppText variant="bodyBold">{question.correctText}</AppText>
              </AppText>
            ) : null}
            {verdict === 'almost' ? (
              <AppText>
                {t.quiz.almostHint} <AppText variant="bodyBold">{question.correctText}</AppText>
              </AppText>
            ) : null}
            <AppText color="textMuted">
              {question.word.term} → {meaningsToText(question.word)}
            </AppText>
          </Card>
        ) : null}

        {verdict && examples.length > 0 ? (
          <Section title={t.quiz.examples}>
            <Card>
              {examples.map((example) => (
                <AppText key={example}>• {example}</AppText>
              ))}
            </Card>
          </Section>
        ) : null}

        {verdict ? <DictionaryLinks pair={pair} term={question.word.term} /> : null}

        <View style={styles.actions}>
          {verdict === null ? (
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
  centeredCard: {
    alignItems: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  questionCard: {
    paddingVertical: spacing.xl,
  },
  actions: {
    gap: spacing.md,
  },
});
