// ===============================
// VOCABULARY TRAINER - SCRIPT
// ===============================

// Key used to save words inside the browser
const STORAGE_KEY = "vocabularyTrainerWords";
const QUIZ_COMPLETIONS_KEY = "vocabularyTrainerQuizCompletions";
const QUIZ_PACKAGE_SIZE = 50;

// Main data
let words = [];
let wordSearchQuery = "";
let sharedTranslationsVisible = false;
let quizCompletions = {};

// Quiz states
let engItaQuiz = {
  direction: "eng-ita",
  queue: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  mistakes: [],
  selectedQuizId: null,
  selectedQuizName: "",
  completionRegistered: false
};

let itaEngQuiz = {
  direction: "ita-eng",
  queue: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  mistakes: [],
  selectedQuizId: null,
  selectedQuizName: "",
  completionRegistered: false
};

// ===============================
// BASIC UTILITIES
// ===============================

function normalizeText(text) {
  return text.trim().toLowerCase();
}

function splitAnswerOptions(text) {
  return text
    .split("/")
    .map((part) => normalizeText(part))
    .filter((part) => part.length > 0);
}

function isFlexibleAnswerCorrect(userAnswer, correctAnswer) {
  const userOptions = splitAnswerOptions(userAnswer);
  const correctOptions = splitAnswerOptions(correctAnswer);

  if (userOptions.length === 0 || correctOptions.length === 0) {
    return false;
  }

  return userOptions.every((userOption) => {
    return correctOptions.includes(userOption);
  });
}

function getSharedTranslationGroups() {
  const groupsMap = new Map();

  words.forEach((word, originalIndex) => {
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

function toggleSharedTranslations() {
  sharedTranslationsVisible = !sharedTranslationsVisible;
  renderSharedTranslations();
}

function renderSharedTranslations() {
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

    ${groups
      .map((group) => {
        return `
          <div class="shared-group-card">
            <div class="shared-group-meaning">
              ${escapeHtml(group.meaning)}
            </div>

            <div class="shared-group-words">
              ${group.words
                .map((word) => {
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
                })
                .join("")}
            </div>
          </div>
        `;
      })
      .join("")}
  `;

  const editButtons = panel.querySelectorAll("[data-shared-edit-index]");

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.sharedEditIndex);
      editWord(index);
    });
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }

  return copy;
}

function showQuizStartScreen(direction) {
  const startScreen = document.getElementById(
    direction === "eng-ita" ? "eng-ita-start-screen" : "ita-eng-start-screen"
  );

  const selectionScreen = document.getElementById(
    direction === "eng-ita" ? "eng-ita-selection-screen" : "ita-eng-selection-screen"
  );

  const quizScreen = document.getElementById(
    direction === "eng-ita" ? "eng-ita-quiz-screen" : "ita-eng-quiz-screen"
  );

  startScreen.classList.remove("hidden");
  selectionScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
}

function showQuizSelectionScreen(direction) {
  const startScreen = document.getElementById(
    direction === "eng-ita" ? "eng-ita-start-screen" : "ita-eng-start-screen"
  );

  const selectionScreen = document.getElementById(
    direction === "eng-ita" ? "eng-ita-selection-screen" : "ita-eng-selection-screen"
  );

  const quizScreen = document.getElementById(
    direction === "eng-ita" ? "eng-ita-quiz-screen" : "ita-eng-quiz-screen"
  );

  startScreen.classList.add("hidden");
  selectionScreen.classList.remove("hidden");
  quizScreen.classList.add("hidden");

  renderQuizSelection(direction);
}

function showQuizActiveScreen(direction) {
  const startScreen = document.getElementById(
    direction === "eng-ita" ? "eng-ita-start-screen" : "ita-eng-start-screen"
  );

  const selectionScreen = document.getElementById(
    direction === "eng-ita" ? "eng-ita-selection-screen" : "ita-eng-selection-screen"
  );

  const quizScreen = document.getElementById(
    direction === "eng-ita" ? "eng-ita-quiz-screen" : "ita-eng-quiz-screen"
  );

  startScreen.classList.add("hidden");
  selectionScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
}

function openQuizSelection(direction) {
  if (words.length === 0) {
    showToast("Add at least one word before starting a quiz");
    return;
  }

  showQuizSelectionScreen(direction);
}

function renderQuizSelection(direction) {
  const optionsElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-quiz-options" : "ita-eng-quiz-options"
  );

  if (!optionsElement) {
    return;
  }

  const packages = getQuizPackages();

  optionsElement.innerHTML = packages
    .map((quizPackage) => {
      const completionCount = getQuizCompletionCount(direction, quizPackage.id);
      const completedLabel = completionCount === 1 ? "1 time" : `${completionCount} times`;

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
                Completed: ${completedLabel}
              </span>
            </div>
          </div>

          <button class="quiz-option-button" data-start-package="${quizPackage.id}">
            Start
          </button>
        </div>
      `;
    })
    .join("");

  const packageButtons = optionsElement.querySelectorAll("[data-start-package]");

  packageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      startQuiz(direction, button.dataset.startPackage);
    });
  });
}

