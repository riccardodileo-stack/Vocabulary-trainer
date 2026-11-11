// ===============================
// QUIZ MISTAKES LIST
// ===============================

import { escapeHtml } from "../utils/text.js";
import { getQuizElements } from "./quizElements.js";
import { getQuiz } from "./quizState.js";

const NO_MISTAKES_HTML = `
  <div class="mistakes-empty">
    No mistakes. Perfect quiz 🎉
  </div>
`;

function createMistakeCardHtml(word) {
  return `
    <div class="mistake-card">
      <div class="mistake-row">
        <div>
          <div class="word-label">English</div>
          <div class="mistake-word">${escapeHtml(word.english)}</div>
        </div>

        <div class="arrow">→</div>

        <div>
          <div class="word-label">Italian</div>
          <div class="mistake-word">${escapeHtml(word.italian)}</div>
        </div>
      </div>

      <div class="mistake-answer">
        Your answer: <strong>${escapeHtml(word.yourAnswer || "-")}</strong>
      </div>
    </div>
  `;
}

export function toggleMistakes(direction) {
  const { mistakes: mistakesElement } = getQuizElements(direction);
  const { mistakes } = getQuiz(direction);

  if (!mistakesElement.classList.contains("hidden")) {
    mistakesElement.classList.add("hidden");
    return;
  }

  mistakesElement.innerHTML = mistakes.length === 0
    ? NO_MISTAKES_HTML
    : mistakes.map(createMistakeCardHtml).join("");

  mistakesElement.classList.remove("hidden");
}
