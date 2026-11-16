// Multiple-choice exercises: a word and four answers.
// - kind=choice: the word is shown ("Multiple choice")
// - kind=listen: the word is only heard ("Listen and choose"), always studied word -> translation
// Same params as the written quiz (direction, mode, count, topics, kinds, ids) plus `kind`.
// Like the quiz it lives in the root stack, above the tabs, so closing it goes back to Train.

import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Appear } from '@/components/Appear';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HeaderButton } from '@/components/HeaderButton';
import { Pill } from '@/components/Pill';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SpeakButton } from '@/components/SpeakButton';
import { WORD_BANK } from '@/content/wordBank';
import { buildChoiceQuiz, type ChoiceQuestion } from '@/domain/choiceQuiz';
import { quizOptionsFromParams, type QuizOptions, type QuizParams } from '@/domain/quiz';
import { TOPIC_ICONS } from '@/domain/topics';
import { meaningsToText } from '@/domain/word';
import { useT } from '@/i18n';
import { playSound, soundsForScreen } from '@/services/sounds';
import { speak } from '@/services/speech';
import { useActivityStore } from '@/store/activityStore';
import { useActivePair } from '@/store/settingsStore';
import { useWordStore, useWordsOfPair } from '@/store/wordStore';
import { radius, spacing, touchTarget, useTheme } from '@/theme';

type ChoiceParams = QuizParams & { kind?: string };

/** After a right answer the next question comes by itself; a wrong one waits for "Next". */
const AUTO_NEXT_MS = 900;

type Mistake = { question: ChoiceQuestion; given: string };