function resetQuizToStart(direction) {
  const quiz = direction === "eng-ita" ? engItaQuiz : itaEngQuiz;

  quiz.queue = [];
  quiz.currentIndex = 0;
  quiz.score = 0;
  quiz.answered = false;
  quiz.mistakes = [];
  quiz.selectedQuizId = null;
  quiz.selectedQuizName = "";
  quiz.completionRegistered = false;

  const questionElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-question" : "ita-eng-question"
  );

  const answerInput = document.getElementById(
    direction === "eng-ita" ? "eng-ita-answer" : "ita-eng-answer"
  );

  const feedbackElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-feedback" : "ita-eng-feedback"
  );

  const checkButton = document.getElementById(
    direction === "eng-ita" ? "check-eng-ita-button" : "check-ita-eng-button"
  );

  const nextButton = document.getElementById(
    direction === "eng-ita" ? "next-eng-ita-button" : "next-ita-eng-button"
  );

  const endButton = document.getElementById(
    direction === "eng-ita" ? "end-eng-ita-button" : "end-ita-eng-button"
  );

  const restartButton = document.getElementById(
    direction === "eng-ita" ? "restart-eng-ita-button" : "restart-ita-eng-button"
  );

  const mistakesButton = document.getElementById(
    direction === "eng-ita" ? "view-eng-ita-mistakes-button" : "view-ita-eng-mistakes-button"
  );

  const mistakesElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-mistakes" : "ita-eng-mistakes"
  );

  const progressElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-progress" : "ita-eng-progress"
  );

  if (questionElement) {
    questionElement.textContent = "No words available";
  }

  if (answerInput) {
    answerInput.value = "";
    answerInput.disabled = false;
  }

  if (feedbackElement) {
    feedbackElement.className = "feedback-card hidden";
    feedbackElement.innerHTML = "";
  }

  if (checkButton) {
    checkButton.classList.add("hidden");
  }

  if (nextButton) {
    nextButton.classList.add("hidden");
  }

  if (endButton) {
    endButton.classList.add("hidden");
  }

  if (restartButton) {
    restartButton.classList.add("hidden");
  }

  if (mistakesButton) {
    mistakesButton.classList.add("hidden");
  }

  if (mistakesElement) {
    mistakesElement.classList.add("hidden");
    mistakesElement.innerHTML = "";
  }

  if (progressElement) {
    progressElement.textContent = "Score: 0 / 0";
  }

  showQuizStartScreen(direction);
}

// ===============================
// LOCAL STORAGE
// ===============================

function loadWords() {
  const savedWords = localStorage.getItem(STORAGE_KEY);

  if (!savedWords) {
    words = [];
    return;
  }

  try {
    words = JSON.parse(savedWords);
  } catch (error) {
    words = [];
    showToast("Error while loading saved words");
  }
}

function saveWords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

function loadQuizCompletions() {
  const savedCompletions = localStorage.getItem(QUIZ_COMPLETIONS_KEY);

  if (!savedCompletions) {
    quizCompletions = {};
    return;
  }

  try {
    quizCompletions = JSON.parse(savedCompletions);
  } catch (error) {
    quizCompletions = {};
  }
}

function saveQuizCompletions() {
  localStorage.setItem(QUIZ_COMPLETIONS_KEY, JSON.stringify(quizCompletions));
}

