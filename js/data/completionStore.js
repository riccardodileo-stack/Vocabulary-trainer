// ===============================
// QUIZ COMPLETION COUNTERS
// ===============================

import { QUIZ_COMPLETIONS_KEY } from "../config.js";
import { readJson, writeJson } from "./storage.js";

let quizCompletions = {};

export function loadQuizCompletions() {
  try {
    quizCompletions = readJson(QUIZ_COMPLETIONS_KEY, {});
  } catch (error) {
    quizCompletions = {};
  }
}

function getQuizCompletionKey(direction, quizId) {
  return `${direction}:${quizId}`;
}

export function getQuizCompletionCount(direction, quizId) {
  const key = getQuizCompletionKey(direction, quizId);
  return quizCompletions[key] || 0;
}

export function registerQuizCompletion(direction, quizId) {
  const key = getQuizCompletionKey(direction, quizId);

  quizCompletions[key] = getQuizCompletionCount(direction, quizId) + 1;
  writeJson(QUIZ_COMPLETIONS_KEY, quizCompletions);
}
