// A quiz session. Options arrive as route params, so Home can open the review,
// the mistakes or the new words directly. Every answer updates the word stats.
//
// The route is in the root stack, above the tabs (not inside the Train tab): "End" and
// "Done" go back to where the quiz was opened (Home or Train) and the quiz is really closed.
// Inside the Train tab, a quiz opened from Home stayed on top of Train after going back.
//
// Params: direction=forward|backward, mode=due|all|mistakes, count=number (0 = all),
//         ids=comma separated word ids (optional, limits the quiz to those words),
//         blockId=the first word ID of the block (optional, tracks full rounds),
//         topics=tech,food… and kinds=noun,verb… (optional filters, empty = all),
//         exercise=dictation (optional): "Listen and write", the studied word is only heard
//         and has to be written; it is practice, so the words' boxes don't change.

import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Appear } from '@/components/Appear';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HeaderButton } from '@/components/HeaderButton';
import { HighlightedText } from '@/components/HighlightedText';
import { Pill } from '@/components/Pill';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { SpeakButton } from '@/components/SpeakButton';
import { Section } from '@/components/Section';
import { TextField, type TextFieldRef } from '@/components/TextField';
import { splitExample } from '@/domain/highlight';
import { TOPIC_ICONS } from '@/domain/topics';
import {
  buildDictation,
  buildQuiz,
  quizOptionsFromParams,
  type QuizOptions,
  type QuizParams,
  type QuizQuestion,
} from '@/domain/quiz';
import { evaluateAnswer, type AnswerVerdict } from '@/domain/text';
import { meaningsToText } from '@/domain/word';
import { useFocusAfterTransition } from '@/hooks/useFocusAfterTransition';
import { useT } from '@/i18n';
import { playSound, soundsForScreen } from '@/services/sounds';
import { speak } from '@/services/speech';
import { useActivityStore } from '@/store/activityStore';
import { useActivePair } from '@/store/settingsStore';
import { useWordStore, useWordsOfPair } from '@/store/wordStore';
import { spacing } from '@/theme';

type Mistake = { question: QuizQuestion; given: string };

