// ===============================
// VOCABULARY - WORD LIST & SEARCH
// ===============================

import { getWords } from "../data/wordStore.js";
import { escapeHtml, normalizeText } from "../utils/text.js";
import { deleteWord, editWord } from "./wordActions.js";

let wordSearchQuery = "";

const EMPTY_LIST_HTML = `
  <div class="empty-icon">📘</div>
  <h3>No words yet</h3>
  <p>Add your first word to start training.</p>
`;

const NO_RESULTS_HTML = `
  <div class="empty-icon">🔎</div>
  <h3>No results</h3>
  <p>No English word matches your search.</p>
`;

// Newest words first, filtered by the search query.
// originalIndex is kept so edit/delete act on the right word.
function getVisibleWords() {
  const query = normalizeText(wordSearchQuery);

  return getWords()
    .map((word, originalIndex) => ({ ...word, originalIndex }))
    .reverse()
    .filter((word) => !query || normalizeText(word.english).includes(query));
}

function createWordCardHtml(word) {
  return `
    <div class="word-card">
      <div class="word-main">
        <div class="word-label">English</div>
        <div class="word-value">${escapeHtml(word.english)}</div>
      </div>

      <div class="arrow">→</div>

      <div class="word-main">
        <div class="word-label">Italian</div>
        <div class="word-value">${escapeHtml(word.italian)}</div>
      </div>

      <div class="word-actions">
        <button class="edit-button" data-edit-index="${word.originalIndex}">
          Edit
        </button>

        <button class="danger delete-button" data-delete-index="${word.originalIndex}">
          Delete
        </button>
      </div>
    </div>
  `;
}

export function renderWordList() {
  const wordList = document.getElementById("word-list");
  const emptyListMessage = document.getElementById("empty-list-message");
  const wordCount = document.getElementById("word-count");

  const words = getWords();
  const visibleWords = getVisibleWords();

  wordList.innerHTML = "";
  wordCount.textContent = words.length;

  if (words.length === 0 || visibleWords.length === 0) {
    emptyListMessage.classList.remove("hidden");
    emptyListMessage.innerHTML = words.length === 0 ? EMPTY_LIST_HTML : NO_RESULTS_HTML;
    return;
  }

  emptyListMessage.classList.add("hidden");
  wordList.innerHTML = visibleWords.map(createWordCardHtml).join("");
}

export function setupWordList() {
  document.getElementById("word-search-input").addEventListener("input", (event) => {
    wordSearchQuery = event.target.value;
    renderWordList();
  });

  // One listener for all cards, so it survives every re-render
  document.getElementById("word-list").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-index]");
    const deleteButton = event.target.closest("[data-delete-index]");

    if (editButton) {
      editWord(Number(editButton.dataset.editIndex));
    }

    if (deleteButton) {
      deleteWord(Number(deleteButton.dataset.deleteIndex));
    }
  });
}
