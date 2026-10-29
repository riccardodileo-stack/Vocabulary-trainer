// Pure text helpers shared by the word list, the quiz and the import.

export function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

/** "batteria / pila" -> ["batteria", "pila"] (the format used by the PWA). */
export function splitSlashOptions(text: string): string[] {
  return text
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * True if every option written by the user is one of the accepted answers.
 * "pila", "batteria" and "pila / batteria" are all correct for ["batteria", "pila"].
 */
export function isAnswerAccepted(userAnswer: string, acceptedAnswers: string[]): boolean {
  const userOptions = splitSlashOptions(userAnswer).map(normalizeText);
  const accepted = acceptedAnswers.map(normalizeText);

  if (userOptions.length === 0 || accepted.length === 0) {
    return false;
  }

  return userOptions.every((option) => accepted.includes(option));
}
