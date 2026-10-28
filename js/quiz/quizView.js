// ===============================
// QUIZ VIEW (active quiz screen rendering)
// ===============================
// Only touches the DOM: all decisions are taken in quizEngine.js.

import { escapeHtml, pluralizeTimes } from "../utils/text.js";
import { getQuizElements } from "./quizElements.js";

const BUTTONS = {
  check: "checkButton",
  next: "nextButton",
  end: "endButton",
  restart: "restartButton",
  mistakes: "mistakesButton"
};

// Shows only the listed buttons, e.g. showOnlyButtons(elements, ["check", "end"])
function showOnlyButtons(elements, visibleButtons) {
  Object.entries(BUTTONS).forEach(([name, elementKey]) => {
    elements[elementKey].classList.toggle("hidden", !visibleButtons.includes(name));
  });
}

function setAnswerInput(elements, disabled) {
  elements.answerInput.value = "";
  elements.answerInput.disabled = disabled;
}

function hideFeedback(elements) {
  elements.feedback.className = "feedback-card hidden";
  elements.feedback.innerHTML = "";
}

function showFeedback(elements, type, html) {
  elements.feedback.className = `feedback-card feedback-${type}`;
  elements.feedback.innerHTML = html;
}

function hideMistakes(elements) {
  elements.mistakes.classList.add("hidden");
  elements.mistakes.innerHTML = "";
}

export function renderEmptyQuiz(direction) {
  const elements = getQuizElements(direction);

  elements.question.textContent = "No words available";
  setAnswerInput(elements, false);
  hideFeedback(elements);
  showOnlyButtons(elements, []);
  hideMistakes(elements);
  elements.progress.textContent = "Score: 0 / 0";
}

export function renderQuestion(direction, { questionText, score, answeredCount }) {
  const elements = getQuizElements(direction);

  elements.question.textContent = questionText;
  setAnswerInput(elements, false);
  hideFeedback(elements);
  showOnlyButtons(elements, ["check", "end"]);
  hideMistakes(elements);
  elements.progress.textContent = `Score: ${score} / ${answeredCount}`;
}

export function renderAnswerResult(direction, result) {
  const elements = getQuizElements(direction);
  const { isCorrect, questionText, correctAnswer, userAnswer, score, answeredCount } = result;

  if (isCorrect) {
    showFeedback(elements, "correct", `
      ✅ Correct!<br>
      <strong>${escapeHtml(questionText)}</strong>
      =
      <strong>${escapeHtml(correctAnswer)}</strong>
    `);
  } else {
    showFeedback(elements, "wrong", `
      ❌ Not quite<br>
      Correct answer:
      <strong>${escapeHtml(correctAnswer)}</strong><br>
      Your answer:
      <strong>${escapeHtml(userAnswer)}</strong>
    `);
  }

  elements.answerInput.disabled = true;
  showOnlyButtons(elements, ["next", "end"]);
  elements.progress.textContent = `Score: ${score} / ${answeredCount}`;
}

export function renderQuizFinished(direction, summary) {
  const elements = getQuizElements(direction);
  const { completedNaturally, score, total, quizName, completionCount } = summary;

  elements.question.textContent = completedNaturally ? "Quiz completed" : "Quiz ended";
  setAnswerInput(elements, true);

  const completionHtml = completedNaturally
    ? `<br><br>${escapeHtml(quizName)} completed: <strong>${pluralizeTimes(completionCount)}</strong>`
    : "";

  showFeedback(elements, "correct", `
    ${completedNaturally ? "🎉 Final score:" : "Current score:"}<br>
    <strong>${score} / ${total}</strong>
    ${completionHtml}
  `);

  showOnlyButtons(elements, ["restart", "mistakes"]);
  hideMistakes(elements);

  elements.progress.textContent = completedNaturally
    ? `Final score: ${score} / ${total}`
    : `Score when ended: ${score} / ${total}`;
}
