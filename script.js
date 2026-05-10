// ===============================
// VOCABULARY TRAINER - SCRIPT
// ===============================

// Key used to save words inside the browser
const STORAGE_KEY = "vocabularyTrainerWords";

// Main data
let words = [];

// Quiz states
let engItaQuiz = {
  direction: "eng-ita",
  queue: [],
  currentIndex: 0,
  score: 0,
  answered: false
};

let itaEngQuiz = {
  direction: "ita-eng",
  queue: [],
  currentIndex: 0,
  score: 0,
  answered: false
};

// ===============================
// BASIC UTILITIES
// ===============================

function normalizeText(text) {
  return text.trim().toLowerCase();
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

  vocabularyTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      vocabularyTabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const selectedTab = button.dataset.vocabularyTab;

      wordListPanel.classList.remove("active");
      addWordPanel.classList.remove("active");

      if (selectedTab === "list") {
        wordListPanel.classList.add("active");
      }

      if (selectedTab === "add") {
        addWordPanel.classList.add("active");
        document.getElementById("english-input").focus();
      }
    });
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

  if (words.length === 0) {
    emptyListMessage.classList.remove("hidden");
    return;
  }

  emptyListMessage.classList.add("hidden");

  words.forEach((word, index) => {
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

      <button class="danger delete-button" data-delete-index="${index}">
        Delete
      </button>
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
  englishInput.focus();

  showToast("Word saved successfully");
}

function deleteWord(index) {
  words.splice(index, 1);
  saveWords();
  renderWordList();

  showToast("Word deleted");
}

function clearInputs() {
  document.getElementById("english-input").value = "";
  document.getElementById("italian-input").value = "";
  document.getElementById("english-input").focus();
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

function startQuiz(direction) {
  if (words.length === 0) {
    showToast("Add at least one word before starting a quiz");
    return;
  }

  const quiz = direction === "eng-ita" ? engItaQuiz : itaEngQuiz;

  quiz.queue = shuffleArray(words);
  quiz.currentIndex = 0;
  quiz.score = 0;
  quiz.answered = false;

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

  const progressElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-progress" : "ita-eng-progress"
  );

  if (quiz.queue.length === 0) {
    questionElement.textContent = "No words available";
    progressElement.textContent = "Score: 0 / 0";
    return;
  }

  const currentWord = getCurrentQuizWord(quiz);

  if (direction === "eng-ita") {
    questionElement.textContent = currentWord.english;
  } else {
    questionElement.textContent = currentWord.italian;
  }

  answerInput.value = "";
  answerInput.disabled = false;
  answerInput.focus();

  feedbackElement.className = "feedback-card hidden";
  feedbackElement.innerHTML = "";

  startButton.classList.add("hidden");
  checkButton.classList.remove("hidden");
  nextButton.classList.add("hidden");

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

  const progressElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-progress" : "ita-eng-progress"
  );

  const userAnswer = normalizeText(answerInput.value);

  const correctAnswer =
    direction === "eng-ita"
      ? normalizeText(currentWord.italian)
      : normalizeText(currentWord.english);

  if (!userAnswer) {
    showToast("Write an answer first");
    return;
  }

  const isCorrect = userAnswer === correctAnswer;

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
    finishQuiz(direction);
    return;
  }

  updateQuizScreen(direction);
}

function finishQuiz(direction) {
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

  const progressElement = document.getElementById(
    direction === "eng-ita" ? "eng-ita-progress" : "ita-eng-progress"
  );

  questionElement.textContent = "Quiz completed";
  answerInput.value = "";
  answerInput.disabled = true;

  feedbackElement.className = "feedback-card feedback-correct";
  feedbackElement.innerHTML = `
    🎉 Final score:<br>
    <strong>${quiz.score} / ${quiz.queue.length}</strong>
  `;

  startButton.textContent = "Restart quiz";
  startButton.classList.remove("hidden");

  checkButton.classList.add("hidden");
  nextButton.classList.add("hidden");

  progressElement.textContent = `Final score: ${quiz.score} / ${quiz.queue.length}`;

  showToast("Quiz completed");
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
    startQuiz("eng-ita");
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

  document.getElementById("start-ita-eng-button").addEventListener("click", () => {
    startQuiz("ita-eng");
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
}

// ===============================
// APP INITIALIZATION
// ===============================

function initApp() {
  loadWords();

  setupMainTabs();
  setupVocabularySubTabs();
  setupQuizSubTabs();
  setupEvents();

  renderWordList();
}

initApp();