function getQuizCompletionKey(direction, quizId) {
  return `${direction}:${quizId}`;
}

function getQuizCompletionCount(direction, quizId) {
  const key = getQuizCompletionKey(direction, quizId);
  return quizCompletions[key] || 0;
}

function registerQuizCompletion(direction, quizId) {
  const key = getQuizCompletionKey(direction, quizId);

  quizCompletions[key] = getQuizCompletionCount(direction, quizId) + 1;
  saveQuizCompletions();
}

function getQuizPackages() {
  const packages = [];

  for (let startIndex = 0; startIndex < words.length; startIndex += QUIZ_PACKAGE_SIZE) {
    const endIndex = Math.min(startIndex + QUIZ_PACKAGE_SIZE, words.length);
    const packageNumber = Math.floor(startIndex / QUIZ_PACKAGE_SIZE) + 1;

    packages.push({
      id: `package-${packageNumber}`,
      name: `Quiz ${packageNumber}`,
      words: words.slice(startIndex, endIndex),
      startWordNumber: startIndex + 1,
      endWordNumber: endIndex,
      isGeneral: false
    });
  }

  if (words.length > 0) {
    packages.push({
      id: "general",
      name: "General Quiz",
      words: [...words],
      startWordNumber: 1,
      endWordNumber: words.length,
      isGeneral: true
    });
  }

  return packages;
}

// ===============================
// TABS
// ===============================

function setupMainTabs() {
  const mainTabButtons = document.querySelectorAll("[data-main-tab]");
  const vocabularySection = document.getElementById("vocabulary-section");
  const quizSection = document.getElementById("quiz-section");

  mainTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      mainTabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const selectedTab = button.dataset.mainTab;

      vocabularySection.classList.remove("active");
      quizSection.classList.remove("active");

      if (selectedTab === "vocabulary") {
        vocabularySection.classList.add("active");
      }

      if (selectedTab === "quiz") {
        quizSection.classList.add("active");
      }
    });
  });
}

function setupVocabularySubTabs() {
  const vocabularyTabButtons = document.querySelectorAll("[data-vocabulary-tab]");
  const wordListPanel = document.getElementById("word-list-panel");
  const addWordPanel = document.getElementById("add-word-panel");
  const backupPanel = document.getElementById("backup-panel");

  vocabularyTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedTab = button.dataset.vocabularyTab;
      const wasAlreadyActive = button.classList.contains("active");

      if (wasAlreadyActive) {
        if (selectedTab === "list") {
          scrollWordListToTop();
        }

        return;
      }

      vocabularyTabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      wordListPanel.classList.remove("active");
      addWordPanel.classList.remove("active");
      backupPanel.classList.remove("active");

      if (selectedTab === "list") {
        wordListPanel.classList.add("active");
      }

      if (selectedTab === "add") {
        addWordPanel.classList.add("active");
      }

      if (selectedTab === "backup") {
        backupPanel.classList.add("active");
      }
    });
  });
}

function scrollWordListToTop() {
  const wordListPanel = document.getElementById("word-list-panel");

  if (!wordListPanel) {
    return;
  }

  wordListPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function setupQuizSubTabs() {
  const quizTabButtons = document.querySelectorAll("[data-quiz-tab]");
  const engItaPanel = document.getElementById("quiz-eng-ita-panel");
  const itaEngPanel = document.getElementById("quiz-ita-eng-panel");

  quizTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      quizTabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const selectedTab = button.dataset.quizTab;

      engItaPanel.classList.remove("active");
      itaEngPanel.classList.remove("active");

      if (selectedTab === "eng-ita") {
        engItaPanel.classList.add("active");
      }

      if (selectedTab === "ita-eng") {
        itaEngPanel.classList.add("active");
      }
    });
  });
}

// ===============================
// VOCABULARY
// ===============================

