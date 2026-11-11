// ===============================
// TOAST MESSAGE
// ===============================

const TOAST_DURATION_MS = 2200;

let hideTimeout = null;

export function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, TOAST_DURATION_MS);
}
