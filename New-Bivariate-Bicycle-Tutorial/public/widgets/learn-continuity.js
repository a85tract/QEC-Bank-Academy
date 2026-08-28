/* Shared continuity for Learn v2 routes and their Reference pages. */
const AtlasLearnContinuity = (() => {
  "use strict";

  const body = document.body;
  const params = new URLSearchParams(window.location.search);
  const landing = document.querySelector("[data-learn-entry]");
  const entry = body?.dataset.learnEntry
    || landing?.dataset.learnEntry
    || params.get("learn_entry")
    || "";
  const version = body?.dataset.learnVersion
    || landing?.dataset.learnVersion
    || params.get("learn_version")
    || "1";
  const storageKey = entry ? `qec-atlas:learn:${entry}:v${version}` : "";

  function load() {
    if (!storageKey) return null;
    try {
      const value = JSON.parse(window.localStorage.getItem(storageKey));
      return value && typeof value === "object" ? value : null;
    } catch (_error) {
      return null;
    }
  }

  function save(value) {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({
        ...value,
        entry,
        version,
        updatedAt: new Date().toISOString(),
      }));
    } catch (_error) {
      // Learn remains fully usable when storage is unavailable.
    }
  }

  function clear() {
    if (!storageKey) return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch (_error) {
      // A blocked storage backend should not block a manual restart.
    }
  }

  function rootPath() {
    const marker = "/entries/";
    const index = window.location.pathname.indexOf(marker);
    if (index >= 0) return window.location.pathname.slice(0, index + 1);
    const tourMarker = "/tours/";
    const tourIndex = window.location.pathname.indexOf(tourMarker);
    if (tourIndex >= 0) return window.location.pathname.slice(0, tourIndex + 1);
    return "/";
  }

  function learnHref(stepId = null) {
    const suffix = stepId ? `#step=${encodeURIComponent(stepId)}` : "";
    return `${rootPath()}tours/${encodeURIComponent(entry)}.html${suffix}`;
  }

  function referenceHref(href, stepId) {
    const target = new URL(href, window.location.href);
    target.searchParams.set("from", "learn");
    target.searchParams.set("learn_entry", entry);
    target.searchParams.set("learn_version", version);
    if (stepId) target.searchParams.set("learn_step", stepId);
    return `${target.pathname}${target.search}${target.hash}`;
  }

  function initialiseLanding() {
    const start = document.querySelector("[data-learn-start]");
    const resume = document.querySelector("[data-learn-resume]");
    const restart = document.querySelector("[data-learn-start-over]");
    if (!start || !resume || !restart) return;
    const stored = load();
    if (stored?.stepId) {
      resume.href = learnHref(stored.stepId);
      resume.textContent = stored.finished ? "Review completed tutorial" : "Resume learning";
      resume.hidden = false;
      restart.hidden = false;
      start.textContent = "Review from the beginning";
    }
    restart.addEventListener("click", () => {
      clear();
      window.location.assign(start.href);
    });
  }

  function initialiseReferenceReturn() {
    if (params.get("from") !== "learn") return;
    const returnLink = document.querySelector("[data-learn-return]");
    if (!returnLink || !entry) return;
    const stored = load();
    const stepId = params.get("learn_step") || stored?.stepId || null;
    returnLink.href = learnHref(stepId);
    returnLink.textContent = stepId
      ? "← Return to the same Learn step"
      : "← Return to Learn";
    returnLink.hidden = false;
  }

  initialiseLanding();
  initialiseReferenceReturn();

  return {
    clear,
    entry,
    learnHref,
    load,
    referenceHref,
    save,
    storageKey,
    version,
  };
})();
