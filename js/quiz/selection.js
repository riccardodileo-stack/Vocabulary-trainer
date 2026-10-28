// ===============================
// QUIZ SELECTION SCREEN
// ===============================

import { getQuizCompletionCount } from "../data/completionStore.js";
import { getWords } from "../data/wordStore.js";
import { showToast } from "../ui/toast.js";
import { escapeHtml, pluralizeTimes } from "../utils/text.js";
import { getQuizPackage, getQuizPackages } from "./packages.js";
import { startQuiz } from "./quizEngine.js";
import { getQuizElements } from "./quizElements.js";
import { showQuizSelectionScreen } from "./screens.js";

function createPackageCardHtml(direction, quizPackage) {
  const completionCount = getQuizCompletionCount(direction, quizPackage.id);

  const wordRange = quizPackage.isGeneral
    ? "All saved words"
    : `Words ${quizPackage.startWordNumber}–${quizPackage.endWordNumber}`;

  return `
    <div class="quiz-option-card ${quizPackage.isGeneral ? "general-quiz" : ""}">
      <div class="quiz-option-info">
        <div class="quiz-option-title">${escapeHtml(quizPackage.name)}</div>

        <div class="quiz-option-details">
          <span class="quiz-option-detail-pill">
            ${quizPackage.words.length} words
          </span>

          <span class="quiz-option-detail-pill">
            ${escapeHtml(wordRange)}
          </span>

          <span class="quiz-option-detail-pill">
            Completed: ${pluralizeTimes(completionCount)}
          </span>
        </div>
      </div>

      <button class="quiz-option-button" data-start-package="${quizPackage.id}">
        Start
      </button>
    </div>
  `;
}

function renderQuizSelection(direction) {
  const { options } = getQuizElements(direction);

  options.innerHTML = getQuizPackages()
    .map((quizPackage) => createPackageCardHtml(direction, quizPackage))
    .join("");
}

export function openQuizSelection(direction) {
  if (getWords().length === 0) {
    showToast("Add at least one word before starting a quiz");
    return;
  }

  showQuizSelectionScreen(direction);
  renderQuizSelection(direction);
}

export function setupQuizSelection(direction) {
  // One listener for all package buttons, so it survives every re-render
  getQuizElements(direction).options.addEventListener("click", (event) => {
    const startButton = event.target.closest("[data-start-package]");

    if (!startButton) {
      return;
    }

    const selectedPackage = getQuizPackage(startButton.dataset.startPackage);

    if (!selectedPackage || selectedPackage.words.length === 0) {
      showToast("No words available for this quiz");
      return;
    }

    startQuiz(direction, selectedPackage);
  });
}