export default function QuizScreen() {
  const t = useT();
  const params = useLocalSearchParams<QuizParams & { exercise?: string }>();
  const dictation = params.exercise === 'dictation';
  const baseOptions = quizOptionsFromParams(params);
  const blockId = params.blockId === baseOptions.wordIds?.[0] ? params.blockId : undefined;
  const options = { ...baseOptions, allowRepeatedPrompts: !!blockId };
  const pair = useActivePair();
  const words = useWordsOfPair(pair);
  const recordAnswer = useWordStore((state) => state.recordAnswer);
  const recordQuizFinished = useActivityStore((state) => state.recordQuizFinished);
  const inputRef = useRef<TextFieldRef>(null);
  useFocusAfterTransition(inputRef);
  // Sounds ready before the first answer (and the audio session on while the quiz is open)
  useEffect(soundsForScreen, []);

  const { height: windowHeight } = useWindowDimensions();
  const [keyboardFrame, setKeyboardFrame] = useState(() => (
    Platform.OS === 'ios' ? Keyboard.metrics() : undefined
  ));

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const frameSubscription = Keyboard.addListener('keyboardWillChangeFrame', ({ endCoordinates }) => {
      setKeyboardFrame(endCoordinates);
    });
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardFrame(undefined);
    });

    return () => {
      frameSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const keyboardInset = keyboardFrame
    ? Math.max(0, Math.min(keyboardFrame.height, windowHeight - keyboardFrame.screenY))
    : 0;

  // The questions are chosen once per round, so stats updates don't reshuffle them
  const build = (roundOptions: QuizOptions) => (dictation ? buildDictation(words, roundOptions) : buildQuiz(words, roundOptions));
  const [questions, setQuestions] = useState(() => build(options));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [roundBlockId, setRoundBlockId] = useState(blockId);
  const roundRecorded = useRef(false);

  const question = questions[index];
  const finished = index >= questions.length;
  const isLast = index === questions.length - 1;
  const answeredCount = index + (verdict ? 1 : 0);

  // Dictation: the word is read as soon as the question appears (and again with 🔊)
  const toRead = dictation && !finished ? questions[index]?.prompt : undefined;
  useEffect(() => {
    if (!toRead) {
      return;
    }
    const wait = setTimeout(() => speak(toRead, pair.source), 350);
    return () => clearTimeout(wait);
  }, [toRead, index, pair.source]);

  const submit = (given: string) => {
    const result = given.trim() ? evaluateAnswer(given, question.accepted, question.answerLanguage) : 'wrong';
    if (dictation) {
      // Practice: it counts as a training day, the word's box doesn't change
      useActivityStore.getState().markToday();
    } else {
      recordAnswer(question.word.id, result !== 'wrong');
    }
    setVerdict(result);
    playSound(result === 'wrong' ? 'wrong' : 'correct');
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
    if (isLast) {
      if (roundRecorded.current) {
        return;
      }
      roundRecorded.current = true;
      // The quiz is complete (not ended early): it can count for the "perfect quiz" medal
      recordQuizFinished(questions.length, mistakes.length, roundBlockId);
      playSound('finish');
    }
    setIndex(index + 1);
    setAnswer('');
    setVerdict(null);
    inputRef.current?.focus();
  };

  const startRound = (roundOptions: QuizOptions, nextBlockId?: string) => {
    roundRecorded.current = false;
    setRoundBlockId(nextBlockId);
    setQuestions(build(roundOptions));
    setIndex(0);
    setAnswer('');
    setVerdict(null);
    setMistakes([]);
    // The answer field appears again with the new round
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  /** Closes the quiz: back to where it was opened (Train when there is nothing to go back to). */
  const close = () => (router.canGoBack() ? router.back() : router.replace('/train'));

  /** Ends now: the results count only the questions already answered. */
  const endEarly = () => {
    if (answeredCount === 0) {
      close();
      return;
    }
    if (roundBlockId && answeredCount === questions.length) {
      next();
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
          <Button label={t.quiz.done} tone="secondary" onPress={close} />
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
                    {dictation ? wrong.correctText : `${wrong.prompt} → ${wrong.correctText}`}
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
            onPress={() => startRound(options, blockId)}
          />
          <Button label={t.quiz.done} tone="secondary" onPress={close} />
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

      <Screen
        automaticallyAdjustKeyboardInsets={false}
        contentInset={{ bottom: keyboardInset }}
        scrollIndicatorInsets={{ bottom: keyboardInset }}>
        <ProgressBar
          progress={answeredCount / questions.length}
          accessibilityLabel={t.quiz.progressAccessibility(index + 1, questions.length)}
        />

        {/* Keyed by the question: each new one slides in from the right */}
        <Appear key={index} from="right" exit={false}>
          {dictation ? (
            <Card style={styles.listenCard}>
              <SpeakButton text={question.prompt} language={pair.source} size="lg" />
              {/* The written word appears only after answering: before, it would be the answer */}
              <AppText color="textMuted" style={styles.centered}>
                {verdict ? question.word.term : t.exercises.dictationHint}
              </AppText>
            </Card>
          ) : (
          <Card style={styles.questionCard}>
            <AppText variant="hero" style={styles.centered} accessibilityRole="header">
              {question.prompt}
            </AppText>
            {question.note ? (
              <AppText color="textMuted" style={styles.centered}>
                ({question.note})
              </AppText>
            ) : null}
            {/* With a topic filter: which meaning is asked ("stroke" in Health = "ictus") */}
            {question.topicHint ? (
              <AppText color="textMuted" style={styles.centered}>
                {TOPIC_ICONS[question.topicHint]} {t.topics[question.topicHint]}
              </AppText>
            ) : null}
            {/* The studied word can be listened to (bottom right of its card); a translation in
                one's own language needs no voice */}
            {options.direction === 'forward' ? (
              <View style={styles.speak}>
                <SpeakButton text={question.prompt} language={pair.source} />
              </View>
            ) : null}
          </Card>
          )}
        </Appear>

        <TextField
          ref={inputRef}
          value={answer}
          onChangeText={setAnswer}
          placeholder={dictation ? t.exercises.dictationPlaceholder : t.quiz.answerPlaceholder}
          accessibilityLabel={dictation ? t.exercises.dictationPlaceholder : t.quiz.answerPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType={verdict === null ? 'done' : 'next'}
          submitBehavior="submit"
          onSubmitEditing={verdict === null ? check : next}
        />

        {verdict ? (
          <Appear from="down" exit={false}>
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
              <View style={styles.answerRow}>
                <AppText color="textMuted" style={styles.flex}>
                  {question.word.term} → {meaningsToText(question.word)}
                </AppText>
                {/* After the answer the word can always be heard, in both directions */}
                <SpeakButton text={question.word.term} language={pair.source} />
              </View>
            </Card>
          </Appear>
        ) : null}

        {verdict && examples.length > 0 ? (
          <Section title={t.quiz.examples}>
            <Card>
              {examples.map((example) => {
                // The word in bold in the sentence, its translations in bold in the translation
                const { sentence, translation } = splitExample(example);
                return (
                  <View key={example}>
                    <HighlightedText text={`• ${sentence}`} terms={[question.word.term]} language={pair.source} />
                    {translation ? (
                      <HighlightedText
                        text={translation}
                        terms={question.word.meanings.map((meaning) => meaning.text)}
                        language={pair.target}
                        color="textMuted"
                        style={styles.translation}
                      />
                    ) : null}
                  </View>
                );
              })}
            </Card>
          </Section>
        ) : null}

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
  listenCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  speak: {
    position: 'absolute',
    right: spacing.xs,
    bottom: spacing.xs,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  actions: {
    gap: spacing.md,
  },
  translation: {
    marginLeft: spacing.md,
  },
});