export default function ChoiceScreen() {
  const t = useT();
  const { colors } = useTheme();
  const params = useLocalSearchParams<ChoiceParams>();
  const listening = params.kind === 'listen';
  // Listening is always "hear the studied word, choose its translation"
  const options: QuizOptions = { ...quizOptionsFromParams(params), ...(listening ? { direction: 'forward' as const } : {}) };
  const pair = useActivePair();
  const words = useWordsOfPair(pair);
  const recordAnswer = useWordStore((state) => state.recordAnswer);
  const recordQuizFinished = useActivityStore((state) => state.recordQuizFinished);
  // Sounds loaded and audio session on while the screen is open
  useEffect(soundsForScreen, []);

  // With few words the wrong answers come from the built-in word list
  const answerLanguage = options.direction === 'forward' ? pair.target : pair.source;
  const build = (roundOptions: QuizOptions) =>
    buildChoiceQuiz(
      words,
      roundOptions,
      WORD_BANK.map((entry) => entry.text[answerLanguage])
    );

  const [questions, setQuestions] = useState(() => build(options));
  const [index, setIndex] = useState(0);
  /** Index of the answer tapped, or null while the question is open. */
  const [picked, setPicked] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const question = questions[index] as ChoiceQuestion | undefined;
  const finished = index >= questions.length;
  const isLast = index === questions.length - 1;
  const answeredCount = index + (picked !== null ? 1 : 0);

  // Listening: the word is read as soon as the question appears
  const promptToRead = listening && question ? question.prompt : null;
  useEffect(() => {
    if (promptToRead) {
      const wait = setTimeout(() => speak(promptToRead, pair.source), 350);
      return () => clearTimeout(wait);
    }
  }, [promptToRead, index, pair.source]);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const close = () => (router.canGoBack() ? router.back() : router.replace('/train'));

  const next = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (isLast) {
      recordQuizFinished(questions.length, mistakes.length);
      playSound('finish');
    }
    setIndex((current) => current + 1);
    setPicked(null);
  };

  const pick = (choice: number) => {
    if (!question || picked !== null) {
      return;
    }
    const correct = choice === question.correctIndex;
    setPicked(choice);
    recordAnswer(question.word.id, correct);
    playSound(correct ? 'correct' : 'wrong');
    if (correct) {
      timer.current = setTimeout(next, AUTO_NEXT_MS);
    } else {
      setMistakes((current) => [...current, { question, given: question.options[choice] }]);
    }
  };

  const startRound = (roundOptions: QuizOptions) => {
    setQuestions(build(roundOptions));
    setIndex(0);
    setPicked(null);
    setMistakes([]);
  };

  /** Ends now: the results count only the questions already answered. */
  const endEarly = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (answeredCount === 0) {
      close();
      return;
    }
    setQuestions(questions.slice(0, answeredCount));
    setIndex(answeredCount);
    setPicked(null);
  };

  const title = listening ? t.exercises.listenTitle : t.exercises.choiceTitle;

  if (questions.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <Screen>
          <Card>
            <AppText color="textMuted">{words.length === 0 ? t.train.noWords : t.exercises.tooFew}</AppText>
          </Card>
          <Button label={t.quiz.done} tone="secondary" onPress={close} />
        </Screen>
      </>
    );
  }

  if (finished || !question) {
    const correctCount = questions.length - mistakes.length;
    const mistakeIds = mistakes.map(({ question: wrong }) => wrong.word.id);

    return (
      <>
        <Stack.Screen options={{ title: t.quiz.resultTitle, headerRight: () => null }} />
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
                    {wrong.word.term} → {meaningsToText(wrong.word)}
                  </AppText>
                  <AppText variant="small" color="textMuted">
                    {t.quiz.yourAnswer} {given}
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
          <Button label={t.quiz.again} tone={mistakes.length > 0 ? 'secondary' : 'primary'} onPress={() => startRound(options)} />
          <Button label={t.quiz.done} tone="secondary" onPress={close} />
        </Screen>
      </>
    );
  }

  const answered = picked !== null;
  const wasRight = picked === question.correctIndex;

  return (
    <>
      <Stack.Screen
        options={{
          title: t.quiz.progress(index + 1, questions.length),
          headerRight: () => <HeaderButton label={t.quiz.end} onPress={endEarly} />,
        }}
      />

      <Screen>
        <ProgressBar
          progress={answeredCount / questions.length}
          accessibilityLabel={t.quiz.progressAccessibility(index + 1, questions.length)}
        />

        {question.topicHint ? (
          <Appear key={`hint-${index}`} style={styles.hintRow}>
            <Pill label={`${TOPIC_ICONS[question.topicHint]} ${t.topics[question.topicHint]}`} tone="primary" />
          </Appear>
        ) : null}

        <Appear key={index} from="right" exit={false} style={styles.question}>
          {listening ? (
            <Card style={styles.listenCard}>
              <SpeakButton text={question.prompt} language={pair.source} size="lg" />
              {/* The written word appears only after answering: before, it would give the answer away to the eye */}
              {answered ? (
                <Appear>
                  <AppText variant="title" style={styles.centered}>
                    {question.prompt}
                  </AppText>
                </Appear>
              ) : (
                <AppText color="textMuted" style={styles.centered}>
                  {t.exercises.listenHint}
                </AppText>
              )}
            </Card>
          ) : (
            <Card style={styles.promptCard}>
              {options.direction === 'forward' ? (
                <View style={styles.speak}>
                  <SpeakButton text={question.prompt} language={pair.source} />
                </View>
              ) : null}
              <AppText variant="hero" style={styles.centered} accessibilityRole="header">
                {question.prompt}
              </AppText>
            </Card>
          )}

          <View style={styles.options}>
            {question.options.map((option, choice) => {
              const isCorrect = choice === question.correctIndex;
              const isPicked = choice === picked;
              // After the answer: the right one turns green, a wrong pick red, the rest fade
              const state = !answered ? 'open' : isCorrect ? 'right' : isPicked ? 'wrong' : 'other';
              const look = {
                open: { backgroundColor: colors.card, borderColor: colors.border, text: 'text' as const },
                right: { backgroundColor: colors.primarySoft, borderColor: colors.primary, text: 'primaryStrong' as const },
                wrong: { backgroundColor: colors.dangerSoft, borderColor: colors.danger, text: 'danger' as const },
                other: { backgroundColor: colors.card, borderColor: colors.border, text: 'textMuted' as const },
              }[state];

              return (
                <Pressable
                  key={`${index}-${option}`}
                  onPress={() => pick(choice)}
                  disabled={answered}
                  accessibilityRole="button"
                  accessibilityLabel={option}
                  accessibilityState={{ selected: isPicked, disabled: answered }}
                  style={({ pressed }) => [
                    styles.option,
                    { backgroundColor: look.backgroundColor, borderColor: look.borderColor },
                    state === 'other' && styles.faded,
                    pressed && styles.pressed,
                  ]}>
                  <AppText variant="bodyBold" color={look.text} style={styles.optionText}>
                    {option}
                  </AppText>
                  {state === 'right' ? (
                    <AppText variant="bodyBold" color="primaryStrong">
                      ✓
                    </AppText>
                  ) : null}
                  {state === 'wrong' ? (
                    <AppText variant="bodyBold" color="danger">
                      ✕
                    </AppText>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Appear>

        {answered ? (
          <Appear from="down" exit={false} style={styles.after}>
            <View accessibilityLiveRegion="polite" style={styles.verdict}>
              <Pill label={wasRight ? t.quiz.correct : t.quiz.wrong} tone={wasRight ? 'primary' : 'warning'} />
              <AppText color="textMuted" style={styles.flex}>
                {question.word.term} → {meaningsToText(question.word)}
              </AppText>
            </View>
            {/* A right answer moves on by itself; the button is for those who want to go faster or stop and read */}
            <Button label={isLast ? t.quiz.finish : t.quiz.next} onPress={next} tone={wasRight ? 'secondary' : 'primary'} />
          </Appear>
        ) : null}
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
  flex: {
    flex: 1,
  },
  hintRow: {
    alignItems: 'center',
  },
  question: {
    gap: spacing.lg,
  },
  promptCard: {
    paddingVertical: spacing.xxl,
  },
  listenCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  speak: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget + spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  optionText: {
    flex: 1,
  },
  faded: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
  after: {
    gap: spacing.md,
  },
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
