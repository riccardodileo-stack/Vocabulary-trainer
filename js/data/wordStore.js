// ===============================
// WORD STORE
// ===============================
// Single source of truth for the vocabulary list.
// Every change is saved and then announced to the listeners
// registered with onWordsChange (e.g. the word list renderer).

import { WORDS_STORAGE_KEY } from "../config.js";
import { normalizeText } from "../utils/text.js";
import { readJson, writeJson } from "./storage.js";

let words = [];
const listeners = [];

// Returns false if the saved data could not be read
export function loadWords() {
  try {
    words = readJson(WORDS_STORAGE_KEY, []);
    return true;
  } catch (error) {
    words = [];
    return false;
  }
}

export function getWords() {
  return words;
}

export function getWord(index) {
  return words[index];
}

export function onWordsChange(listener) {
  listeners.push(listener);
}

function commit() {
  writeJson(WORDS_STORAGE_KEY, words);
  listeners.forEach((listener) => listener());
}

export function addWord(english, italian) {
  words.push({ english, italian });
  commit();
}

// Adds several words with a single save (used by the import)
export function addWords(newWords) {
  newWords.forEach(({ english, italian }) => {
    words.push({ english, italian });
  });
  commit();
}

export function updateWord(index, english, italian) {
  words[index] = { english, italian };
  commit();
}

export function removeWord(index) {
  words.splice(index, 1);
  commit();
}

// ===============================
// DUPLICATE CHECKS
// ===============================

export function englishWordExists(english) {
  return words.some((word) => {
    return normalizeText(word.english) === normalizeText(english);
  });
}

export function wordPairExists(english, italian, ignoredIndex = -1) {
  return words.some((word, wordIndex) => {
    return (
      wordIndex !== ignoredIndex &&
      normalizeText(word.english) === normalizeText(english) &&
      normalizeText(word.italian) === normalizeText(italian)
    );
  });
}
