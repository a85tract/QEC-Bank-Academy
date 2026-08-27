/* learn-entry: generic landing/resume and Reference-return continuity hooks. */
const AtlasLearnEntry = (() => {
  "use strict";

  const CURRENT_PREFIX = "qec-atlas-learn-current:";

  function storageKey(entry, version) {
    return `qec-atlas-learn:${entry}:v${version}`;
  }

  function parseSnapshot(raw, entry = null, version = null) {
    if (!raw) return null;
    try {
      const snapshot = JSON.parse(raw);
      if (!snapshot || typeof snapshot !== "object") return null;
      if (entry !== null && snapshot.entry !== entry) return null;
      if (version !== null && snapshot.version !== version) return null;
      if (typeof snapshot.chapter !== "string" || typeof snapshot.step !== "string") {
        return null;
      }
      return snapshot;
    } catch (_error) {
      return null;
    }
  }

  function learnLocation(href, snapshot) {
    const url = new URL(href, window.location.href);
    if (snapshot) {
      const params = new URLSearchParams();
      params.set("chapter", snapshot.chapter);
      params.set("step", snapshot.step);
      url.hash = params.toString();
    }
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function entryFromLearnHref(href) {
    const url = new URL(href, window.location.href);
    const match = url.pathname.match(/\/learn\/([^/]+)\.html$/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function initLanding() {
    document.querySelectorAll("[data-learn-resume]").forEach(link => {
      const entry = link.dataset.learnEntry;
      const version = Number.parseInt(link.dataset.learnVersion, 10);
      const snapshot = parseSnapshot(
        sessionStorage.getItem(storageKey(entry, version)),
        entry,
        version
      );
      if (!snapshot) return;
      link.hidden = false;
      link.href = learnLocation(link.href, snapshot);
      link.setAttribute(
        "aria-label",
        `${link.textContent.trim()}; chapter ${snapshot.chapter}, step ${snapshot.step}`
      );
    });

    document.querySelectorAll("[data-learn-start]").forEach(link => {
      link.addEventListener("click", () => {
        const entry = link.dataset.learnEntry;
        const version = Number.parseInt(link.dataset.learnVersion, 10);
        sessionStorage.removeItem(storageKey(entry, version));
        sessionStorage.removeItem(`${CURRENT_PREFIX}${entry}`);
        const url = new URL(link.href, window.location.href);
        url.hash = "";
        link.href = `${url.pathname}${url.search}`;
      });
    });
  }

  function initReferenceReturn() {
    document.querySelectorAll("[data-learn-return]").forEach(link => {
      const entry = entryFromLearnHref(link.href);
      if (!entry) return;
      const snapshot = parseSnapshot(
        sessionStorage.getItem(`${CURRENT_PREFIX}${entry}`),
        entry
      );
      if (snapshot) link.href = learnLocation(link.href, snapshot);
    });
  }

  function init() {
    if (typeof sessionStorage === "undefined") return;
    initLanding();
    initReferenceReturn();
  }

  document.addEventListener("DOMContentLoaded", init);
  return {entryFromLearnHref, learnLocation, parseSnapshot, storageKey};
})();
