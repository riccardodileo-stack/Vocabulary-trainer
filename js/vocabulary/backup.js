// ===============================
// VOCABULARY - IMPORT / EXPORT
// ===============================

import { addWords, getWords, wordPairExists } from "../data/wordStore.js";
import { showToast } from "../ui/toast.js";
import { normalizeText } from "../utils/text.js";

const BACKUP_APP_NAME = "Vocabulary Trainer";
const BACKUP_VERSION = 1;

function downloadJson(data, fileName) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function exportWords() {
  const words = getWords();

  if (words.length === 0) {
    showToast("No words to export");
    return;
  }

  const backup = {
    app: BACKUP_APP_NAME,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    words: words
  };

  const date = new Date().toISOString().slice(0, 10);
  downloadJson(backup, `vocabulary-backup-${date}.json`);

  showToast("Backup exported");
}

// Accepts both a plain array of words and a full backup object.
// Returns null when the format is not recognised.
function extractWordsFromBackup(importedData) {
  if (Array.isArray(importedData)) {
    return importedData;
  }

  if (importedData && Array.isArray(importedData.words)) {
    return importedData.words;
  }

  return null;
}

function importWords(importedWords) {
  const newWords = [];
  let skippedCount = 0;

  importedWords.forEach((item) => {
    if (!item || !item.english || !item.italian) {
      skippedCount += 1;
      return;
    }

    const english = String(item.english).trim();
    const italian = String(item.italian).trim();

    const isDuplicate =
      wordPairExists(english, italian) ||
      newWords.some((word) => {
        return (
          normalizeText(word.english) === normalizeText(english) &&
          normalizeText(word.italian) === normalizeText(italian)
        );
      });

    if (isDuplicate) {
      skippedCount += 1;
      return;
    }

    newWords.push({ english, italian });
  });

  addWords(newWords);

  showToast(`Imported ${newWords.length} words, skipped ${skippedCount}`);
}

function importWordsFromFile(event) {
  const file = event.target.files[0];

  if (!file) {
    showToast("No file selected");
    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    try {
      const importedWords = extractWordsFromBackup(JSON.parse(reader.result));

      if (importedWords) {
        importWords(importedWords);
      } else {
        showToast("Invalid JSON format");
      }
    } catch (error) {
      console.error("Import error:", error);
      showToast("Error while reading JSON file");
    }

    // Allows choosing the same file again
    event.target.value = "";
  };

  reader.onerror = function () {
    console.error("FileReader error");
    showToast("Error while opening file");
  };

  reader.readAsText(file);
}

export function setupBackup() {
  document.getElementById("export-words-button").addEventListener("click", exportWords);
  document.getElementById("import-file-input").addEventListener("change", importWordsFromFile);
}
