// ===============================
// VOCABULARY - ADD / EDIT / DELETE
// ===============================
// These functions only change the store: the UI re-renders itself
// through the onWordsChange listeners registered in main.js.

import {
  addWord as storeAddWord,
  englishWordExists,
  getWord,
  removeWord,
  updateWord,
  wordPairExists
} from "../data/wordStore.js";
import { showToast } from "../ui/toast.js";

export function addWordFromInputs() {
  const englishInput = document.getElementById("english-input");
  const italianInput = document.getElementById("italian-input");

  const english = englishInput.value.trim();
  const italian = italianInput.value.trim();

  if (!english || !italian) {
    showToast("Please fill both fields");
    return;
  }

  if (englishWordExists(english)) {
    showToast("This English word already exists");
    return;
  }

  storeAddWord(english, italian);
  clearInputs();

  showToast("Word saved successfully");
}

export function deleteWord(index) {
  removeWord(index);
  showToast("Word deleted");
}

export function editWord(index) {
  const currentWord = getWord(index);

  const newEnglish = prompt("Edit English word:", currentWord.english);
  if (newEnglish === null) {
    return;
  }

  const newItalian = prompt("Edit Italian translation:", currentWord.italian);
  if (newItalian === null) {
    return;
  }

  const cleanEnglish = newEnglish.trim();
  const cleanItalian = newItalian.trim();

  if (!cleanEnglish || !cleanItalian) {
    showToast("Both fields are required");
    return;
  }

  if (wordPairExists(cleanEnglish, cleanItalian, index)) {
    showToast("This word pair already exists");
    return;
  }

  updateWord(index, cleanEnglish, cleanItalian);
  showToast("Word updated");
}

function clearInputs() {
  document.getElementById("english-input").value = "";
  document.getElementById("italian-input").value = "";
}

export function setupAddWordForm() {
  document.getElementById("save-word-button").addEventListener("click", addWordFromInputs);
  document.getElementById("clear-inputs-button").addEventListener("click", clearInputs);

  document.getElementById("english-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      document.getElementById("italian-input").focus();
    }
  });

  document.getElementById("italian-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addWordFromInputs();
    }
  });
}
