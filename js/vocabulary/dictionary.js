// ===============================
// VOCABULARY - WORDREFERENCE LOOKUP
// ===============================

import { WORDREFERENCE_URL } from "../config.js";
import { showToast } from "../ui/toast.js";

export function updateDictionaryAvailability() {
  const button = document.getElementById("open-wordreference-button");
  const offlineMessage = document.getElementById("dictionary-offline-message");

  if (!button || !offlineMessage) {
    return;
  }

  const isOffline = !navigator.onLine;

  button.disabled = isOffline;
  button.classList.toggle("dictionary-button-disabled", isOffline);
  offlineMessage.classList.toggle("hidden", !isOffline);
}

function openWordReference() {
  const englishWord = document.getElementById("english-input").value.trim();

  if (!navigator.onLine) {
    showToast("Translation suggestions unavailable while offline");
    updateDictionaryAvailability();
    return;
  }

  if (!englishWord) {
    showToast("Insert an English word first");
    return;
  }

  const wordReferenceUrl = `${WORDREFERENCE_URL}${encodeURIComponent(englishWord)}`;

  window.open(wordReferenceUrl, "_blank", "noopener,noreferrer");
}

export function setupDictionary() {
  document.getElementById("open-wordreference-button").addEventListener("click", openWordReference);

  window.addEventListener("online", updateDictionaryAvailability);
  window.addEventListener("offline", updateDictionaryAvailability);

  updateDictionaryAvailability();
}
