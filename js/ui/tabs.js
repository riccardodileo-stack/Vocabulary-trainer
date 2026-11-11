// ===============================
// TABS
// ===============================

import { updateStickyTabsAppearance } from "./stickyTabs.js";

// Generic tab group: buttons carry data-<attribute>="<key>",
// panels maps each key to the id of the element to show.
function setupTabGroup({ attribute, panels, onReselect, onChange }) {
  const buttons = document.querySelectorAll(`[data-${attribute}]`);

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedTab = button.getAttribute(`data-${attribute}`);

      if (button.classList.contains("active")) {
        onReselect?.(selectedTab);
        return;
      }

      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      Object.entries(panels).forEach(([tab, panelId]) => {
        document.getElementById(panelId).classList.toggle("active", tab === selectedTab);
      });

      onChange?.(selectedTab);
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

export function setupTabs() {
  setupTabGroup({
    attribute: "main-tab",
    panels: {
      vocabulary: "vocabulary-section",
      quiz: "quiz-section"
    },
    onChange: () => requestAnimationFrame(updateStickyTabsAppearance)
  });

  setupTabGroup({
    attribute: "vocabulary-tab",
    panels: {
      list: "word-list-panel",
      add: "add-word-panel",
      backup: "backup-panel"
    },
    onReselect: (tab) => {
      if (tab === "list") {
        scrollWordListToTop();
      }
    }
  });

  setupTabGroup({
    attribute: "quiz-tab",
    panels: {
      "eng-ita": "quiz-eng-ita-panel",
      "ita-eng": "quiz-ita-eng-panel"
    }
  });
}
