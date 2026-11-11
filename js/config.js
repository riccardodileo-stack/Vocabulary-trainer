// ===============================
// APP CONFIGURATION
// ===============================

// Keys used to save data inside the browser
export const WORDS_STORAGE_KEY = "vocabularyTrainerWords";
export const QUIZ_COMPLETIONS_KEY = "vocabularyTrainerQuizCompletions";

export const QUIZ_PACKAGE_SIZE = 50;

// Each quiz direction describes which word field is asked and which is expected.
// To add a new direction, add an entry here and the matching HTML block
// (ids follow the pattern "<direction>-question", "check-<direction>-button", ...).
export const QUIZ_DIRECTIONS = {
  "eng-ita": {
    questionField: "english",
    answerField: "italian",
    // Accepts "a / b" answers when every option is a valid translation
    flexibleAnswers: true
  },
  "ita-eng": {
    questionField: "italian",
    answerField: "english",
    flexibleAnswers: false
  }
};

export const WORDREFERENCE_URL = "https://www.wordreference.com/enit/";
