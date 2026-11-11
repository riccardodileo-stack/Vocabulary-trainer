// ===============================
// QUIZ ENGINE (game logic)
// ===============================

import { QUIZ_DIRECTIONS } from "../config.js";
import { getQuizCompletionCount, registerQuizCompletion } from "../data/completionStore.js";
import { showToast } from "../ui/toast.js";
import { shuffleArray } from "../utils/array.js";
import { isFlexibleAnswerCorrect, normalizeText } from "../utils/text.js";
import { getQuizElements } from "./quizElements.js";
import { getCurrentQuizWord, getQuiz, resetQuizState } from "./quizState.js";
import {
  renderAnswerResult,
  renderEmptyQuiz,
  renderQuestion,
  renderQuizFinished
} from "./quizView.js";
import { showQuizActiveScreen, showQuizStartScreen } from "./screens.js";

function getQuestionText(direction, word) {
  return word[QUIZ_DIRECTIONS[direction].questionField];
}

function getCorrectAnswerText(direction, word) {
  return word[QUIZ_DIRECTIONS[direction].answerField];
}

function isAnswerCorrect(direction, userAnswer, correctAnswer) {
  if (QUIZ_DIRECTIONS[direction].flexibleAnswers) {
    return isFlexibleAnswerCorrect(userAnswer, correctAnswer);
  }

  return normalizeText(userAnswer) === normalizeText(correctAnswer);
}

function showCurrentQuestion(direction) {
  const quiz = getQuiz(direction);

  if (quiz.queue.length === 0) {
    renderEmptyQuiz(direction);
    return;
  }

  renderQuestion(direction, {
    questionText: getQuestionText(direction, getCurrentQuizWord(quiz)),
    score: quiz.score,
    answeredCount: quiz.currentIndex
  });
}

export function startQuiz(direction, quizPackage) {
  resetQuizState(direction);

  const quiz = getQuiz(direction);

  quiz.queue = shuffleArray(quizPackage.words);
  quiz.selectedQuizId = quizPackage.id;
  quiz.selectedQuizName = quizPackage.name;

  showQuizActiveScreen(direction);
  showCurrentQuestion(direction);
}

export function checkAnswer(direction) {
  const quiz = getQuiz(direction);

  if (quiz.queue.length === 0) {
    showToast("Start the quiz first");
    return;
  }

  if (quiz.answered) {
    return;
  }

  const userAnswer = getQuizElements(direction).answerInput.value.trim();

  if (!userAnswer) {
    showToast("Write an answer first");
    return;
  }

  const currentWord = getCurrentQuizWord(quiz);
  const correctAnswer = getCorrectAnswerText(direction, currentWord);
  const isCorrect = isAnswerCorrect(direction, userAnswer, correctAnswer);

  if (isCorrect) {
    quiz.score += 1;
  } else {
    quiz.mistakes.push({
      english: currentWord.english,
      italian: currentWord.italian,
      yourAnswer: userAnswer
    });
  }

  quiz.answered = true;

  renderAnswerResult(direction, {
    isCorrect,
    questionText: getQuestionText(direction, currentWord),
    correctAnswer,
    userAnswer,
    score: quiz.score,
    answeredCount: quiz.currentIndex + 1
  });
}

export function nextQuestion(direction) {
  const quiz = getQuiz(direction);

  quiz.currentIndex += 1;
  quiz.answered = false;

  if (quiz.currentIndex >= quiz.queue.length) {
    finishQuiz(direction, true);
    return;
  }

  showCurrentQuestion(direction);
}

// Enter key: checks the answer, or moves on if it was already checked
export function submitAnswerOrNext(direction) {
  if (getQuiz(direction).answered) {
    nextQuestion(direction);
  } else {
    checkAnswer(direction);
  }
}

export function endQuiz(direction) {
  const quiz = getQuiz(direction);

  if (quiz.queue.length === 0) {
    showToast("Start the quiz first");
    return;
  }

  // Only the questions already answered count for the final score
  const answeredQuestions = quiz.answered
    ? quiz.currentIndex + 1
    : quiz.currentIndex;

  quiz.queue = quiz.queue.slice(0, Math.max(answeredQuestions, 0));

  finishQuiz(direction, false);
}

function finishQuiz(direction, completedNaturally) {
  const quiz = getQuiz(direction);

  if (completedNaturally && quiz.selectedQuizId && !quiz.completionRegistered) {
    registerQuizCompletion(direction, quiz.selectedQuizId);
    quiz.completionRegistered = true;
  }

  renderQuizFinished(direction, {
    completedNaturally,
    score: quiz.score,
    total: quiz.queue.length,
    quizName: quiz.selectedQuizName,
    completionCount: quiz.selectedQuizId
      ? getQuizCompletionCount(direction, quiz.selectedQuizId)
      : 0
  });

  showToast(completedNaturally ? "Quiz completed" : "Quiz ended");
}

export function resetQuizToStart(direction) {
  resetQuizState(direction);
  renderEmptyQuiz(direction);
  showQuizStartScreen(direction);
}