function renderWordList() {
  const wordList = document.getElementById("word-list");
  const emptyListMessage = document.getElementById("empty-list-message");
  const wordCount = document.getElementById("word-count");

  wordList.innerHTML = "";
  wordCount.textContent = words.length;
  renderSharedTranslations();

  const filteredWords = words
    .map((word, originalIndex) => {
      return {
        ...word,
        originalIndex: originalIndex
      };
    })
    .reverse()
    .filter((word) => {
      if (!wordSearchQuery) {
        return true;
      }

      return normalizeText(word.english).includes(normalizeText(wordSearchQuery));
    });

  if (words.length === 0) {
    emptyListMessage.classList.remove("hidden");
    emptyListMessage.innerHTML = `
      <div class="empty-icon">📘</div>
      <h3>No words yet</h3>
      <p>Add your first word to start training.</p>
    `;
    return;
  }

  if (filteredWords.length === 0) {
    emptyListMessage.classList.remove("hidden");
    emptyListMessage.innerHTML = `
      <div class="empty-icon">🔎</div>
      <h3>No results</h3>
      <p>No English word matches your search.</p>
    `;
    return;
  }

  emptyListMessage.classList.add("hidden");

  filteredWords.forEach((word) => {
    const card = document.createElement("div");
    card.className = "word-card";

    card.innerHTML = `
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
    `;

    wordList.appendChild(card);
  });

  const deleteButtons = document.querySelectorAll("[data-delete-index]");

  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.deleteIndex);
      deleteWord(index);
    });
  });

  const editButtons = document.querySelectorAll("[data-edit-index]");

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.editIndex);
      editWord(index);
    });
  });
}

function addWord() {
  const englishInput = document.getElementById("english-input");
  const italianInput = document.getElementById("italian-input");

  const english = englishInput.value.trim();
  const italian = italianInput.value.trim();

  if (!english || !italian) {
    showToast("Please fill both fields");
    return;
  }

  const alreadyExists = words.some((word) => {
    return normalizeText(word.english) === normalizeText(english);
  });

  if (alreadyExists) {
    showToast("This English word already exists");
    return;
  }

  words.push({
    english: english,
    italian: italian
  });

  saveWords();
  renderWordList();

  englishInput.value = "";
  italianInput.value = "";

  showToast("Word saved successfully");
}

function deleteWord(index) {
  words.splice(index, 1);
  saveWords();
  renderWordList();

  showToast("Word deleted");
}

function editWord(index) {
  const currentWord = words[index];

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

  const duplicateExists = words.some((word, wordIndex) => {
    const sameIndex = wordIndex === index;

    const sameEnglish =
      normalizeText(word.english) === normalizeText(cleanEnglish);

    const sameItalian =
      normalizeText(word.italian) === normalizeText(cleanItalian);

    return !sameIndex && sameEnglish && sameItalian;
  });

  if (duplicateExists) {
    showToast("This word pair already exists");
    return;
  }

  words[index] = {
    english: cleanEnglish,
    italian: cleanItalian
  };

  saveWords();
  renderWordList();

  showToast("Word updated");
}

function clearInputs() {
  document.getElementById("english-input").value = "";
  document.getElementById("italian-input").value = "";
}

function updateDictionaryAvailability() {
  const button = document.getElementById("open-wordreference-button");
  const offlineMessage = document.getElementById("dictionary-offline-message");

  if (!button || !offlineMessage) {
    return;
  }

  if (navigator.onLine) {
    button.disabled = false;
    button.classList.remove("dictionary-button-disabled");
    offlineMessage.classList.add("hidden");
  } else {
    button.disabled = true;
    button.classList.add("dictionary-button-disabled");
    offlineMessage.classList.remove("hidden");
  }
}

function openWordReference() {
  const englishInput = document.getElementById("english-input");
  const englishWord = englishInput.value.trim();

  if (!navigator.onLine) {
    showToast("Translation suggestions unavailable while offline");
    updateDictionaryAvailability();
    return;
  }

  if (!englishWord) {
    showToast("Insert an English word first");
    return;
  }

  const encodedWord = encodeURIComponent(englishWord);
  const wordReferenceUrl = `https://www.wordreference.com/enit/${encodedWord}`;

  window.open(wordReferenceUrl, "_blank", "noopener,noreferrer");
}

function exportWords() {
  if (words.length === 0) {
    showToast("No words to export");
    return;
  }

  const backup = {
    app: "Vocabulary Trainer",
    version: 1,
    exportedAt: new Date().toISOString(),
    words: words
  };

  const jsonContent = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });

  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().slice(0, 10);
  const fileName = `vocabulary-backup-${date}.json`;

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  showToast("Backup exported");
}

