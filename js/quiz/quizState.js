// ===============================
// QUIZ STATE
// ===============================
// One independent state object per quiz direction.

import { QUIZ_DIRECTIONS } from "../config.js";

function createQuizState(direction) {
  return {
    direction: direction,
    queue: [],
    currentIndex: 0,
    score: 0,
    answered: false,
    mistakes: [],
    selectedQuizId: null,
    selectedQuizName: "",
    completionRegistered: false
  };
}

const quizzes = {};

Object.keys(QUIZ_DIRECTIONS).forEach((direction) => {
  quizzes[direction] = createQuizState(direction);
});

export function getQuiz(direction) {
  return quizzes[direction];
}

export function resetQuizState(direction) {
  Object.assign(quizzes[direction], createQuizState(direction));
}

export function getCurrentQuizWord(quiz) {
  return quiz.queue[quiz.currentIndex];
}
