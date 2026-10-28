// ===============================
// VOCABULARY - SHARED TRANSLATIONS
// ===============================
// Groups English words that share at least one Italian meaning.

import { getWords } from "../data/wordStore.js";
import { escapeHtml, splitAnswerOptions } from "../utils/text.js";
import { editWord } from "./wordActions.js";

let sharedTranslationsVisible = false;

function getSharedTranslationGroups() {
  const groupsMap = new Map();

  getWords().forEach((word, originalIndex) => {
    const individualTranslations = [...new Set(splitAnswerOptions(word.italian))];

    individualTranslations.forEach((translation) => {
      if (!groupsMap.has(translation)) {
        groupsMap.set(translation, {
          meaning: translation,
          firstOccurrenceIndex: originalIndex,
          words: []
        });
      }

      groupsMap.get(translation).words.push({
        english: word.english,
        italian: word.italian,
        originalIndex: originalIndex
      });
    });
  });

  return Array.from(groupsMap.values())
    .filter((group) => group.words.length >= 2)
    .sort((groupA, groupB) => {
      return groupA.firstOccurrenceIndex - groupB.firstOccurrenceIndex;
    });
}

function createWordRowHtml(word) {
  return `
    <div class="shared-word-row">
      <div class="shared-word-info">
        <div class="shared-english-word">
          ${escapeHtml(word.english)}
        </div>

        <div class="shared-full-translation">
          ${escapeHtml(word.italian)}
        </div>
      </div>

      <button
        class="shared-edit-button"
        data-shared-edit-index="${word.originalIndex}"
      >
        Edit
      </button>
    </div>
  `;
}

function createGroupHtml(group) {
  return `
    <div class="shared-group-card">
      <div class="shared-group-meaning">
        ${escapeHtml(group.meaning)}
      </div>

      <div class="shared-group-words">
        ${group.words.map(createWordRowHtml).join("")}
      </div>
    </div>
  `;
}

export function renderSharedTranslations() {
  const panel = document.getElementById("shared-translations-panel");
  const arrow = document.getElementById("shared-button-arrow");

  if (!panel || !arrow) {
    return;
  }

  if (!sharedTranslationsVisible) {
    panel.classList.add("hidden");
    arrow.classList.remove("open");
    panel.innerHTML = "";
    return;
  }

  arrow.classList.add("open");
  panel.classList.remove("hidden");

  const groups = getSharedTranslationGroups();

  if (groups.length === 0) {
    panel.innerHTML = `
      <div class="no-shared-translations">
        No shared Italian translations found in your vocabulary list.
      </div>
    `;
    return;
  }

  panel.innerHTML = `
    <div class="shared-results-header">
      <div class="shared-results-title">Shared translations</div>

      <div class="counter-pill">
        ${groups.length} groups
      </div>
    </div>

    ${groups.map(createGroupHtml).join("")}
  `;
}

export function setupSharedTranslations() {
  document.getElementById("toggle-shared-translations-button").addEventListener("click", () => {
    sharedTranslationsVisible = !sharedTranslationsVisible;
    renderSharedTranslations();
  });

  // One listener for all edit buttons, so it survives every re-render
  document.getElementById("shared-translations-panel").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-shared-edit-index]");

    if (editButton) {
      editWord(Number(editButton.dataset.sharedEditIndex));
    }
  });
}
