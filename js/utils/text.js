// ===============================
// TEXT UTILITIES
// ===============================

export function normalizeText(text) {
  return text.trim().toLowerCase();
}

export function splitAnswerOptions(text) {
  return text
    .split("/")
    .map((part) => normalizeText(part))
    .filter((part) => part.length > 0);
}

export function isFlexibleAnswerCorrect(userAnswer, correctAnswer) {
  const userOptions = splitAnswerOptions(userAnswer);
  const correctOptions = splitAnswerOptions(correctAnswer);

  if (userOptions.length === 0 || correctOptions.length === 0) {
    return false;
  }

  return userOptions.every((userOption) => {
    return correctOptions.includes(userOption);
  });
}

// This avoids problems if a user writes special HTML characters
export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function pluralizeTimes(count) {
  return count === 1 ? "1 time" : `${count} times`;
}