function chooseImportFile() {
  const fileInput = document.getElementById("import-file-input");

  if (!fileInput) {
    showToast("Import input not found");
    return;
  }

  fileInput.click();
}

function importWordsFromFile(event) {
  console.log("Import function started");

  const file = event.target.files[0];

  if (!file) {
    showToast("No file selected");
    console.log("No file selected");
    return;
  }

  console.log("Selected file:", file.name);

  const reader = new FileReader();

  reader.onload = function () {
    console.log("File loaded");

    try {
      const importedData = JSON.parse(reader.result);
      console.log("Parsed JSON:", importedData);

      let importedWords = [];

      if (Array.isArray(importedData)) {
        importedWords = importedData;
      } else if (importedData && Array.isArray(importedData.words)) {
        importedWords = importedData.words;
      } else {
        showToast("Invalid JSON format");
        console.log("Invalid JSON format");
        return;
      }

      let addedCount = 0;
      let skippedCount = 0;

      importedWords.forEach((item) => {
        if (!item || !item.english || !item.italian) {
          skippedCount += 1;
          return;
        }

        const english = String(item.english).trim();
        const italian = String(item.italian).trim();

        const alreadyExists = words.some((word) => {
          return (
            normalizeText(word.english) === normalizeText(english) &&
            normalizeText(word.italian) === normalizeText(italian)
          );
        });

        if (alreadyExists) {
          skippedCount += 1;
          return;
        }

        words.push({
          english: english,
          italian: italian
        });

        addedCount += 1;
      });

      saveWords();
      renderWordList();

      showToast(`Imported ${addedCount} words, skipped ${skippedCount}`);

      console.log("Import completed");
      console.log("Added:", addedCount);
      console.log("Skipped:", skippedCount);
    } catch (error) {
      console.error("Import error:", error);
      showToast("Error while reading JSON file");
    }

    event.target.value = "";
  };

  reader.onerror = function () {
    console.error("FileReader error");
    showToast("Error while opening file");
  };

  reader.readAsText(file);
}

// This avoids problems if a user writes special HTML characters
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ===============================
// QUIZ - GENERAL LOGIC
// ===============================

function startQuiz(direction, selectedQuizId) {
  const selectedPackage = getQuizPackages().find((quizPackage) => {
    return quizPackage.id === selectedQuizId;
  });

  if (!selectedPackage || selectedPackage.words.length === 0) {
    showToast("No words available for this quiz");
    return;
  }

  const quiz = direction === "eng-ita" ? engItaQuiz : itaEngQuiz;

  quiz.queue = shuffleArray(selectedPackage.words);
  quiz.currentIndex = 0;
  quiz.score = 0;
  quiz.answered = false;
  quiz.mistakes = [];
  quiz.selectedQuizId = selectedPackage.id;
  quiz.selectedQuizName = selectedPackage.name;
  quiz.completionRegistered = false;

  showQuizActiveScreen(direction);
  updateQuizScreen(direction);
}

function getCurrentQuizWord(quiz) {
  return quiz.queue[quiz.currentIndex];
}

