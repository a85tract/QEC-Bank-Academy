/* Generic Atlas Learn player. Entry narrative and cases stay declarative;
   formal feedback is recomputed from constructor-derived tutorial payloads. */
const AtlasTutorialPlayer = (() => {
  "use strict";

  if (typeof TUTORIAL_DATA === "undefined") return {init() {}};

  const tutorial = TUTORIAL_DATA.tutorial;
  const chapters = tutorial.chapters;
  const chapterIds = chapters.map(chapter => chapter.id);
  const capstoneChapter = chapters.find(chapter => chapter.lab.kind === "capstone") || null;
  const capstoneConfig = capstoneChapter?.lab || {};
  const capstoneStages = Array.isArray(capstoneConfig.stages)
    ? capstoneConfig.stages
    : [];
  const instances = TUTORIAL_DATA.instances;
  const presetById = Object.fromEntries(
    TUTORIAL_DATA.presets.map(preset => [preset.id, preset])
  );
  const storageKey = `qec-atlas-learn:${tutorial.state_version}`;
  const resetKey = `${storageKey}:reset`;
  let state;
  let restoreNotice = "";

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHTML = value => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  function safeStorage(storage = window.localStorage) {
    return {
      get(key) {
        try { return storage.getItem(key); } catch (_error) { return null; }
      },
      set(key, value) {
        try { storage.setItem(key, value); return true; } catch (_error) { return false; }
      },
      remove(key) {
        try { storage.removeItem(key); } catch (_error) { /* unavailable */ }
      },
    };
  }

  function activeResetId() {
    const storage = safeStorage();
    let value = storage.get(resetKey);
    if (!value) {
      value = `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      storage.set(resetKey, value);
    }
    return value;
  }

  function firstPresetFor(chapterId) {
    const chapter = chapters.find(candidate => candidate.id === chapterId);
    const presetId = chapter?.lab?.preset;
    return presetById[presetId] || TUTORIAL_DATA.presets[0];
  }

  function activeCapstoneStage() {
    return capstoneStages.find(stage => stage.id === state?.capstoneStage) || null;
  }

  function inCapstone() {
    return Boolean(capstoneChapter && state?.chapter === capstoneChapter.id);
  }

  function defaultState(resetId = activeResetId()) {
    const preset = firstPresetFor(chapterIds[0]);
    return {
      version: tutorial.state_version,
      resetId,
      chapter: chapterIds[0],
      completed: [],
      instance: preset.instance,
      preset: preset.id,
      errorType: preset.error_type,
      error: [...preset.error],
      recovery: [...preset.recovery],
      hideError: preset.hide_error,
      syndromeVisible: false,
      editMode: "error",
      selectedCheck: null,
      structureInstance: tutorial.instances[0].instance,
      structureMode: "lattice",
      structureFilter: "all",
      keyboardQubit: 0,
      circuitLayer: 0,
      circuitFixture: TUTORIAL_DATA.circuit?.fault_fixtures?.[0]?.id || null,
      circuitInjected: false,
      operationChoice: TUTORIAL_DATA.operation_choices[0]?.id || null,
      evidenceRegime: TUTORIAL_DATA.evidence_regimes[0]?.id || null,
      evidenceAnswer: null,
      capstoneStage: capstoneStages[0]?.id || null,
      capstone: Object.fromEntries(capstoneStages.map(stage => [stage.id, false])),
      view: {scrollY: 0, focus: null},
    };
  }

  function integerList(value, n) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter(item => Number.isInteger(item) && item >= 0 && item < n))]
      .sort((a, b) => a - b);
  }

  function normalizeState(candidate, resetId = activeResetId()) {
    if (
      !candidate
      || candidate.version !== tutorial.state_version
      || candidate.resetId !== resetId
    ) return null;
    const base = defaultState(resetId);
    const chapter = chapterIds.includes(candidate.chapter) ? candidate.chapter : base.chapter;
    const instance = instances[candidate.instance] ? candidate.instance : base.instance;
    const structureInstance = instances[candidate.structureInstance]
      ? candidate.structureInstance
      : base.structureInstance;
    const n = instances[instance].n;
    const normalized = {
      ...base,
      ...candidate,
      chapter,
      instance,
      structureInstance,
      completed: [...new Set(
        Array.isArray(candidate.completed)
          ? candidate.completed.filter(id => chapterIds.includes(id))
          : []
      )],
      errorType: candidate.errorType === "Z" ? "Z" : "X",
      error: integerList(candidate.error, n),
      recovery: integerList(candidate.recovery, n),
      hideError: Boolean(candidate.hideError),
      syndromeVisible: Boolean(candidate.syndromeVisible),
      editMode: candidate.editMode === "recovery" ? "recovery" : "error",
      selectedCheck: Number.isInteger(candidate.selectedCheck)
        ? candidate.selectedCheck
        : null,
      structureMode: candidate.structureMode === "logical" ? "logical" : "lattice",
      structureFilter: ["all", "X", "Z"].includes(candidate.structureFilter)
        ? candidate.structureFilter
        : "all",
      keyboardQubit: Number.isInteger(candidate.keyboardQubit)
        ? Math.max(0, Math.min(n - 1, candidate.keyboardQubit))
        : 0,
      circuitLayer: Math.max(
        0,
        Math.min(TUTORIAL_DATA.circuit?.cnot_layers?.length || 0, Number(candidate.circuitLayer) || 0)
      ),
      circuitFixture: TUTORIAL_DATA.circuit?.fault_fixtures?.some(
        fixture => fixture.id === candidate.circuitFixture
      ) ? candidate.circuitFixture : base.circuitFixture,
      circuitInjected: Boolean(candidate.circuitInjected),
      operationChoice: TUTORIAL_DATA.operation_choices.some(
        choice => choice.id === candidate.operationChoice
      ) ? candidate.operationChoice : base.operationChoice,
      evidenceRegime: TUTORIAL_DATA.evidence_regimes.some(
        regime => regime.id === candidate.evidenceRegime
      ) ? candidate.evidenceRegime : base.evidenceRegime,
      evidenceAnswer: tutorial.evidence_question.choices.some(
        choice => choice.id === candidate.evidenceAnswer
      ) ? candidate.evidenceAnswer : null,
      capstoneStage: capstoneStages.some(stage => stage.id === candidate.capstoneStage)
        ? candidate.capstoneStage
        : base.capstoneStage,
      capstone: Object.fromEntries(capstoneStages.map(
        stage => [stage.id, Boolean(candidate.capstone?.[stage.id])]
      )),
      view: {
        scrollY: Number.isFinite(candidate.view?.scrollY)
          ? Math.max(0, candidate.view.scrollY)
          : 0,
        focus: typeof candidate.view?.focus === "string" ? candidate.view.focus : null,
      },
    };
    return normalized;
  }

  function savedState() {
    try {
      return normalizeState(JSON.parse(safeStorage().get(storageKey) || "null"));
    } catch (_error) {
      return null;
    }
  }

  function hashChapter() {
    const raw = window.location.hash.replace(/^#(?:chapter-)?/, "");
    return chapterIds.includes(raw) ? raw : null;
  }

  function focusToken() {
    const active = document.activeElement;
    if (!active) return null;
    if (active.dataset?.action) return `[data-action="${active.dataset.action}"]`;
    if (active.dataset?.learnChapterButton) {
      return `[data-learn-chapter-button="${active.dataset.learnChapterButton}"]`;
    }
    return active.id ? `#${active.id}` : null;
  }

  function captureView() {
    state.view = {
      scrollY: Number(window.scrollY) || 0,
      focus: focusToken(),
    };
  }

  function stateUrl(chapter = state.chapter) {
    const url = new URL(window.location.href);
    url.searchParams.delete("start");
    url.searchParams.delete("resume");
    url.hash = chapter;
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function persist(
    mode = "replace",
    message = "Progress saved locally",
    {capture = true} = {},
  ) {
    if (capture) captureView();
    safeStorage().set(storageKey, JSON.stringify(state));
    const wrapped = {atlasTutorial: state};
    if (mode === "push") window.history.pushState(wrapped, "", stateUrl());
    else window.history.replaceState(wrapped, "", stateUrl());
    const status = $("[data-learn-save-status]");
    if (status) status.textContent = message;
  }

  function initialState() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("start") === "1") {
      const resetId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      safeStorage().set(resetKey, resetId);
      safeStorage().remove(storageKey);
      restoreNotice = "Started over with a clean tutorial state.";
      return defaultState(resetId);
    }
    const historyState = normalizeState(window.history.state?.atlasTutorial);
    const saved = savedState();
    let chosen = historyState || saved || defaultState();
    if (historyState) {
      restoreNotice = "Restored this saved history context.";
    }
    const requested = hashChapter();
    if (window.location.hash && !requested) {
      restoreNotice = "That lesson link is stale; restored the nearest valid tutorial context.";
    } else if (requested) {
      chosen = {...chosen, chapter: requested};
    } else if (params.get("resume") === "1" && saved) {
      chosen = saved;
      restoreNotice = "Resumed your saved tutorial context.";
    }
    return chosen;
  }

  function xorSupports(first, second) {
    const values = new Set(first);
    second.forEach(value => values.has(value) ? values.delete(value) : values.add(value));
    return [...values].sort((a, b) => a - b);
  }

  function syndromeFor(instance, errorType, support) {
    const selected = new Set(support);
    const opposite = errorType === "X" ? "Z" : "X";
    return instance.checks
      .filter(check => (
        check.type === opposite
        && check.support.filter(qubit => selected.has(qubit)).length % 2 === 1
      ))
      .map(check => check.row_index);
  }

  function classify(instance, errorType, error, recovery) {
    const residual = xorSupports(error, recovery);
    const syndrome = syndromeFor(instance, errorType, residual);
    const conjugate = instance.logicals[errorType === "X" ? "Z" : "X"];
    const logicalFlip = residual.filter(qubit => conjugate.includes(qubit)).length % 2 === 1;
    return {
      errorSyndrome: syndromeFor(instance, errorType, error),
      recoverySyndrome: syndromeFor(instance, errorType, recovery),
      residual,
      syndrome,
      logicalFlip,
      success: syndrome.length === 0 && !logicalFlip,
    };
  }

  function loadPreset(id, {syndromeVisible = true} = {}) {
    const preset = presetById[id];
    if (!preset) return;
    state.preset = preset.id;
    state.instance = preset.instance;
    state.errorType = preset.error_type;
    state.error = [...preset.error];
    state.recovery = [...preset.recovery];
    state.hideError = preset.hide_error;
    state.syndromeVisible = syndromeVisible;
    state.editMode = preset.recovery.length ? "recovery" : "error";
    state.keyboardQubit = 0;
  }

  function applyChapterDefaults(chapterId) {
    const chapter = chapters.find(candidate => candidate.id === chapterId);
    const presetId = chapter?.lab?.preset;
    if (presetId) {
      loadPreset(presetId, {syndromeVisible: !chapter.lab.guided});
    }
    if (chapter?.lab?.kind === "capstone") {
      const stage = capstoneStages[0];
      state.capstoneStage = stage?.id || null;
      if (stage?.preset) loadPreset(stage.preset, {syndromeVisible: true});
      if (stage?.edit_mode) state.editMode = stage.edit_mode;
    }
  }

  function setChapter(chapterId, {historyMode = "push", restore = false} = {}) {
    if (!chapterIds.includes(chapterId)) return;
    if (!restore && state.chapter !== chapterId) {
      state.completed = [...new Set([...state.completed, state.chapter])];
    }
    state.chapter = chapterId;
    if (!restore) applyChapterDefaults(chapterId);
    render();
    if (!restore) {
      state.view = {scrollY: 0, focus: `#chapter-${chapterId} h2`};
    }
    persist(
      historyMode,
      restoreNotice || "Progress saved locally",
      {capture: restore},
    );
    restoreNotice = "";
    if (!restore) {
      const heading = $(`[data-learn-chapter="${chapterId}"] h2`);
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({preventScroll: true});
      window.scrollTo({top: 0, behavior: "auto"});
    }
  }

  function resetCurrentLab() {
    const chapter = chapters.find(candidate => candidate.id === state.chapter);
    const kind = chapter.lab.kind;
    if (["syndrome", "capstone"].includes(kind)) {
      const preset = chapter.lab.preset || firstPresetFor(state.chapter).id;
      loadPreset(preset, {syndromeVisible: !chapter.lab.guided});
      if (kind === "capstone") {
        const stage = capstoneStages[0];
        state.capstoneStage = stage?.id || null;
        if (stage?.preset) loadPreset(stage.preset, {syndromeVisible: true});
        if (stage?.edit_mode) state.editMode = stage.edit_mode;
      }
    } else if (kind === "structure") {
      state.structureInstance = chapter.lab.instance || tutorial.instances[0].instance;
      state.structureMode = "lattice";
      state.structureFilter = "all";
      state.selectedCheck = null;
    } else if (kind === "circuit") {
      state.circuitLayer = 0;
      state.circuitInjected = false;
    } else if (kind === "operations") {
      state.operationChoice = TUTORIAL_DATA.operation_choices[0]?.id || null;
    } else if (kind === "evidence") {
      state.evidenceRegime = TUTORIAL_DATA.evidence_regimes[0]?.id || null;
      state.evidenceAnswer = null;
    }
    render();
    persist("replace", "This lab was reset; chapter progress was kept.");
  }

  function startOver() {
    const resetId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    safeStorage().set(resetKey, resetId);
    safeStorage().remove(storageKey);
    state = defaultState(resetId);
    render();
    persist(
      "replace",
      "Tutorial progress cleared. Started at chapter one.",
      {capture: false},
    );
    window.scrollTo({top: 0, behavior: "auto"});
  }

  function chapterIndex() { return chapterIds.indexOf(state.chapter); }

  function renderChrome() {
    document.body.classList.add("tutorial-ready");
    $$("[data-learn-chapter]").forEach(section => {
      section.classList.toggle("is-active", section.dataset.learnChapter === state.chapter);
    });
    let activeChapterButton = null;
    $$("[data-learn-chapter-button]").forEach(button => {
      const active = button.dataset.learnChapterButton === state.chapter;
      button.setAttribute("aria-current", active ? "step" : "false");
      if (active) activeChapterButton = button;
    });
    if (activeChapterButton && window.matchMedia?.("(max-width: 700px)").matches) {
      const list = activeChapterButton.closest("ol");
      if (list && list.scrollWidth > list.clientWidth) {
        list.scrollLeft = Math.max(
          0,
          activeChapterButton.parentElement.offsetLeft
          - (list.clientWidth - activeChapterButton.offsetWidth) / 2,
        );
      }
    }
    const index = chapterIndex();
    const completed = new Set(state.completed);
    if (
      capstoneChapter
      && capstoneStages.length
      && capstoneStages.every(stage => state.capstone[stage.id])
    ) completed.add(capstoneChapter.id);
    const percent = Math.round(100 * completed.size / chapters.length);
    $("[data-learn-progress-label]").textContent = (
      `Chapter ${index + 1} of ${chapters.length} · ${completed.size} complete`
    );
    $("[data-learn-progress-percent]").textContent = `${percent}%`;
    $("[data-learn-progress-bar]").style.width = `${percent}%`;
    $("[data-learn-previous]").disabled = index === 0;
    $("[data-learn-next]").disabled = index === chapters.length - 1;
  }

  function claimSummary(instance) {
    const claims = Object.fromEntries(instance.claims.map(claim => [claim.property, claim]));
    return ["n", "k", "d"].map(property => {
      const claim = claims[property] || {};
      const value = claim.value ?? claim.exact ?? claim.lower?.value ?? "?";
      return `${property}=${value} ${claim.origin?.kind || "unknown"}`;
    }).join(" · ");
  }

  function pointTransform(coords, width, height, pad = 52) {
    const xs = coords.map(point => point[0]);
    const ys = coords.map(point => point[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const scale = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY);
    return point => [
      width / 2 + (point[0] - (minX + maxX) / 2) * scale,
      height / 2 + (point[1] - (minY + maxY) / 2) * scale,
    ];
  }

  function drawSyndromeCanvas(canvas, instance, result) {
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const map = pointTransform(instance.coords, width, height);
    const points = instance.coords.map(map);
    const violated = new Set(state.syndromeVisible ? result.errorSyndrome : []);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#fbfcfc";
    context.fillRect(0, 0, width, height);

    instance.checks.forEach(check => {
      const support = check.support.map(index => points[index]);
      const center = support.reduce(
        (sum, point) => [sum[0] + point[0] / support.length, sum[1] + point[1] / support.length],
        [0, 0]
      );
      const ordered = [...support].sort(
        (a, b) => Math.atan2(a[1] - center[1], a[0] - center[0])
          - Math.atan2(b[1] - center[1], b[0] - center[0])
      );
      context.beginPath();
      ordered.forEach((point, index) => index
        ? context.lineTo(point[0], point[1])
        : context.moveTo(point[0], point[1]));
      context.closePath();
      context.fillStyle = check.type === "X" ? "rgba(33,100,119,.11)" : "rgba(173,73,63,.10)";
      context.strokeStyle = check.type === "X" ? "#216477" : "#ad493f";
      context.lineWidth = violated.has(check.row_index) ? 5 : 1.5;
      context.setLineDash(violated.has(check.row_index) ? [9, 5] : []);
      context.fill();
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = check.type === "X" ? "#216477" : "#ad493f";
      context.font = "700 15px system-ui";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(check.type === "X" ? "×" : "□", center[0], center[1]);
      if (violated.has(check.row_index)) {
        context.fillStyle = "#7a550f";
        context.font = "800 18px system-ui";
        context.fillText("!", center[0] + 14, center[1] - 13);
      }
    });

    points.forEach((point, index) => {
      const hasError = state.error.includes(index) && !state.hideError;
      const hasRecovery = state.recovery.includes(index);
      context.beginPath();
      context.arc(point[0], point[1], index === state.keyboardQubit ? 10 : 7, 0, Math.PI * 2);
      context.fillStyle = "#17202a";
      context.fill();
      if (index === state.keyboardQubit) {
        context.strokeStyle = "#9a6a12";
        context.lineWidth = 3;
        context.stroke();
      }
      if (hasRecovery) {
        context.beginPath();
        context.arc(point[0], point[1], 15, 0, Math.PI * 2);
        context.strokeStyle = "#25613f";
        context.lineWidth = 4;
        context.stroke();
      }
      if (hasError) {
        context.fillStyle = "#6d28d9";
        context.font = "800 19px system-ui";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(state.errorType, point[0], point[1] - 19);
      }
      context.fillStyle = "#35434d";
      context.font = "11px ui-monospace, monospace";
      context.textAlign = "center";
      context.fillText(String(index), point[0], point[1] + 20);
    });
    canvas.dataset.pointMap = JSON.stringify(points);
  }

  function syndromeResultHTML(result) {
    if (!state.syndromeVisible) {
      return "<div class='lab-result' data-tone='pending'><strong>Prediction locked?</strong>Reveal the syndrome when you are ready.</div>";
    }
    if (!state.error.length && !state.recovery.length) {
      return "<div class='lab-result'><strong>No operator selected</strong>Toggle one or more data sites.</div>";
    }
    if (!state.recovery.length) {
      if (result.errorSyndrome.length) {
        return `<div class='lab-result' data-tone='pending'><strong>${result.errorSyndrome.length} violated check${result.errorSyndrome.length === 1 ? "" : "s"}</strong>The syndrome reveals endpoints, not the hidden path. Switch to Recovery and close them.</div>`;
      }
      if (result.logicalFlip) {
        return "<div class='lab-result' data-tone='danger'><strong>Zero syndrome, logical action</strong>This string commutes with every check but anticommutes with the conjugate logical representative.</div>";
      }
      return "<div class='lab-result' data-tone='success'><strong>Zero syndrome, stabilizer-trivial</strong>The selected operator is locally equivalent to doing nothing on the logical qubit.</div>";
    }
    if (result.syndrome.length) {
      return `<div class='lab-result' data-tone='pending'><strong>Residual syndrome remains</strong>${result.syndrome.length} check${result.syndrome.length === 1 ? "" : "s"} still change after error + recovery.</div>`;
    }
    if (result.logicalFlip) {
      return "<div class='lab-result' data-tone='danger'><strong>Syndrome cleared — logical failure</strong>The residual is undetectable but crosses the conjugate logical once.</div>";
    }
    return "<div class='lab-result' data-tone='success'><strong>Recovery succeeds</strong>Error + recovery has zero syndrome and trivial logical class; exact path equality was unnecessary.</div>";
  }

  function maybeCompleteSyndrome(result) {
    if (!inCapstone()) return;
    const stage = activeCapstoneStage();
    if (!stage) return;
    const stagePreset = presetById[stage.preset];
    if (
      stage.completion === "recovery"
      && state.instance === stagePreset?.instance
      && state.recovery.length
      && result.success
    ) state.capstone[stage.id] = true;
    if (
      stage.completion === "logical"
      && result.errorSyndrome.length === 0
      && result.logicalFlip
      && state.error.length
    ) state.capstone[stage.id] = true;
  }

  function syndromeStageHTML({embedded = false, title = "Syndrome and recovery lab"} = {}) {
    const instance = instances[state.instance];
    const result = classify(instance, state.errorType, state.error, state.recovery);
    maybeCompleteSyndrome(result);
    const preset = presetById[state.preset];
    const presetOptions = TUTORIAL_DATA.presets
      .filter(candidate => embedded || candidate.id !== capstoneConfig.preset)
      .map(candidate => (
        `<option value='${escapeHTML(candidate.id)}' ${candidate.id === state.preset ? "selected" : ""}>${escapeHTML(candidate.label)}</option>`
      )).join("");
    return `${embedded ? "" : `<div class='learn-lab-header'><div><p class='eyebrow'>Computed lab</p><h2>${escapeHTML(title)}</h2><p>Every check response and logical classification is recomputed from governed supports.</p></div><span class='lab-provenance'>${escapeHTML(instance.origin.method)}</span></div>`}
      <div class='lab-toolbar'>
        <label>Case <select data-action='preset-select'>${presetOptions}</select></label>
        <button type='button' data-action='error-type' data-value='X' aria-pressed='${state.errorType === "X"}'>X error</button>
        <button type='button' data-action='error-type' data-value='Z' aria-pressed='${state.errorType === "Z"}'>Z error</button>
        <button type='button' data-action='edit-mode' data-value='error' aria-pressed='${state.editMode === "error"}'>Draw error</button>
        <button type='button' data-action='edit-mode' data-value='recovery' aria-pressed='${state.editMode === "recovery"}'>Draw recovery</button>
        <button type='button' data-action='toggle-hide'>${state.hideError ? "Reveal sampled error" : "Hide sampled error"}</button>
        <button type='button' data-action='reveal-syndrome' ${state.syndromeVisible ? "disabled" : ""}>Reveal syndrome</button>
      </div>
      <div class='lab-grid'><div class='lab-canvas-panel'>
        <canvas data-syndrome-canvas width='760' height='540' tabindex='0'
          aria-label='Interactive ${escapeHTML(instance.label)} patch. Arrow keys select a data qubit; Space toggles the current error or recovery tool.'></canvas>
        <div class='lab-legend' aria-label='Diagram legend'>
          <span class='legend-data'>data qubit</span><span class='legend-x-check'>X check</span>
          <span class='legend-z-check'>Z check</span><span class='legend-syndrome'>violated check</span>
          <span class='legend-error'>sampled error</span><span class='legend-recovery'>recovery</span>
        </div></div><div class='lab-side'>
          <div class='lab-callout'><strong>${escapeHTML(preset?.label || "Free exploration")}</strong><br>${escapeHTML(preset?.prompt || "Choose a data site.")}</div>
          ${syndromeResultHTML(result)}
          <div class='lab-detail'><strong>Exact formal state</strong>
            <code>instance: ${escapeHTML(instance.instance)} · ${escapeHTML(claimSummary(instance))}</code>
            <code>error: ${state.errorType}{${state.error.join(", ") || "∅"}}</code>
            <code>syndrome rows: {${state.syndromeVisible ? result.errorSyndrome.join(", ") || "∅" : "hidden"}}</code>
            <code>recovery: ${state.errorType}{${state.recovery.join(", ") || "∅"}}</code>
            <code>residual: ${state.errorType}{${result.residual.join(", ") || "∅"}}</code>
            <code>keyboard selection: q${state.keyboardQubit}</code>
          </div>
        </div></div>`;
  }

  function nearestQubit(canvas, event, instance) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    const points = JSON.parse(canvas.dataset.pointMap || "[]");
    let best = null;
    let distance = Infinity;
    points.forEach((point, index) => {
      const candidate = Math.hypot(point[0] - x, point[1] - y);
      if (candidate < distance) { best = index; distance = candidate; }
    });
    return distance <= 28 && best < instance.n ? best : null;
  }

  function toggleQubit(index) {
    const field = state.editMode === "recovery" ? "recovery" : "error";
    const values = new Set(state[field]);
    values.has(index) ? values.delete(index) : values.add(index);
    state[field] = [...values].sort((a, b) => a - b);
    if (field === "error") state.hideError = false;
    state.syndromeVisible = true;
    state.preset = "free";
    state.keyboardQubit = index;
  }

  function moveKeyboardQubit(key) {
    const instance = instances[state.instance];
    const delta = ["ArrowLeft", "ArrowUp"].includes(key) ? -1 : 1;
    state.keyboardQubit = (
      state.keyboardQubit + delta + instance.n
    ) % instance.n;
  }

  function bindSyndromeCanvas(root) {
    const canvas = root.querySelector("[data-syndrome-canvas]");
    if (!canvas) return;
    const instance = instances[state.instance];
    const result = classify(instance, state.errorType, state.error, state.recovery);
    drawSyndromeCanvas(canvas, instance, result);
    canvas.addEventListener("click", event => {
      const index = nearestQubit(canvas, event, instance);
      if (index === null) return;
      toggleQubit(index);
      render();
      persist();
    });
    canvas.addEventListener("keydown", event => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        moveKeyboardQubit(event.key);
        render();
        persist();
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        state.keyboardQubit = event.key === "Home" ? 0 : instance.n - 1;
        render();
        persist();
      } else if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        toggleQubit(state.keyboardQubit);
        render();
        persist();
      }
    });
  }

  function renderSyndrome(root, options = {}) {
    root.innerHTML = `<div class='learn-lab-card'>${syndromeStageHTML(options)}</div>`;
    bindSyndromeCanvas(root);
  }

  function structureDetail(instance) {
    const selected = state.selectedCheck;
    if (selected === null) {
      return state.structureMode === "logical"
        ? "Select a logical path to inspect its exact support."
        : "Select a shaded check to inspect the exact row and Pauli operator.";
    }
    if (state.structureMode === "logical") {
      const kind = selected === 0 ? "X" : "Z";
      const support = instance.logicals[kind];
      return `<strong>Derived logical ${kind}</strong><code>support {${support.join(", ")}}</code><code>weight ${support.length} · zero syndrome</code>`;
    }
    const check = instance.checks[selected];
    if (!check) return "The selected item is outside the active filter.";
    return `<strong>${check.type}-check row ${check.row_index}</strong><code>support {${check.support.join(", ")}}</code><code>${check.operator}</code><code>[${check.row.join(" ")}]</code>`;
  }

  function renderStructure(root) {
    const instance = instances[state.structureInstance];
    const instanceOptions = Object.values(instances).map(candidate => (
      `<option value='${escapeHTML(candidate.instance)}' ${candidate.instance === state.structureInstance ? "selected" : ""}>${escapeHTML(candidate.label)}</option>`
    )).join("");
    root.innerHTML = `<div class='learn-lab-card'>
      <div class='learn-lab-header'><div><p class='eyebrow'>Exact same object, three views</p>
      <h2>Check support ↔ Pauli row ↔ patch</h2><p>Select before naming: the formal row follows the visible support.</p></div>
      <span class='lab-provenance'>${escapeHTML(instance.origin.method)}</span></div>
      <div class='lab-toolbar'><label>Patch <select data-action='structure-instance'>${instanceOptions}</select></label>
      <button type='button' data-action='structure-mode' data-value='lattice' aria-pressed='${state.structureMode === "lattice"}'>Stabilizers</button>
      <button type='button' data-action='structure-mode' data-value='logical' aria-pressed='${state.structureMode === "logical"}'>Logicals</button>
      <button type='button' data-action='structure-filter' data-value='all' aria-pressed='${state.structureFilter === "all"}'>all</button>
      <button type='button' data-action='structure-filter' data-value='X' aria-pressed='${state.structureFilter === "X"}'>X</button>
      <button type='button' data-action='structure-filter' data-value='Z' aria-pressed='${state.structureFilter === "Z"}'>Z</button></div>
      <div class='lab-grid'><div class='lab-canvas-panel'>
      <canvas data-structure-canvas width='760' height='540' tabindex='0' aria-label='Constructor-derived patch; use arrow keys to select formal objects'></canvas>
      <div class='lab-legend'><span class='legend-data'>data qubit</span><span class='legend-x-check'>X object</span><span class='legend-z-check'>Z object</span></div></div>
      <div class='lab-side'><div class='lab-callout'><strong>${escapeHTML(instance.label)}</strong><br>${escapeHTML(claimSummary(instance))}</div>
      <div class='lab-detail' data-structure-detail>${structureDetail(instance)}</div>
      <div class='lab-result' data-tone='pending'><strong>Boundary prediction</strong>Before selecting row 0, predict why its support is smaller than a bulk row. Then open the retained HGP tour below and close the chains.</div></div></div></div>`;
    const canvas = root.querySelector("[data-structure-canvas]");
    SceneExplorer.render(canvas, instance.scene, {
      mode: state.structureMode,
      filter: state.structureFilter,
      highlight: state.selectedCheck,
    });
    const selectItem = item => {
      state.selectedCheck = item;
      render();
      persist();
    };
    canvas.addEventListener("click", event => {
      const point = SceneExplorer.eventPoint(canvas, event);
      if (!point) return;
      const item = SceneExplorer.nearestItem(
        canvas,
        instance.scene,
        {mode: state.structureMode, filter: state.structureFilter},
        point[0],
        point[1]
      );
      if (item !== null) selectItem(item);
    });
    canvas.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const count = state.structureMode === "logical" ? 2 : instance.checks.length;
      const delta = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
      const current = Number.isInteger(state.selectedCheck) ? state.selectedCheck : 0;
      selectItem((current + delta + count) % count);
    });
  }

  function circuitCoordinates(circuit) {
    const rows = [
      ...circuit.data_qubits.map(row => ({id: `d-${row.atlas}`, kind: "data", label: `d${row.atlas}`, coord: row.coord, atlas: row.atlas})),
      ...circuit.checks.map(row => ({id: `c-${row.atlas_row}`, kind: `check-${row.type.toLowerCase()}`, label: `${row.type}${row.atlas_row}`, coord: row.coord, check: row.atlas_row})),
    ];
    const xs = rows.map(row => row.coord[0]);
    const ys = rows.map(row => row.coord[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    return rows.map(row => ({
      ...row,
      left: 8 + 84 * (row.coord[0] - minX) / Math.max(1, maxX - minX),
      top: 9 + 82 * (row.coord[1] - minY) / Math.max(1, maxY - minY),
    }));
  }

  function circuitBoardHTML(circuit, fixture) {
    const nodes = circuitCoordinates(circuit);
    const byData = Object.fromEntries(nodes.filter(node => node.kind === "data").map(node => [node.atlas, node]));
    const byCheck = Object.fromEntries(nodes.filter(node => node.check !== undefined).map(node => [node.check, node]));
    const propagated = new Set(state.circuitInjected ? fixture?.propagated_data?.atlas_indices || [] : []);
    const edges = [];
    circuit.cnot_layers.forEach((layer, layerIndex) => {
      if (layerIndex >= state.circuitLayer) return;
      layer.forEach(edge => {
        const first = byCheck[edge.check];
        const second = byData[edge.data];
        const dx = second.left - first.left;
        const dy = second.top - first.top;
        const length = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const active = layerIndex === state.circuitLayer - 1;
        edges.push(`<span class='circuit-edge ${active ? "active" : "done"}' style='left:${first.left}%;top:${first.top}%;width:${length}%;transform:rotate(${angle}deg)' aria-hidden='true'></span>`);
      });
    });
    const nodeHTML = nodes.map(node => (
      `<span class='circuit-node ${node.kind} ${node.kind === "data" && propagated.has(node.atlas) ? "propagated" : ""}' style='left:${node.left}%;top:${node.top}%' title='${escapeHTML(node.label)}'>${escapeHTML(node.label)}</span>`
    )).join("");
    return `<div class='circuit-board' role='img' aria-label='Validated ancilla schedule after ${state.circuitLayer} of ${circuit.cnot_layers.length} CNOT layers'>${edges.join("")}${nodeHTML}</div>`;
  }

  function circuitStageHTML({embedded = false} = {}) {
    const circuit = TUTORIAL_DATA.circuit;
    const fixture = circuit.fault_fixtures.find(candidate => candidate.id === state.circuitFixture);
    const faultLayer = Number(fixture?.fault?.location?.match(/layer-(\d+)/)?.[1] || 0);
    const propagated = state.circuitInjected
      ? fixture.propagated_data.atlas_indices.join(", ") || "none"
      : "hidden until injection";
    return `${embedded ? "" : `<div class='learn-lab-header'><div><p class='eyebrow'>Validated circuit lab</p><h2>Ancilla schedule and hook propagation</h2><p>Step through the frozen circuit artifact; no gate order is invented in the browser.</p></div><span class='lab-provenance'>sha256 ${escapeHTML(circuit.artifact_sha256.slice(0, 12))}…</span></div>`}
      <div class='lab-toolbar'>
        <button type='button' data-action='circuit-step' data-value='-1' ${state.circuitLayer === 0 ? "disabled" : ""}>← Earlier</button>
        <label for='circuit-layer'>CNOT progress</label>
        <input id='circuit-layer' data-action='circuit-layer' type='range' min='0' max='${circuit.cnot_layers.length}' value='${state.circuitLayer}' step='1'>
        <output>after layer ${state.circuitLayer} of ${circuit.cnot_layers.length}</output>
        <button type='button' data-action='circuit-step' data-value='1' ${state.circuitLayer === circuit.cnot_layers.length ? "disabled" : ""}>Later →</button>
      </div>
      <div class='lab-grid'><div>${circuitBoardHTML(circuit, fixture)}
        <div class='lab-legend'><span class='legend-data'>data</span><span class='legend-x-check'>X ancilla</span><span class='legend-z-check'>Z ancilla</span><span class='legend-syndrome'>active CNOT layer</span></div></div>
        <div class='lab-side'><label>Named verified fixture<select data-action='circuit-fixture'>${circuit.fault_fixtures.map(candidate => `<option value='${escapeHTML(candidate.id)}' ${candidate.id === state.circuitFixture ? "selected" : ""}>${escapeHTML(candidate.id)}</option>`).join("")}</select></label>
        <div class='lab-callout'><strong>Predict before injecting</strong>The fault occurs after layer ${faultLayer}. Which later contacts of check ${fixture.fault.check} can receive ${fixture.fault.pauli}?</div>
        <button type='button' data-action='inject-fault'>${state.circuitInjected ? "Recompute named fault" : "Inject named fault"}</button>
        <div class='lab-result' data-tone='${state.circuitInjected ? "danger" : "pending"}'><strong>${state.circuitInjected ? `${fixture.propagated_data.pauli} hook on data {${propagated}}` : "Propagation hidden"}</strong>${state.circuitInjected ? "Only contacts after the named fault location contribute; this fixture was reconciled against the constructor rows." : "Advance to the fault location, predict, then inject."}</div>
        <div class='lab-detail'><strong>Scope</strong><code>${escapeHTML(circuit.entry)}:${escapeHTML(circuit.instance)} · ${escapeHTML(circuit.component)} memory</code><code>static code distance ≠ circuit fault distance</code></div></div></div>`;
  }

  function renderCircuit(root, options = {}) {
    root.innerHTML = `<div class='learn-lab-card'>${circuitStageHTML(options)}</div>`;
  }

  function renderOperations(root) {
    const choice = TUTORIAL_DATA.operation_choices.find(candidate => candidate.id === state.operationChoice)
      || TUTORIAL_DATA.operation_choices[0];
    const operation = choice.operation;
    root.innerHTML = `<div class='learn-lab-card'><div class='learn-lab-header'><div>
      <p class='eyebrow'>Curated decision lab</p><h2>Goal + connectivity → applicable mechanism</h2>
      <p>The selector routes to populated operation rows; it does not simulate the gate.</p></div>
      <span class='lab-provenance'>Operation claims retain their registered references</span></div>
      <div class='choice-grid'>${TUTORIAL_DATA.operation_choices.map(candidate => (
        `<button type='button' class='choice-card' data-action='operation-choice' data-value='${escapeHTML(candidate.id)}' aria-pressed='${candidate.id === choice.id}'><b>${escapeHTML(candidate.goal)}</b><span>${escapeHTML(candidate.access)}</span></button>`
      )).join("")}</div>
      <div class='operation-result'><p class='eyebrow'>Applicable Reference row</p>
      <h3>${escapeHTML(operation.gate)} by ${escapeHTML(operation.mechanism)}</h3>
      <p>${escapeHTML(choice.why)}</p><p><b>Cost / assumption:</b> ${escapeHTML(operation.cost)}</p>
      <p class='operation-meta'><span class='chip'>${escapeHTML(operation.level)}</span><span class='chip'>claimed · ${escapeHTML(operation.origin.ref)}</span></p></div></div>`;
  }

  function evidenceStageHTML({embedded = false} = {}) {
    const regime = TUTORIAL_DATA.evidence_regimes.find(candidate => candidate.id === state.evidenceRegime)
      || TUTORIAL_DATA.evidence_regimes[0];
    const decoder = regime.decoder;
    const question = TUTORIAL_DATA.evidence_question;
    const correct = state.evidenceAnswer === question.answer;
    const answered = state.evidenceAnswer !== null;
    const stage = activeCapstoneStage();
    if (inCapstone() && stage?.kind === "evidence" && correct) {
      state.capstone[stage.id] = true;
    }
    return `${embedded ? "" : `<div class='learn-lab-header'><div><p class='eyebrow'>Reference audit lab</p><h2>Attach every performance claim to its regime</h2><p>Filter the populated decoder rows before judging numbers.</p></div><span class='lab-provenance'>Curated mapping to populated card.yaml records</span></div>`}
      <div class='lab-toolbar'>${TUTORIAL_DATA.evidence_regimes.map(candidate => (
        `<button type='button' data-action='evidence-regime' data-value='${escapeHTML(candidate.id)}' aria-pressed='${candidate.id === regime.id}'>${escapeHTML(candidate.label)}</button>`
      )).join("")}</div>
      <div class='evidence-result'><p class='eyebrow'>Populated Decoder record</p><h3>${escapeHTML(decoder.id)} · ${escapeHTML(decoder.noise)}</h3>
      <p>${escapeHTML(decoder.notes)}</p><p><b>References:</b> ${escapeHTML((decoder.refs || []).join(", "))}</p></div>
      <div class='audit-question'><fieldset><legend>${escapeHTML(question.prompt)}</legend>${question.choices.map(choice => (
        `<label><input type='radio' name='evidence-answer' data-action='evidence-answer' value='${escapeHTML(choice.id)}' ${choice.id === state.evidenceAnswer ? "checked" : ""}> ${escapeHTML(choice.label)}</label>`
      )).join("")}</fieldset>${answered ? `<div class='audit-feedback' data-tone='${correct ? "success" : "danger"}'><strong>${correct ? "Correct." : "Not yet."}</strong> ${escapeHTML(correct ? question.explanation : "The shared decoder name does not align the stochastic experiment. Recheck the observation model and fault locations.")}</div>` : ""}</div>`;
  }

  function renderEvidence(root, options = {}) {
    root.innerHTML = `<div class='learn-lab-card'>${evidenceStageHTML(options)}</div>`;
  }

  function capstoneChecklistHTML() {
    return `<ul class='capstone-checklist'>${capstoneStages.map(stage => (
      `<li class='${state.capstone[stage.id] ? "complete" : ""}'>${escapeHTML(stage.checklist)}</li>`
    )).join("")}</ul>`;
  }

  function renderCapstone(root) {
    const stage = activeCapstoneStage() || capstoneStages[0];
    if (!stage) {
      root.innerHTML = "<div class='learn-lab-card'><p>This capstone has no configured stages.</p></div>";
      return;
    }
    if (stage.kind === "syndrome") {
      const instance = instances[state.instance];
      maybeCompleteSyndrome(
        classify(instance, state.errorType, state.error, state.recovery)
      );
    }
    if (
      stage.kind === "circuit"
      && state.circuitInjected
      && state.circuitLayer === TUTORIAL_DATA.circuit.cnot_layers.length
    ) state.capstone[stage.id] = true;
    if (
      stage.kind === "evidence"
      && state.evidenceAnswer === TUTORIAL_DATA.evidence_question.answer
    ) state.capstone[stage.id] = true;
    const allComplete = capstoneStages.every(item => state.capstone[item.id]);
    const stageButtons = capstoneStages.map(item => (
      `<button type='button' data-action='capstone-stage' data-value='${escapeHTML(item.id)}' aria-pressed='${state.capstoneStage === item.id}'>${escapeHTML(item.label)}</button>`
    )).join("");
    let stageHTML;
    if (stage.kind === "circuit") stageHTML = circuitStageHTML({embedded: true});
    else if (stage.kind === "evidence") stageHTML = evidenceStageHTML({embedded: true});
    else stageHTML = syndromeStageHTML({
      embedded: true,
      title: stage.title || "Syndrome classification",
    });
    const header = capstoneConfig.header;
    const graduation = capstoneConfig.graduation;
    root.innerHTML = `<div class='learn-lab-card'><div class='learn-lab-header'><div>
      <p class='eyebrow'>${escapeHTML(header.eyebrow)}</p><h2>${escapeHTML(header.title)}</h2>
      <p>${escapeHTML(header.description)}</p></div>
      <span class='lab-provenance'>${escapeHTML(header.provenance)}</span></div>
      ${capstoneChecklistHTML()}<div class='lab-toolbar'>${stageButtons}</div>${stageHTML}
      ${allComplete ? `<div class='graduation-banner'><strong>${escapeHTML(graduation.title)}</strong><br>${escapeHTML(graduation.body)}</div>` : ""}</div>`;
    if (stage.kind === "syndrome") bindSyndromeCanvas(root);
  }

  function renderLab() {
    const chapter = chapters.find(candidate => candidate.id === state.chapter);
    const root = $(`[data-learn-chapter="${state.chapter}"] [data-learn-lab]`);
    if (!root) return;
    if (chapter.lab.kind === "structure") renderStructure(root);
    else if (chapter.lab.kind === "circuit") renderCircuit(root);
    else if (chapter.lab.kind === "operations") renderOperations(root);
    else if (chapter.lab.kind === "evidence") renderEvidence(root);
    else if (chapter.lab.kind === "capstone") renderCapstone(root);
    else renderSyndrome(root);
  }

  function render() {
    renderLab();
    renderChrome();
  }

  function handleAction(action, value, element) {
    if (action === "preset-select") {
      loadPreset(element.value, {syndromeVisible: true});
      if (inCapstone()) {
        const matchingStage = capstoneStages.find(stage => stage.preset === element.value);
        if (matchingStage) state.capstoneStage = matchingStage.id;
      }
    } else if (action === "error-type") {
      state.errorType = value;
      state.error = [];
      state.recovery = [];
      state.preset = "free";
      state.syndromeVisible = true;
    } else if (action === "edit-mode") state.editMode = value;
    else if (action === "toggle-hide") state.hideError = !state.hideError;
    else if (action === "reveal-syndrome") state.syndromeVisible = true;
    else if (action === "structure-instance") {
      state.structureInstance = element.value;
      state.selectedCheck = null;
    } else if (action === "structure-mode") {
      state.structureMode = value;
      state.selectedCheck = null;
    } else if (action === "structure-filter") {
      state.structureFilter = value;
      state.selectedCheck = null;
    } else if (action === "circuit-step") {
      const count = TUTORIAL_DATA.circuit.cnot_layers.length;
      state.circuitLayer = Math.max(0, Math.min(count, state.circuitLayer + Number(value)));
      state.circuitInjected = false;
    } else if (action === "circuit-layer") {
      state.circuitLayer = Number(element.value);
      state.circuitInjected = false;
    } else if (action === "circuit-fixture") {
      state.circuitFixture = element.value;
      state.circuitInjected = false;
    } else if (action === "inject-fault") {
      state.circuitInjected = true;
      const stage = activeCapstoneStage();
      if (
        inCapstone()
        && stage?.kind === "circuit"
        && state.circuitLayer === TUTORIAL_DATA.circuit.cnot_layers.length
      ) state.capstone[stage.id] = true;
    } else if (action === "operation-choice") state.operationChoice = value;
    else if (action === "evidence-regime") state.evidenceRegime = value;
    else if (action === "evidence-answer") state.evidenceAnswer = element.value;
    else if (action === "capstone-stage") {
      const stage = capstoneStages.find(candidate => candidate.id === value);
      if (!stage) return;
      state.capstoneStage = stage.id;
      if (stage.preset) loadPreset(stage.preset, {syndromeVisible: true});
      if (stage.edit_mode) state.editMode = stage.edit_mode;
    }
    render();
    persist();
  }

  function bindEvents() {
    document.addEventListener("click", event => {
      const chapterButton = event.target.closest("[data-learn-chapter-button]");
      if (chapterButton) {
        setChapter(chapterButton.dataset.learnChapterButton);
        return;
      }
      if (event.target.closest("[data-learn-previous]")) {
        setChapter(chapterIds[Math.max(0, chapterIndex() - 1)]);
        return;
      }
      if (event.target.closest("[data-learn-next]")) {
        setChapter(chapterIds[Math.min(chapters.length - 1, chapterIndex() + 1)]);
        return;
      }
      if (event.target.closest("[data-learn-reset-lab]")) { resetCurrentLab(); return; }
      if (event.target.closest("[data-learn-start-over]")) { startOver(); return; }
      if (event.target.closest("[data-learn-excursion]")) {
        persist("replace", "Context saved for your Reference excursion.");
        return;
      }
      const target = event.target.closest("[data-action]");
      if (!target || ["SELECT", "INPUT"].includes(target.tagName)) return;
      handleAction(target.dataset.action, target.dataset.value, target);
    });
    document.addEventListener("change", event => {
      const target = event.target.closest("[data-action]");
      if (!target) return;
      handleAction(target.dataset.action, target.dataset.value, target);
    });
    document.addEventListener("input", event => {
      const target = event.target.closest("[data-action='circuit-layer']");
      if (!target) return;
      handleAction("circuit-layer", target.value, target);
    });
    window.addEventListener("popstate", event => {
      const restored = normalizeState(event.state?.atlasTutorial);
      if (restored) {
        state = restored;
        restoreNotice = "Restored this Back/Forward tutorial context.";
      } else {
        state = savedState() || defaultState();
        const requested = hashChapter();
        if (requested) state.chapter = requested;
        restoreNotice = "This history snapshot was stale; restored the nearest valid saved context.";
      }
      render();
      const status = $("[data-learn-save-status]");
      if (status) status.textContent = restoreNotice;
      restoreView();
    });
    window.addEventListener("beforeunload", () => {
      captureView();
      safeStorage().set(storageKey, JSON.stringify(state));
    });
    let resizeTimer;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(renderLab, 80);
    });
  }

  function restoreView() {
    const view = state.view || {};
    window.requestAnimationFrame(() => {
      window.scrollTo({top: view.scrollY || 0, behavior: "auto"});
      if (view.focus) {
        try { document.querySelector(view.focus)?.focus({preventScroll: true}); }
        catch (_error) { /* stale focus target */ }
      }
    });
  }

  function init() {
    state = initialState();
    bindEvents();
    render();
    persist("replace", restoreNotice || "Local progress ready");
    restoreNotice = "";
    restoreView();
  }

  document.addEventListener("DOMContentLoaded", init);
  return {
    classify,
    defaultState,
    init,
    normalizeState,
    syndromeFor,
  };
})();
