// ===============================
// LOCAL STORAGE HELPERS
// ===============================

// Returns the parsed value, the fallback when nothing is saved,
// and throws if the saved value is not valid JSON.
export function readJson(key, fallback) {
  const savedValue = localStorage.getItem(key);

  if (!savedValue) {
    return fallback;
  }

  return JSON.parse(savedValue);
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