function updateQuizScreen(direction) {
  const quiz = direction === "eng-ita" ? engItaQuiz : itaEngQuiz;

  const questionElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-question" : "ita-eng-question"
  );

  const answerInput = document.getElementById(
    direction === "eng-ita" ? "eng-ita-answer" : "ita-eng-answer"
  );

  const feedbackElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-feedback" : "ita-eng-feedback"
  );

  const startButton = document.getElementById(
    direction === "eng-ita" ? "start-eng-ita-button" : "start-ita-eng-button"
  );

  const checkButton = document.getElementById(
    direction === "eng-ita" ? "check-eng-ita-button" : "check-ita-eng-button"
  );

  const nextButton = document.getElementById(
    direction === "eng-ita" ? "next-eng-ita-button" : "next-ita-eng-button"
  );

  const restartButton = document.getElementById(
    direction === "eng-ita" ? "restart-eng-ita-button" : "restart-ita-eng-button"
  );

  const endButton = document.getElementById(
    direction === "eng-ita" ? "end-eng-ita-button" : "end-ita-eng-button"
  );

  const progressElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-progress" : "ita-eng-progress"
  );

  if (quiz.queue.length === 0) {
    questionElement.textContent = "No words available";
    progressElement.textContent = "Score: 0 / 0";
    return;
  }

  const mistakesButton = document.getElementById(
    direction === "eng-ita" ? "view-eng-ita-mistakes-button" : "view-ita-eng-mistakes-button"
  );

  const mistakesElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-mistakes" : "ita-eng-mistakes"
  );

  const currentWord = getCurrentQuizWord(quiz);

  if (direction === "eng-ita") {
    questionElement.textContent = currentWord.english;
  } else {
    questionElement.textContent = currentWord.italian;
  }

  answerInput.value = "";
  answerInput.disabled = false;

  feedbackElement.className = "feedback-card hidden";
  feedbackElement.innerHTML = "";

  checkButton.classList.remove("hidden");
  nextButton.classList.add("hidden");

  if (restartButton) {
    restartButton.classList.add("hidden");
  }

  if (endButton) {
    endButton.classList.remove("hidden");
  }

  if (mistakesButton) {
    mistakesButton.classList.add("hidden");
  }

  if (mistakesElement) {
    mistakesElement.classList.add("hidden");
    mistakesElement.innerHTML = "";
  }

  progressElement.textContent = `Score: ${quiz.score} / ${quiz.currentIndex}`;
}

function checkAnswer(direction) {
  const quiz = direction === "eng-ita" ? engItaQuiz : itaEngQuiz;

  if (quiz.queue.length === 0) {
    showToast("Start the quiz first");
    return;
  }

  if (quiz.answered) {
    return;
  }

  const currentWord = getCurrentQuizWord(quiz);

  const answerInput = document.getElementById(
    direction === "eng-ita" ? "eng-ita-answer" : "ita-eng-answer"
  );

  const feedbackElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-feedback" : "ita-eng-feedback"
  );

  const checkButton = document.getElementById(
    direction === "eng-ita" ? "check-eng-ita-button" : "check-ita-eng-button"
  );

  const nextButton = document.getElementById(
    direction === "eng-ita" ? "next-eng-ita-button" : "next-ita-eng-button"
  );

  const endButton = document.getElementById(
    direction === "eng-ita" ? "end-eng-ita-button" : "end-ita-eng-button"
  );

  const progressElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-progress" : "ita-eng-progress"
  );

  const rawUserAnswer = answerInput.value.trim();

  const rawCorrectAnswer =
    direction === "eng-ita"
      ? currentWord.italian
      : currentWord.english;

  const userAnswer = normalizeText(rawUserAnswer);
  const correctAnswer = normalizeText(rawCorrectAnswer);

  if (!userAnswer) {
    showToast("Write an answer first");
    return;
  }

  let isCorrect = false;

  if (direction === "eng-ita") {
    isCorrect = isFlexibleAnswerCorrect(rawUserAnswer, rawCorrectAnswer);
  } else {
    isCorrect = userAnswer === correctAnswer;
  }

  if (isCorrect) {
    quiz.score += 1;

    feedbackElement.className = "feedback-card feedback-correct";
    feedbackElement.innerHTML = `
      ✅ Correct!<br>
      <strong>${escapeHtml(getQuestionText(direction, currentWord))}</strong>
      =
      <strong>${escapeHtml(getCorrectAnswerText(direction, currentWord))}</strong>
    `;
  } else {
    quiz.mistakes.push({
      english: currentWord.english,
      italian: currentWord.italian,
      yourAnswer: answerInput.value.trim()
    });

    feedbackElement.className = "feedback-card feedback-wrong";
    feedbackElement.innerHTML = `
      ❌ Not quite<br>
      Correct answer:
      <strong>${escapeHtml(getCorrectAnswerText(direction, currentWord))}</strong><br>
      Your answer:
      <strong>${escapeHtml(answerInput.value.trim())}</strong>
    `;
  }

  quiz.answered = true;
  answerInput.disabled = true;

  checkButton.classList.add("hidden");
  nextButton.classList.remove("hidden");

  progressElement.textContent = `Score: ${quiz.score} / ${quiz.currentIndex + 1}`;
}

