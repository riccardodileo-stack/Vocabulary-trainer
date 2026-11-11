// ===============================
// STICKY SUB-TABS APPEARANCE
// ===============================

export function updateStickyTabsAppearance() {
  const visibleSection = document.querySelector(".section.active");

  document.querySelectorAll(".sub-tabs").forEach((tabs) => {
    tabs.classList.remove("is-stuck");
  });

  document.body.classList.remove("sticky-menu-active");

  if (!visibleSection) {
    return;
  }

  const visibleTabs = visibleSection.querySelector(".sub-tabs");

  if (!visibleTabs) {
    return;
  }

  const stickyTop = parseFloat(getComputedStyle(visibleTabs).top) || 0;
  const currentTop = visibleTabs.getBoundingClientRect().top;

  const isStuck = currentTop <= stickyTop + 1 && window.scrollY > 120;

  if (isStuck) {
    visibleTabs.classList.add("is-stuck");
    document.body.classList.add("sticky-menu-active");
  }
}

export function setupStickyTabsAppearance() {
  window.addEventListener("scroll", updateStickyTabsAppearance, {
    passive: true
  });

  window.addEventListener("resize", updateStickyTabsAppearance);

  updateStickyTabsAppearance();
}
