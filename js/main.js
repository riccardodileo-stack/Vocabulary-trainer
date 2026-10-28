// ===============================
// VOCABULARY TRAINER - ENTRY POINT
// ===============================

import { loadQuizCompletions } from "./data/completionStore.js";
import { loadWords, onWordsChange } from "./data/wordStore.js";
import { setupQuiz } from "./quiz/quizSetup.js";
import { setupStickyTabsAppearance } from "./ui/stickyTabs.js";
import { setupTabs } from "./ui/tabs.js";
import { showToast } from "./ui/toast.js";
import { setupBackup } from "./vocabulary/backup.js";
import { setupDictionary } from "./vocabulary/dictionary.js";
import { renderSharedTranslations, setupSharedTranslations } from "./vocabulary/sharedTranslations.js";
import { setupAddWordForm } from "./vocabulary/wordActions.js";
import { renderWordList, setupWordList } from "./vocabulary/wordList.js";

function renderVocabulary() {
  renderWordList();
  renderSharedTranslations();
}

function initApp() {
  if (!loadWords()) {
    showToast("Error while loading saved words");
  }

  loadQuizCompletions();

  setupTabs();
  setupStickyTabsAppearance();

  setupWordList();
  setupSharedTranslations();
  setupAddWordForm();
  setupDictionary();
  setupBackup();
  setupQuiz();

  // Every change to the words re-renders the vocabulary views
  onWordsChange(renderVocabulary);
  renderVocabulary();
}

initApp();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}