function nextQuestion(direction) {
  const quiz = direction === "eng-ita" ? engItaQuiz : itaEngQuiz;

  quiz.currentIndex += 1;
  quiz.answered = false;

  if (quiz.currentIndex >= quiz.queue.length) {
    finishQuiz(direction, true);
    return;
  }

  updateQuizScreen(direction);
}

function endQuiz(direction) {
  const quiz = direction === "eng-ita" ? engItaQuiz : itaEngQuiz;

  if (quiz.queue.length === 0) {
    showToast("Start the quiz first");
    return;
  }

  const answeredQuestions = quiz.answered
    ? quiz.currentIndex + 1
    : quiz.currentIndex;

  quiz.queue = quiz.queue.slice(0, Math.max(answeredQuestions, 0));

  finishQuiz(direction, false);
}

function finishQuiz(direction, completedNaturally) {
  const quiz = direction === "eng-ita" ? engItaQuiz : itaEngQuiz;

  const questionElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-question" : "ita-eng-question"
  );

  const answerInput = document.getElementById(
    direction === "eng-ita" ? "eng-ita-answer" : "ita-eng-answer"
  );

  const feedbackElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-feedback" : "ita-eng-feedback"
  );

  const checkButton = document.getElementById(
    direction === "eng-ita" ? "check-eng-ita-button" : "check-ita-eng-button"
  );

  const nextButton = document.getElementById(
    direction === "eng-ita" ? "next-eng-ita-button" : "next-ita-eng-button"
  );

  const restartButton = document.getElementById(
    direction === "eng-ita" ? "restart-eng-ita-button" : "restart-ita-eng-button"
  );

  const endButton = document.getElementById(
    direction === "eng-ita" ? "end-eng-ita-button" : "end-ita-eng-button"
  );

  const mistakesButton = document.getElementById(
    direction === "eng-ita" ? "view-eng-ita-mistakes-button" : "view-ita-eng-mistakes-button"
  );

  const mistakesElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-mistakes" : "ita-eng-mistakes"
  );

  const progressElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-progress" : "ita-eng-progress"
  );

  if (completedNaturally && quiz.selectedQuizId && !quiz.completionRegistered) {
    registerQuizCompletion(direction, quiz.selectedQuizId);
    quiz.completionRegistered = true;
  }

  const completionCount = quiz.selectedQuizId
    ? getQuizCompletionCount(direction, quiz.selectedQuizId)
    : 0;

  questionElement.textContent = completedNaturally ? "Quiz completed" : "Quiz ended";

  answerInput.value = "";
  answerInput.disabled = true;

  feedbackElement.className = "feedback-card feedback-correct";
  feedbackElement.innerHTML = `
    ${completedNaturally ? "🎉 Final score:" : "Current score:"}<br>
    <strong>${quiz.score} / ${quiz.queue.length}</strong>
    ${
      completedNaturally
        ? `<br><br>${escapeHtml(quiz.selectedQuizName)} completed: <strong>${completionCount} ${completionCount === 1 ? "time" : "times"}</strong>`
        : ""
    }
  `;

  checkButton.classList.add("hidden");
  nextButton.classList.add("hidden");

  if (restartButton) {
    restartButton.classList.remove("hidden");
  }

  if (endButton) {
    endButton.classList.add("hidden");
  }

  if (mistakesButton) {
    mistakesButton.classList.remove("hidden");
  }

  if (mistakesElement) {
    mistakesElement.classList.add("hidden");
    mistakesElement.innerHTML = "";
  }

  progressElement.textContent = completedNaturally
    ? `Final score: ${quiz.score} / ${quiz.queue.length}`
    : `Score when ended: ${quiz.score} / ${quiz.queue.length}`;

  showToast(completedNaturally ? "Quiz completed" : "Quiz ended");
}

