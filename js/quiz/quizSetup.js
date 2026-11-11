// ===============================
// QUIZ EVENTS
// ===============================
// Wires the same set of events for every direction in QUIZ_DIRECTIONS.

import { QUIZ_DIRECTIONS } from "../config.js";
import { toggleMistakes } from "./mistakes.js";
import { checkAnswer, endQuiz, nextQuestion, resetQuizToStart, submitAnswerOrNext } from "./quizEngine.js";
import { getQuizElements } from "./quizElements.js";
import { showQuizStartScreen } from "./screens.js";
import { openQuizSelection, setupQuizSelection } from "./selection.js";

function setupQuizDirection(direction) {
  const elements = getQuizElements(direction);

  elements.startButton.addEventListener("click", () => openQuizSelection(direction));
  elements.backButton.addEventListener("click", () => showQuizStartScreen(direction));

  elements.checkButton.addEventListener("click", () => checkAnswer(direction));
  elements.nextButton.addEventListener("click", () => nextQuestion(direction));
  elements.endButton.addEventListener("click", () => endQuiz(direction));
  elements.restartButton.addEventListener("click", () => resetQuizToStart(direction));
  elements.mistakesButton.addEventListener("click", () => toggleMistakes(direction));

  elements.answerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      submitAnswerOrNext(direction);
    }
  });

  setupQuizSelection(direction);
}

export function setupQuiz() {
  Object.keys(QUIZ_DIRECTIONS).forEach(setupQuizDirection);
}
