// ===============================
// QUIZ SCREENS (start / selection / active)
// ===============================

import { getQuizElements } from "./quizElements.js";

function showScreen(direction, screenName) {
  const elements = getQuizElements(direction);

  elements.startScreen.classList.toggle("hidden", screenName !== "start");
  elements.selectionScreen.classList.toggle("hidden", screenName !== "selection");
  elements.quizScreen.classList.toggle("hidden", screenName !== "quiz");
}

export function showQuizStartScreen(direction) {
  showScreen(direction, "start");
}

export function showQuizSelectionScreen(direction) {
  showScreen(direction, "selection");
}

export function showQuizActiveScreen(direction) {
  showScreen(direction, "quiz");
}