function toggleMistakes(direction) {
  const quiz = direction === "eng-ita" ? engItaQuiz : itaEngQuiz;

  const mistakesElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-mistakes" : "ita-eng-mistakes"
  );

  if (!mistakesElement) {
    return;
  }

  if (!mistakesElement.classList.contains("hidden")) {
    mistakesElement.classList.add("hidden");
    return;
  }

  if (quiz.mistakes.length === 0) {
    mistakesElement.innerHTML = `
      <div class="mistakes-empty">
        No mistakes. Perfect quiz 🎉
      </div>
    `;
  } else {
    mistakesElement.innerHTML = quiz.mistakes
      .map((word) => {
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
      })
      .join("");
  }

  mistakesElement.classList.remove("hidden");
}

function getQuestionText(direction, word) {
  return direction === "eng-ita" ? word.english : word.italian;
}

function getCorrectAnswerText(direction, word) {
  return direction === "eng-ita" ? word.italian : word.english;
}

// ===============================
// EVENTS
// ===============================

function setupEvents() {
  document.getElementById("save-word-button").addEventListener("click", addWord);
  document.getElementById("clear-inputs-button").addEventListener("click", clearInputs);

  document.getElementById("open-wordreference-button").addEventListener("click", openWordReference);

  window.addEventListener("online", updateDictionaryAvailability);
  window.addEventListener("offline", updateDictionaryAvailability);

  document.getElementById("export-words-button").addEventListener("click", exportWords);

  document.getElementById("import-file-input").addEventListener("change", importWordsFromFile);

  document.getElementById("word-search-input").addEventListener("input", (event) => {
    wordSearchQuery = event.target.value;
    renderWordList();
  });

  document.getElementById("toggle-shared-translations-button").addEventListener("click", () => {
    toggleSharedTranslations();
  });

  document.getElementById("import-file-input").addEventListener("change", () => {
    console.log("IMPORT EVENT TRIGGERED");
  });

  document.getElementById("english-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      document.getElementById("italian-input").focus();
    }
  });

  document.getElementById("italian-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addWord();
    }
  });

  document.getElementById("start-eng-ita-button").addEventListener("click", () => {
    openQuizSelection("eng-ita");
  });

  document.getElementById("back-eng-ita-start-button").addEventListener("click", () => {
    showQuizStartScreen("eng-ita");
  });

  document.getElementById("check-eng-ita-button").addEventListener("click", () => {
    checkAnswer("eng-ita");
  });

  document.getElementById("next-eng-ita-button").addEventListener("click", () => {
    nextQuestion("eng-ita");
  });

  document.getElementById("eng-ita-answer").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      if (!engItaQuiz.answered) {
        checkAnswer("eng-ita");
      } else {
        nextQuestion("eng-ita");
      }
    }
  });

  document.getElementById("view-eng-ita-mistakes-button").addEventListener("click", () => {
    toggleMistakes("eng-ita");
  });

  document.getElementById("restart-eng-ita-button").addEventListener("click", () => {
    resetQuizToStart("eng-ita");
  });

  document.getElementById("end-eng-ita-button").addEventListener("click", () => {
    endQuiz("eng-ita");
  });

  document.getElementById("start-ita-eng-button").addEventListener("click", () => {
    openQuizSelection("ita-eng");
  });

  document.getElementById("back-ita-eng-start-button").addEventListener("click", () => {
    showQuizStartScreen("ita-eng");
  });

  document.getElementById("check-ita-eng-button").addEventListener("click", () => {
    checkAnswer("ita-eng");
  });

  document.getElementById("next-ita-eng-button").addEventListener("click", () => {
    nextQuestion("ita-eng");
  });

  document.getElementById("ita-eng-answer").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      if (!itaEngQuiz.answered) {
        checkAnswer("ita-eng");
      } else {
        nextQuestion("ita-eng");
      }
    }
  });

  document.getElementById("view-ita-eng-mistakes-button").addEventListener("click", () => {
    toggleMistakes("ita-eng");
  });

  document.getElementById("restart-ita-eng-button").addEventListener("click", () => {
    resetQuizToStart("ita-eng");
  });

  document.getElementById("end-ita-eng-button").addEventListener("click", () => {
    endQuiz("ita-eng");
  });

}

// ===============================
// APP INITIALIZATION
// ===============================

function initApp() {
  loadWords();
  loadQuizCompletions();

  setupMainTabs();
  setupVocabularySubTabs();
  setupQuizSubTabs();
  setupEvents();

  renderWordList();
  updateDictionaryAvailability();
}

initApp();