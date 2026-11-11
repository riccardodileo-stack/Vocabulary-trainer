// ===============================
// QUIZ PACKAGES
// ===============================
// Words are split into packages of QUIZ_PACKAGE_SIZE,
// plus a "General Quiz" containing every word.

import { QUIZ_PACKAGE_SIZE } from "../config.js";
import { getWords } from "../data/wordStore.js";

export function getQuizPackages() {
  const words = getWords();
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

export function getQuizPackage(quizId) {
  return getQuizPackages().find((quizPackage) => quizPackage.id === quizId);
}
