/* Generic landing-page launcher for declarative Learn routes. */
const AtlasTutorialLauncher = (() => {
  "use strict";

  const keyFor = version => `qec-atlas-learn:${version}`;

  function readProgress(version, storage = window.localStorage) {
    try {
      const parsed = JSON.parse(storage.getItem(keyFor(version)) || "null");
      return parsed && parsed.version === version && parsed.chapter
        ? parsed
        : null;
    } catch (_error) {
      return null;
    }
  }

  function init(root = document) {
    const launcher = root.querySelector("[data-tutorial-launch]");
    if (!launcher) return;
    const version = launcher.dataset.tutorialStateVersion;
    const progress = readProgress(version);
    if (!progress) return;
    const resume = launcher.querySelector("[data-tutorial-resume]");
    const start = launcher.querySelector("[data-tutorial-start]");
    if (resume) resume.hidden = false;
    if (start) {
      start.textContent = "Start over";
      start.setAttribute("aria-label", "Start the tutorial over and clear saved progress");
      start.classList.remove("primary-action");
      start.classList.add("secondary-action");
    }
    if (resume) {
      resume.classList.add("primary-action");
    }
  }

  document.addEventListener("DOMContentLoaded", () => init());
  return {init, keyFor, readProgress};
})();
