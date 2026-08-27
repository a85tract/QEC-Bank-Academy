/* learn-player: generic, versioned, data-driven QEC tutorial state and labs. */
const AtlasLearnPlayer = (() => {
  "use strict";

  const CURRENT_PREFIX = "qec-atlas-learn-current:";
  const CLASS_LABELS = {
    detectable: "detectable residual",
    stabilizer: "harmless stabilizer residual",
    logical: "zero-syndrome logical residual",
    undetermined: "undetermined residual",
  };

  function ordered(values) {
    return Array.from(values).sort((first, second) => {
      if (typeof first === "number" && typeof second === "number") {
        return first - second;
      }
      return String(first).localeCompare(String(second), undefined, {numeric: true});
    });
  }

  function symmetricDifference(...supports) {
    const parity = new Set();
    supports.flat().forEach(item => {
      if (parity.has(item)) parity.delete(item);
      else parity.add(item);
    });
    return ordered(parity);
  }

  function parityOverlap(first, second) {
    const secondSet = new Set(second);
    return first.reduce((parity, item) => parity ^ Number(secondSet.has(item)), 0);
  }

  function syndrome(source, pauli, support) {
    const opposite = pauli === "X" ? "Z" : "X";
    return source.lattice.checks
      .map((check, index) => ({check, index}))
      .filter(({check}) => (
        check.type === opposite && parityOverlap(check.support, support) === 1
      ))
      .map(({index}) => index);
  }

  function supportRow(support, width) {
    const row = Array(width).fill(0);
    support.forEach(index => {
      if (Number.isInteger(index) && index >= 0 && index < width) row[index] ^= 1;
    });
    return row;
  }

  function gf2Rank(rows, width) {
    const matrix = rows.map(row => supportRow(row, width));
    let pivotRow = 0;
    for (let column = 0; column < width && pivotRow < matrix.length; column += 1) {
      const hit = matrix.findIndex((row, index) => index >= pivotRow && row[column]);
      if (hit < 0) continue;
      [matrix[pivotRow], matrix[hit]] = [matrix[hit], matrix[pivotRow]];
      matrix.forEach((row, index) => {
        if (index !== pivotRow && row[column]) {
          row.forEach((value, inner) => { row[inner] = value ^ matrix[pivotRow][inner]; });
        }
      });
      pivotRow += 1;
    }
    return pivotRow;
  }

  function inRowspace(support, rows, width) {
    return gf2Rank(rows, width) === gf2Rank([...rows, support], width);
  }

  function classifyResidual(source, pauli, error, recovery) {
    const residual = symmetricDifference(error, recovery);
    const residualSyndrome = syndrome(source, pauli, residual);
    if (residualSyndrome.length) {
      return {kind: "detectable", residual, syndrome: residualSyndrome};
    }
    const rows = source.matrixRows?.[pauli];
    if (!Array.isArray(rows)) {
      return {kind: "undetermined", residual, syndrome: []};
    }
    const kind = inRowspace(residual, rows, source.lattice.coords.length)
      ? "stabilizer"
      : "logical";
    return {kind, residual, syndrome: []};
  }

  function stepList(data) {
    return data.lesson.chapters.flatMap((chapter, chapterIndex) =>
      chapter.steps.map((step, stepIndex) => ({
        ...step,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        chapterSummary: chapter.summary,
        chapterIndex,
        stepIndex,
      }))
    );
  }

  function locationIndex(data, chapter, step) {
    return stepList(data).findIndex(candidate => (
      candidate.chapterId === chapter && candidate.id === step
    ));
  }

  function defaultState(data) {
    const first = stepList(data)[0];
    return {
      entry: data.lesson.entry,
      version: data.lesson.version,
      chapter: first.chapterId,
      step: first.id,
      completedSteps: [],
      labs: {},
      capstoneResponse: "",
      scrollY: 0,
    };
  }

  function clonePlain(value, fallback) {
    try {
      const copy = JSON.parse(JSON.stringify(value));
      return copy && typeof copy === "object" ? copy : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function validateSnapshot(candidate, data) {
    if (!candidate || typeof candidate !== "object") return null;
    if (
      candidate.entry !== data.lesson.entry
      || candidate.version !== data.lesson.version
      || locationIndex(data, candidate.chapter, candidate.step) < 0
    ) return null;
    const validSteps = new Set(stepList(data).map(step => step.id));
    const state = defaultState(data);
    state.chapter = candidate.chapter;
    state.step = candidate.step;
    state.completedSteps = Array.isArray(candidate.completedSteps)
      ? [...new Set(candidate.completedSteps.filter(step => validSteps.has(step)))]
      : [];
    state.labs = clonePlain(candidate.labs, {});
    state.capstoneResponse = typeof candidate.capstoneResponse === "string"
      ? candidate.capstoneResponse.slice(0, 8000)
      : "";
    state.scrollY = Number.isFinite(candidate.scrollY) && candidate.scrollY >= 0
      ? candidate.scrollY
      : 0;
    return state;
  }

  function defaultLab(step, data) {
    if (step.panel === "syndrome") {
      return {
        pauli: step.pauli || "X",
        error: [...(step.preset_error || [])],
        predicted: [],
        revealed: false,
        camera: null,
      };
    }
    if (step.panel === "recovery") {
      return {
        pauli: step.pauli || "X",
        recovery: [],
        classChoice: null,
        submitted: false,
        showHidden: false,
        camera: null,
      };
    }
    if (step.panel === "distance") {
      return {
        xIndex: 0,
        zIndex: 0,
        visitedX: [],
        visitedZ: [],
        weightPrediction: null,
        checked: false,
        camera: null,
      };
    }
    if (step.panel === "construction") {
      return {
        lattice: Object.keys(data.advancedTour.lattices)[0],
        filter: "all",
        selected: null,
        inspected: false,
        visitedLattices: [],
        visitedCheckTypes: [],
        openWeights: [],
        selectedByType: {X: null, Z: null},
        commutationChecked: false,
        commutationAttempted: false,
        commutationPrediction: null,
        boundaryPrediction: null,
        factorPrediction: null,
        factorChecked: false,
        camera: null,
      };
    }
    if (step.panel === "circuit") {
      return {
        layer: 0,
        fixture: null,
        inspected: false,
        visitedLayers: [],
        verifiedFixtures: [],
        fixturePredictions: {},
        submittedFixtures: [],
        camera: null,
      };
    }
    if (step.panel === "surgery") {
      return {selected: [], inspected: false};
    }
    if (step.panel === "checkpoint") {
      return {selected: null, attempted: false};
    }
    if (step.panel === "capstone") {
      return {answers: {}, attempted: false, reviewAcknowledged: false};
    }
    return {};
  }

  function sanitizeLab(step, candidate, data) {
    const base = defaultLab(step, data);
    const raw = candidate && typeof candidate === "object" ? candidate : {};
    const camera = raw.camera && typeof raw.camera === "object" ? raw.camera : null;
    const uniqueIntegers = (value, limit) => Array.isArray(value)
      ? [...new Set(value.filter(index => Number.isInteger(index) && index >= 0 && index < limit))]
      : [];
    const source = data.sources?.[step.source || "primary"];
    if (step.panel === "syndrome") {
      return {
        ...base,
        pauli: ["X", "Z"].includes(raw.pauli) ? raw.pauli : base.pauli,
        error: uniqueIntegers(
          Array.isArray(raw.error) ? raw.error : base.error,
          source?.lattice?.coords?.length || 0
        ),
        predicted: uniqueIntegers(
          Array.isArray(raw.predicted) ? raw.predicted : base.predicted,
          source?.lattice?.checks?.length || 0
        ),
        revealed: raw.revealed === true,
        camera,
      };
    }
    if (step.panel === "recovery") {
      return {
        ...base,
        pauli: ["X", "Z"].includes(raw.pauli) ? raw.pauli : base.pauli,
        recovery: uniqueIntegers(raw.recovery, source?.lattice?.coords?.length || 0),
        classChoice: ["detectable", "stabilizer", "logical"].includes(raw.classChoice)
          ? raw.classChoice
          : null,
        submitted: raw.submitted === true,
        showHidden: raw.showHidden === true,
        camera,
      };
    }
    if (step.panel === "distance") {
      return {
        ...base,
        xIndex: Number.isInteger(raw.xIndex) ? raw.xIndex : base.xIndex,
        zIndex: Number.isInteger(raw.zIndex) ? raw.zIndex : base.zIndex,
        visitedX: uniqueIntegers(raw.visitedX, source?.logicalFamilies?.X?.length || 0),
        visitedZ: uniqueIntegers(raw.visitedZ, source?.logicalFamilies?.Z?.length || 0),
        weightPrediction: Number.isInteger(raw.weightPrediction) ? raw.weightPrediction : null,
        checked: raw.checked === true,
        camera,
      };
    }
    if (step.panel === "construction") {
      const lattices = Object.keys(data.advancedTour?.lattices || {});
      const selectedByType = ["X", "Z"].reduce((selected, type) => {
        const index = raw.selectedByType?.[type];
        selected[type] = Number.isInteger(index)
          && source?.lattice?.checks?.[index]?.type === type
          ? index
          : null;
        return selected;
      }, {});
      const factorChoices = step.completion?.factor_probe?.choices || [];
      const commutationPrediction = ["even", "odd"].includes(raw.commutationPrediction)
        ? raw.commutationPrediction
        : null;
      const commutationRowsReady = ["X", "Z"]
        .every(type => Number.isInteger(selectedByType[type]));
      const factorPrediction = factorChoices.includes(raw.factorPrediction)
        ? raw.factorPrediction
        : null;
      return {
        ...base,
        lattice: lattices.includes(raw.lattice) ? raw.lattice : base.lattice,
        filter: ["all", "X", "Z"].includes(raw.filter) ? raw.filter : "all",
        selected: Number.isInteger(raw.selected) && raw.selected >= 0 ? raw.selected : null,
        inspected: raw.inspected === true,
        visitedLattices: Array.isArray(raw.visitedLattices)
          ? [...new Set(raw.visitedLattices.filter(key => lattices.includes(key)))]
          : [],
        visitedCheckTypes: Array.isArray(raw.visitedCheckTypes)
          ? [...new Set(raw.visitedCheckTypes.filter(type => ["X", "Z"].includes(type)))]
          : [],
        openWeights: Array.isArray(raw.openWeights)
          ? [...new Set(raw.openWeights.filter(weight => Number.isInteger(weight) && weight > 0))]
          : [],
        selectedByType,
        commutationChecked: raw.commutationChecked === true
          && commutationRowsReady
          && commutationPrediction !== null,
        commutationAttempted: raw.commutationAttempted === true
          && commutationRowsReady
          && commutationPrediction !== null,
        commutationPrediction,
        boundaryPrediction: ["lower", "equal"].includes(raw.boundaryPrediction)
          ? raw.boundaryPrediction
          : null,
        factorPrediction,
        factorChecked: raw.factorChecked === true && factorPrediction !== null,
        camera,
      };
    }
    if (step.panel === "circuit") {
      const fixtureIds = (data.circuit?.fault_fixtures || []).map(fixture => fixture.id);
      const predictionEntries = raw.fixturePredictions
        && typeof raw.fixturePredictions === "object"
        && !Array.isArray(raw.fixturePredictions)
        ? Object.entries(raw.fixturePredictions)
        : [];
      return {
        ...base,
        layer: Number.isInteger(raw.layer) ? raw.layer : base.layer,
        fixture: fixtureIds.includes(raw.fixture) ? raw.fixture : null,
        inspected: raw.inspected === true,
        visitedLayers: uniqueIntegers(raw.visitedLayers, data.circuit?.cnot_layers?.length || 0),
        verifiedFixtures: Array.isArray(raw.verifiedFixtures)
          ? [...new Set(raw.verifiedFixtures.filter(id => fixtureIds.includes(id)))]
          : [],
        fixturePredictions: Object.fromEntries(predictionEntries
          .filter(([id]) => fixtureIds.includes(id))
          .map(([id, values]) => [
            id,
            uniqueIntegers(values, source?.lattice?.coords?.length || 0),
          ])),
        submittedFixtures: Array.isArray(raw.submittedFixtures)
          ? [...new Set(raw.submittedFixtures.filter(id => fixtureIds.includes(id)))]
          : [],
        camera,
      };
    }
    if (step.panel === "surgery") {
      const checkIds = new Set((data.surgery?.checks || []).map(check => check.id));
      return {
        ...base,
        selected: Array.isArray(raw.selected)
          ? [...new Set(raw.selected.filter(id => checkIds.has(id)))]
          : [],
        inspected: raw.inspected === true,
      };
    }
    if (step.panel === "checkpoint") {
      return {
        ...base,
        selected: Number.isInteger(raw.selected) ? raw.selected : null,
        attempted: raw.attempted === true,
      };
    }
    if (step.panel === "capstone") {
      const answers = raw.answers && typeof raw.answers === "object" && !Array.isArray(raw.answers)
        ? Object.fromEntries(
          Object.entries(raw.answers).filter(([_key, value]) => Number.isInteger(value))
        )
        : {};
      return {
        ...base,
        answers,
        attempted: raw.attempted === true,
        reviewAcknowledged: raw.reviewAcknowledged === true,
      };
    }
    return base;
  }

  function parseHash(data, hash) {
    if (!hash || hash === "#") return {location: null, invalid: false};
    const params = new URLSearchParams(hash.slice(1));
    const chapter = params.get("chapter");
    const step = params.get("step");
    if (locationIndex(data, chapter, step) < 0) {
      return {location: null, invalid: true};
    }
    return {location: {chapter, step}, invalid: false};
  }

  function locationHash(chapter, step) {
    const params = new URLSearchParams();
    params.set("chapter", chapter);
    params.set("step", step);
    return `#${params.toString()}`;
  }

  function storageKey(data) {
    return `qec-atlas-learn:${data.lesson.entry}:v${data.lesson.version}`;
  }

  function checkLabel(source, checkIndex) {
    const check = source.lattice.checks[checkIndex];
    if (!check) return `check ${checkIndex}`;
    const local = source.lattice.checks
      .slice(0, checkIndex)
      .filter(candidate => candidate.type === check.type).length;
    return `${check.type}${local}`;
  }

  function originLabel(origin) {
    if (!origin) return "origin unavailable";
    const detail = origin.method || origin.ref || origin.converter || "declared source";
    return `${origin.kind} · ${detail}`;
  }

  function supportsEqual(first, second) {
    return JSON.stringify(ordered(first)) === JSON.stringify(ordered(second));
  }

  function recoveryEvaluation(source, step, pauli, recovery, classChoice) {
    const hiddenError = step.hidden_error || [];
    const visibleSyndrome = syndrome(source, pauli, hiddenError);
    const recoverySyndrome = syndrome(source, pauli, recovery);
    const result = classifyResidual(source, pauli, hiddenError, recovery);
    const syndromeMatch = supportsEqual(visibleSyndrome, recoverySyndrome);
    const distinct = !step.require_distinct_recovery
      || !supportsEqual(hiddenError, recovery);
    const expectedClass = step.expected_residual || result.kind;
    const classMatch = classChoice === result.kind && result.kind === expectedClass;
    return {
      complete: syndromeMatch && distinct && classMatch,
      syndromeMatch,
      distinct,
      expectedClass,
      visibleSyndrome,
      recoverySyndrome,
      result,
    };
  }

  function nodeMarks(error, recovery, showError = true) {
    const marks = {};
    const errors = new Set(showError ? error : []);
    const recoveries = new Set(recovery || []);
    new Set([...errors, ...recoveries]).forEach(index => {
      marks[index] = errors.has(index) && recoveries.has(index)
        ? "cancelled"
        : errors.has(index)
          ? "error"
          : "recovery";
    });
    return marks;
  }

  function init() {
    if (typeof LESSON_DATA === "undefined") return;
    const data = LESSON_DATA;
    const lesson = data.lesson;
    const steps = stepList(data);
    const $ = selector => document.querySelector(selector);
    const $$ = selector => Array.from(document.querySelectorAll(selector));
    const canvas = $("[data-learn-canvas]");
    const controls = $("[data-learn-controls]");
    const detail = $("[data-learn-detail]");
    const feedback = $("[data-learn-feedback]");
    const canvasColumn = $("[data-learn-canvas-column]");
    const stageGrid = $("[data-learn-stage-grid]");
    const toolbar = $("[data-learn-scene-toolbar]");
    const legend = $("[data-learn-legend]");
    let activeScene = null;
    let stopResize = () => {};
    let restoreNotice = "";
    try { history.scrollRestoration = "manual"; } catch (_error) { /* nonfatal */ }

    function restoreScrollPosition(targetY) {
      const apply = () => window.scrollTo({top: targetY, behavior: "auto"});
      requestAnimationFrame(() => {
        apply();
        setTimeout(apply, 60);
      });
    }

    function safeRead(key) {
      try { return sessionStorage.getItem(key); } catch (_error) { return null; }
    }

    function safeWrite(key, value) {
      try { sessionStorage.setItem(key, value); } catch (_error) { /* nonfatal */ }
    }

    function safeRemove(key) {
      try { sessionStorage.removeItem(key); } catch (_error) { /* nonfatal */ }
    }

    function readSavedSnapshot() {
      const raw = safeRead(storageKey(data));
      if (!raw) return {raw: null, snapshot: null};
      try {
        return {raw, snapshot: validateSnapshot(JSON.parse(raw), data)};
      } catch (_error) {
        return {raw, snapshot: null};
      }
    }

    const hashState = parseHash(data, window.location.hash);
    const historySnapshot = validateSnapshot(history.state?.atlasLearn, data);
    const saved = readSavedSnapshot();
    const savedRaw = saved.raw;
    const savedSnapshot = saved.snapshot;
    let state;
    if (hashState.location) {
      state = historySnapshot || savedSnapshot || defaultState(data);
      state.chapter = hashState.location.chapter;
      state.step = hashState.location.step;
    } else if (historySnapshot) {
      state = historySnapshot;
    } else if (savedSnapshot) {
      state = savedSnapshot;
      restoreNotice = "Resumed saved progress. Start over remains an explicit separate action.";
    } else {
      state = defaultState(data);
      if (savedRaw) restoreNotice = "Saved tutorial state was stale or invalid, so a safe first-step state was used.";
    }
    if (hashState.invalid) {
      const fallback = steps[0];
      state.chapter = fallback.chapterId;
      state.step = fallback.id;
      restoreNotice = "That deep link was not valid for this tutorial version; the nearest safe start was restored.";
    }

    function snapshot() {
      state.scrollY = Math.max(0, window.scrollY || 0);
      return clonePlain(state, defaultState(data));
    }

    function persist(mode = "replace") {
      const current = snapshot();
      const serialized = JSON.stringify(current);
      safeWrite(storageKey(data), serialized);
      safeWrite(`${CURRENT_PREFIX}${lesson.entry}`, serialized);
      const hash = locationHash(current.chapter, current.step);
      const historyState = {atlasLearn: current};
      if (mode === "push") history.pushState(historyState, "", hash);
      else history.replaceState(historyState, "", hash);
    }

    function currentStep() {
      return steps[locationIndex(data, state.chapter, state.step)] || steps[0];
    }

    function labFor(step = currentStep()) {
      state.labs[step.id] = sanitizeLab(step, state.labs[step.id], data);
      return state.labs[step.id];
    }

    function markComplete(step) {
      if (!state.completedSteps.includes(step.id)) state.completedSteps.push(step.id);
    }

    function unmarkComplete(step) {
      state.completedSteps = state.completedSteps.filter(id => id !== step.id);
    }

    function make(tag, className = "", text = "") {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== "") element.textContent = text;
      return element;
    }

    function actionButton(label, pressed, handler, className = "") {
      const button = make("button", className, label);
      button.type = "button";
      if (pressed !== null) button.setAttribute("aria-pressed", String(Boolean(pressed)));
      button.addEventListener("click", handler);
      return button;
    }

    function section(title, description = "") {
      const wrapper = make("section", "learn-control-section");
      wrapper.append(make("h3", "", title));
      if (description) wrapper.append(make("p", "learn-control-note", description));
      controls.append(wrapper);
      return wrapper;
    }

    function evidenceRecordText(ledger, record) {
      if (ledger === "decoders") {
        const gap = record.origin
          ? ` Origin: ${originLabel(record.origin)}.`
          : " Evidence-status gap: this legacy card record has provenance keys but no structured verified/bounded/claimed origin kind.";
        return `${record.id} · ${record.status}. Model: ${record.noise}. ${record.notes}${gap}`;
      }
      if (ledger === "operations") {
        return `${record.gate} via ${record.mechanism} · ${record.level}. Cost/scope: ${record.cost}. Origin: ${originLabel(record.origin)}.`;
      }
      if (ledger === "realizations") {
        const gap = record.origin
          ? ` Origin: ${originLabel(record.origin)}.`
          : " Evidence-status gap: this legacy card record has provenance keys but no structured verified/bounded/claimed origin kind.";
        return `${record.platform} · ${record.status}. ${record.description}${gap}`;
      }
      if (ledger === "views") {
        const gap = record.gap?.target ? ` Explicit gap: ${record.gap.target}.` : "";
        return `${record.rung} · ${record.type}. ${record.description} Origin: ${originLabel(record.origin)}.${gap}`;
      }
      return "Governed Reference record.";
    }

    function appendEvidenceRecords(parent, evidence = []) {
      if (!Array.isArray(evidence) || !evidence.length) return;
      const records = make("div", "learn-evidence-grid");
      evidence.forEach(item => {
        const record = data.referenceLedger?.[item.ledger]?.[item.index];
        if (!record) return;
        const card = make("article", "learn-evidence-card");
        card.append(
          make("h4", "", item.label || `${item.ledger} record`),
          make("p", "", evidenceRecordText(item.ledger, record))
        );
        const refs = Array.isArray(record.refs) ? record.refs.join(", ") : record.origin?.ref;
        if (refs) card.append(make("small", "", `Provenance keys: ${refs}`));
        records.append(card);
      });
      if (records.children.length) parent.append(records);
    }

    function appendReferenceBridge(parent) {
      const bridge = data.lesson.reference_bridge;
      if (!Array.isArray(bridge) || !bridge.length) return;
      const details = make("details", "learn-bridge");
      details.append(make("summary", "", "What Learn covers—and leaves as an honest gap"));
      const list = make("ul", "learn-bridge-list");
      bridge.forEach(item => {
        list.append(make("li", "", `${item.area} · ${item.status}: ${item.note}`));
      });
      details.append(list);
      parent.append(details);
    }

    function buttonGrid(parent, className = "") {
      const grid = make("div", `learn-button-grid ${className}`.trim());
      parent.append(grid);
      return grid;
    }

    function setFeedback(message, kind = "neutral") {
      feedback.textContent = message;
      feedback.dataset.kind = kind;
    }

    function setLegend(items) {
      legend.replaceChildren();
      items.forEach(([mark, label]) => {
        const item = make("span", "learn-legend-item");
        const symbol = make("span", `learn-legend-symbol mark-${mark}`);
        symbol.setAttribute("aria-hidden", "true");
        item.append(symbol, document.createTextNode(label));
        legend.append(item);
      });
    }

    function hideScene() {
      activeScene = null;
      stopResize();
      stopResize = () => {};
      canvasColumn.hidden = true;
      stageGrid.classList.add("learn-stage-text-only");
      toolbar.replaceChildren();
      legend.replaceChildren();
      detail.textContent = "";
    }

    function updateCameraStatus() {
      const output = toolbar.querySelector("[data-learn-camera-status]");
      if (!output || !activeScene) return;
      output.textContent = SceneExplorer.cameraStatus(activeScene.scene).label;
    }

    function saveCamera(replace = true) {
      if (!activeScene) return;
      activeScene.lab.camera = SceneExplorer.cameraStatus(activeScene.scene);
      if (replace) persist("replace");
    }

    function drawActiveScene() {
      if (!activeScene) return;
      SceneExplorer.render(
        canvas,
        activeScene.scene,
        activeScene.drawState()
      );
      updateCameraStatus();
    }

    function cameraToolbar() {
      toolbar.replaceChildren();
      toolbar.append(make("span", "", "Scene"));
      const zoomOut = actionButton("−", null, () => {
        SceneExplorer.zoomAt(activeScene.scene, canvas, [canvas.width / 2, canvas.height / 2], 0.8);
        drawActiveScene();
        saveCamera();
      });
      zoomOut.setAttribute("aria-label", "Zoom out");
      const status = make("output", "learn-camera-status", "100%");
      status.dataset.learnCameraStatus = "";
      const zoomIn = actionButton("+", null, () => {
        SceneExplorer.zoomAt(activeScene.scene, canvas, [canvas.width / 2, canvas.height / 2], 1.25);
        drawActiveScene();
        saveCamera();
      });
      zoomIn.setAttribute("aria-label", "Zoom in");
      const reset = actionButton("Reset view", null, () => {
        SceneExplorer.resetView(activeScene.scene);
        drawActiveScene();
        saveCamera();
      });
      toolbar.append(zoomOut, status, zoomIn, reset, make("small", "", "Drag to pan · wheel or +/- to zoom"));
    }

    function showScene({scene, lab, drawState, interaction, select, detailText, legendItems}) {
      stopResize();
      canvasColumn.hidden = false;
      stageGrid.classList.remove("learn-stage-text-only");
      activeScene = {scene, lab, drawState, interaction, select};
      if (lab.camera) SceneExplorer.setView(scene, lab.camera);
      cameraToolbar();
      detail.textContent = detailText;
      setLegend(legendItems);
      stopResize = SceneExplorer.observeResize(canvas, drawActiveScene);
      drawActiveScene();
    }

    function updateAndRender() {
      persist("replace");
      render();
    }

    function renderSyndrome(step, lab, source) {
      const errorSection = section(
        "1 · Choose the hidden Pauli string",
        "Diamond marks are learner-chosen errors. Canvas coordinates are illustrative incidence only."
      );
      const pauliGrid = buttonGrid(errorSection, "learn-pauli-grid");
      ["X", "Z"].forEach(pauli => pauliGrid.append(actionButton(
        `${pauli} errors`,
        lab.pauli === pauli,
        () => {
          lab.pauli = pauli;
          lab.predicted = [];
          lab.revealed = false;
          updateAndRender();
        }
      )));
      const qubitGrid = buttonGrid(errorSection, "learn-qubit-grid");
      source.lattice.coords.forEach((_coord, index) => qubitGrid.append(actionButton(
        `q${index}`,
        lab.error.includes(index),
        () => {
          lab.error = symmetricDifference(lab.error, [index]);
          lab.revealed = false;
          updateAndRender();
        }
      )));

      const predictionSection = section(
        "2 · Commit a syndrome prediction",
        `Only ${lab.pauli === "X" ? "Z" : "X"} checks can anticommute with this chosen ${lab.pauli}-type Pauli string.`
      );
      const predictionGrid = buttonGrid(predictionSection, "learn-check-grid");
      source.lattice.checks.forEach((check, index) => {
        if (check.type === lab.pauli) return;
        predictionGrid.append(actionButton(
          checkLabel(source, index),
          lab.predicted.includes(index),
          () => {
            lab.predicted = symmetricDifference(lab.predicted, [index]);
            lab.revealed = false;
            updateAndRender();
          }
        ));
      });
      predictionSection.append(actionButton("Reveal computed syndrome", null, () => {
        lab.revealed = true;
        const actual = syndrome(source, lab.pauli, lab.error);
        if (supportsEqual(actual, lab.predicted)) markComplete(step);
        updateAndRender();
      }, "learn-primary-button"));

      const actual = syndrome(source, lab.pauli, lab.error);
      const visibleChecks = lab.revealed ? actual : lab.predicted;
      if (lab.revealed) {
        const correct = supportsEqual(actual, lab.predicted);
        const names = actual.length ? actual.map(index => checkLabel(source, index)).join(", ") : "∅";
        setFeedback(
          `${correct ? "Prediction confirmed." : "Prediction updated."} Syndrome = {${names}}. `
          + "Each displayed check has odd overlap with the chosen string.",
          correct ? "success" : "retry"
        );
      } else {
        setFeedback("Prediction is still hidden from the computed answer. Change the string or commit selected checks.");
      }
      showScene({
        scene: source.scene,
        lab,
        interaction: "node",
        select: index => {
          lab.error = symmetricDifference(lab.error, [index]);
          lab.revealed = false;
          updateAndRender();
        },
        drawState: () => ({
          mode: "lattice",
          round: 0,
          filter: "all",
          highlights: visibleChecks,
          nodeMarks: nodeMarks(lab.error, []),
        }),
        detailText: `${source.label}. Toggle a data qubit on the canvas or with the numbered buttons. ${source.geometryScope}`,
        legendItems: [["error", `${lab.pauli} error`], ["check", lab.revealed ? "computed flipped check" : "predicted check"]],
      });
    }

    function renderRecovery(step, lab, source) {
      const hiddenError = step.hidden_error || [];
      const visibleSyndrome = syndrome(source, lab.pauli, hiddenError);
      const syndromeNames = visibleSyndrome.map(index => checkLabel(source, index)).join(", ") || "∅";
      const recoverySection = section(
        `Observed syndrome {${syndromeNames}}`,
        "The sampled error stays hidden. Choose a recovery consistent with these clues."
      );
      const grid = buttonGrid(recoverySection, "learn-qubit-grid");
      source.lattice.coords.forEach((_coord, index) => grid.append(actionButton(
        `q${index}`,
        lab.recovery.includes(index),
        () => {
          lab.recovery = symmetricDifference(lab.recovery, [index]);
          lab.submitted = false;
          lab.showHidden = false;
          updateAndRender();
        }
      )));

      const classSection = section(
        "Classify error ⊕ recovery",
        "Detectable means nonzero residual syndrome; stabilizer and logical residuals both have zero syndrome."
      );
      const classGrid = buttonGrid(classSection);
      ["detectable", "stabilizer", "logical"].forEach(kind => classGrid.append(actionButton(
        CLASS_LABELS[kind],
        lab.classChoice === kind,
        () => {
          lab.classChoice = kind;
          lab.submitted = false;
          updateAndRender();
        }
      )));
      classSection.append(actionButton("Submit residual class", null, () => {
        lab.submitted = true;
        const evaluation = recoveryEvaluation(
          source,
          step,
          lab.pauli,
          lab.recovery,
          lab.classChoice
        );
        if (evaluation.complete) markComplete(step);
        updateAndRender();
      }, "learn-primary-button"));
      if (lab.submitted) {
        classSection.append(actionButton(
          lab.showHidden ? "Hide sampled error" : "Reveal sampled error",
          null,
          () => { lab.showHidden = !lab.showHidden; updateAndRender(); }
        ));
      }

      const evaluation = recoveryEvaluation(
        source,
        step,
        lab.pauli,
        lab.recovery,
        lab.classChoice
      );
      const result = evaluation.result;
      if (lab.submitted) {
        const recoveryNames = evaluation.recoverySyndrome.length
          ? evaluation.recoverySyndrome.map(index => checkLabel(source, index)).join(", ")
          : "∅";
        const messages = [];
        messages.push(
          evaluation.syndromeMatch
            ? "Recovery syndrome matches the observed syndrome."
            : `Recovery syndrome {${recoveryNames}} does not match the observation.`
        );
        if (!evaluation.distinct) messages.push("Use a syndrome-equivalent path distinct from the sampled error.");
        messages.push(
          `error ⊕ recovery = {${result.residual.join(", ") || "∅"}}; ${CLASS_LABELS[result.kind]}.`
        );
        if (result.kind !== evaluation.expectedClass) {
          messages.push(`This task requires a ${CLASS_LABELS[evaluation.expectedClass]} example.`);
        } else if (lab.classChoice !== result.kind) {
          messages.push("Your selected class does not match the computed residual.");
        }
        setFeedback(messages.join(" "), evaluation.complete ? "success" : "retry");
      } else {
        setFeedback("Use only the visible syndrome to propose a recovery, then commit to a residual class.");
      }
      showScene({
        scene: source.scene,
        lab,
        interaction: "node",
        select: index => {
          lab.recovery = symmetricDifference(lab.recovery, [index]);
          lab.submitted = false;
          updateAndRender();
        },
        drawState: () => ({
          mode: "lattice",
          round: 0,
          filter: "all",
          highlights: visibleSyndrome,
          nodeMarks: nodeMarks(hiddenError, lab.recovery, lab.showHidden),
        }),
        detailText: `${source.label}. Highlighted checks are the only permitted observation; the diamond path appears only after reveal.`,
        legendItems: [["recovery", "proposed recovery"], ["error", "sampled error after reveal"], ["cancelled", "error and recovery cancel"]],
      });
    }

    function renderDistance(step, lab, source) {
      const xFamily = source.logicalFamilies.X;
      const zFamily = source.logicalFamilies.Z;
      const completion = step.completion || {};
      lab.xIndex = Math.max(0, Math.min(xFamily.length - 1, Number(lab.xIndex) || 0));
      lab.zIndex = Math.max(0, Math.min(zFamily.length - 1, Number(lab.zIndex) || 0));
      const xSupport = xFamily[lab.xIndex];
      const zSupport = zFamily[lab.zIndex];
      const xSection = section("Choose a logical X representative", "Representatives in this row family differ by X stabilizers.");
      const xGrid = buttonGrid(xSection);
      xFamily.forEach((support, index) => xGrid.append(actionButton(
        `X${index}: {${support.join(", ")}}`,
        lab.xIndex === index,
        () => {
          lab.xIndex = index;
          lab.visitedX = ordered(new Set([...lab.visitedX, index]));
          lab.checked = false;
          updateAndRender();
        }
      )));
      const zSection = section("Choose a logical Z representative", "Representatives in this column family differ by Z stabilizers.");
      const zGrid = buttonGrid(zSection);
      zFamily.forEach((support, index) => zGrid.append(actionButton(
        `Z${index}: {${support.join(", ")}}`,
        lab.zIndex === index,
        () => {
          lab.zIndex = index;
          lab.visitedZ = ordered(new Set([...lab.visitedZ, index]));
          lab.checked = false;
          updateAndRender();
        }
      )));
      const inspect = section(
        "Predict weight, then inspect the formal crossing",
        `Visit at least ${completion.min_x_representatives || 1} X and ${completion.min_z_representatives || 1} Z representatives so deformation is evidence, not a label.`
      );
      if (Number.isInteger(completion.expected_weight)) {
        const weightGrid = buttonGrid(inspect);
        [completion.expected_weight - 1, completion.expected_weight, completion.expected_weight + 1]
          .filter(value => value > 0)
          .forEach(value => weightGrid.append(actionButton(
            `Predicted representative weight ${value}`,
            lab.weightPrediction === value,
            () => { lab.weightPrediction = value; lab.checked = false; updateAndRender(); }
          )));
      }
      inspect.append(actionButton("Check anticommutation and weight", null, () => {
        lab.checked = true;
        const enoughX = lab.visitedX.length >= (completion.min_x_representatives || 1);
        const enoughZ = lab.visitedZ.length >= (completion.min_z_representatives || 1);
        const predicted = !Number.isInteger(completion.expected_weight)
          || lab.weightPrediction === completion.expected_weight;
        if (
          enoughX
          && enoughZ
          && predicted
          && xSupport.length === completion.expected_weight
          && zSupport.length === completion.expected_weight
          && parityOverlap(xSupport, zSupport) === 1
        ) markComplete(step);
        updateAndRender();
      }, "learn-primary-button"));
      const overlap = parityOverlap(xSupport, zSupport);
      const distanceClaim = source.claims.d || {};
      const distanceValue = distanceClaim.exact
        ?? distanceClaim.value
        ?? distanceClaim.lower?.value
        ?? "?";
      if (lab.checked) {
        const enoughX = lab.visitedX.length >= (completion.min_x_representatives || 1);
        const enoughZ = lab.visitedZ.length >= (completion.min_z_representatives || 1);
        const predicted = lab.weightPrediction === completion.expected_weight;
        const demonstrated = enoughX && enoughZ && predicted && overlap === 1;
        setFeedback(
          `X weight ${xSupport.length}; Z weight ${zSupport.length}; overlap parity ${overlap}. `
          + `Visited X reps ${lab.visitedX.length}/${completion.min_x_representatives || 1} and Z reps ${lab.visitedZ.length}/${completion.min_z_representatives || 1}. `
          + `The instance records d=${distanceValue} (${originLabel(distanceClaim.origin)}).`,
          demonstrated ? "success" : "retry"
        );
      } else {
        setFeedback("Deform each representative, then check whether the chosen X/Z pair crosses oddly.");
      }
      const marks = {};
      xSupport.forEach(index => { marks[index] = "logical"; });
      zSupport.forEach(index => { marks[index] = marks[index] ? "cancelled" : "recovery"; });
      showScene({
        scene: source.scene,
        lab,
        interaction: null,
        select: null,
        drawState: () => ({mode: "lattice", round: 0, filter: "all", highlights: [], nodeMarks: marks}),
        detailText: `${source.label}. Logical families were rejected at build time unless they had zero syndrome, lay outside the stabilizer row space, and remained same-family equivalent.`,
        legendItems: [["logical", "logical X support"], ["recovery", "logical Z support"], ["cancelled", "odd crossing point"]],
      });
    }

    function renderConstruction(step, lab, source) {
      const productMode = step.construction_mode === "product";
      const completion = step.completion || {};
      const primer = data.constructionPrimer;
      const latticeSources = data.advancedTour.lattices;
      const sceneSource = productMode ? latticeSources[lab.lattice] : source;
      const lattice = sceneSource.lattice;
      const scene = sceneSource.scene;
      const primerSection = section(
        "Before the notation: two parity ledgers",
        "CSS (Calderbank–Shor–Steane) means separate binary X-check and Z-check matrices. A row lists the data qubits touched by one check."
      );
      primerSection.append(make(
        "p",
        "learn-equation-box",
        `Factor A = ${primer.factorNames.A}; factor B = ${primer.factorNames.B}. `
        + `For L=${primer.length.value}, H_rep has row supports `
        + `${primer.repetitionRows.map(row => `{${row.join(",")}}`).join(" and ")}.`
      ));
      primerSection.append(make(
        "p",
        "learn-control-note",
        `HGP means hypergraph product. Its data coordinates split into bit×bit (${primer.qubitBlocks.bitByBit.value}) `
        + `and check×check (${primer.qubitBlocks.checkByCheck.value}); together they give ${primer.qubitBlocks.total.value}.`
      ));
      if (productMode) {
        const prediction = make("fieldset", "learn-inline-question");
        prediction.append(make("legend", "", "Before switching: what changes at an open endpoint?"));
        const predictionGrid = buttonGrid(prediction);
        [
          ["lower", "An open boundary has a lower-weight check than the bulk."],
          ["equal", "Open and periodic products must have equal check weight everywhere."],
        ].forEach(([value, label]) => predictionGrid.append(actionButton(
          label,
          lab.boundaryPrediction === value,
          () => {
            lab.boundaryPrediction = value;
            maybeCompleteConstruction();
            updateAndRender();
          }
        )));
        primerSection.append(prediction);

        const probe = completion.factor_probe;
        const probeSource = probe ? latticeSources[probe.lattice] : null;
        const probeCheck = probeSource?.lattice?.checks?.[probe?.check];
        const probeNote = data.advancedTour.tour.check_notes?.[probe?.lattice]?.[String(probe?.check)];
        if (probe && probeSource && probeCheck && probeNote) {
          const factorQuestion = make("fieldset", "learn-inline-question");
          factorQuestion.append(make(
            "legend",
            "",
            `${probeNote.label}: which exact qubit support follows from that factor index?`
          ));
          const factorGrid = buttonGrid(factorQuestion, "learn-check-grid");
          probe.choices.forEach(index => {
            const candidate = probeSource.lattice.checks[index];
            if (!candidate) return;
            factorGrid.append(actionButton(
              `{${candidate.support.join(", ")}}`,
              lab.factorPrediction === index,
              () => {
                lab.factorPrediction = index;
                lab.factorChecked = false;
                unmarkComplete(step);
                updateAndRender();
              }
            ));
          });
          const factorButton = actionButton(
            "Check factor translation",
            lab.factorChecked,
            () => {
              lab.factorChecked = lab.factorPrediction !== null;
              maybeCompleteConstruction();
              updateAndRender();
            },
            "learn-primary-button"
          );
          factorButton.disabled = lab.factorPrediction === null;
          factorQuestion.append(factorButton);
          if (lab.factorChecked) {
            const correct = lab.factorPrediction === probe.check;
            factorQuestion.append(make(
              "p",
              "learn-control-note",
              correct
                ? `Correct: {${probeCheck.support.join(", ")}}. ${probeNote.explanation}`
                : "That support belongs to a different copied relation or endpoint. Re-read the two factor indices and try again."
            ));
          }
          primerSection.append(factorQuestion);
        }
      } else {
        const xIndex = lab.selectedByType.X;
        const zIndex = lab.selectedByType.Z;
        const rowsReady = Number.isInteger(xIndex) && Number.isInteger(zIndex);
        const selectedParity = rowsReady
          ? parityOverlap(lattice.checks[xIndex].support, lattice.checks[zIndex].support)
          : null;
        const prediction = make("fieldset", "learn-inline-question");
        prediction.append(make(
          "legend",
          "",
          rowsReady
            ? `Predict the overlap parity of ${checkLabel(source, xIndex)} and ${checkLabel(source, zIndex)}.`
            : "Select one X row and one Z row, then predict their overlap parity."
        ));
        const predictionGrid = buttonGrid(prediction);
        [["even", "Even"], ["odd", "Odd"]].forEach(([value, label]) => {
          const button = actionButton(
            label,
            lab.commutationPrediction === value,
            () => {
              lab.commutationPrediction = value;
              lab.commutationChecked = false;
              lab.commutationAttempted = false;
              unmarkComplete(step);
              updateAndRender();
            }
          );
          button.disabled = !rowsReady;
          predictionGrid.append(button);
        });
        const verifyButton = actionButton(
          "Check selected overlap and full matrix product",
          lab.commutationChecked,
          () => {
            if (!rowsReady || !lab.commutationPrediction) return;
            const actual = selectedParity === 0 ? "even" : "odd";
            lab.commutationAttempted = true;
            lab.commutationChecked = lab.commutationPrediction === actual;
            if (!lab.commutationChecked) unmarkComplete(step);
            maybeCompleteConstruction();
            updateAndRender();
          },
          "learn-primary-button"
        );
        verifyButton.disabled = !rowsReady || !lab.commutationPrediction;
        prediction.append(verifyButton);
        if (lab.commutationChecked) {
          prediction.append(make(
            "p",
            "learn-control-note",
            `${checkLabel(source, xIndex)} and ${checkLabel(source, zIndex)} overlap with ${selectedParity === 0 ? "even" : "odd"} parity. `
            + `The constructor then checks every pair: ${primer.commutation.equation}; nonzero entries = ${primer.commutation.nonzeroEntries.value} `
            + `(${originLabel(primer.commutation.nonzeroEntries.origin)}).`
          ));
        } else if (lab.commutationAttempted) {
          prediction.append(make(
            "p",
            "learn-control-note",
            "That prediction does not match the selected supports. Count their shared qubits modulo two and try again."
          ));
        }
        primerSection.append(prediction);
      }

      function maybeCompleteConstruction() {
        if (productMode) {
          const latticesReady = (completion.require_lattices || [])
            .every(key => lab.visitedLattices.includes(key));
          const weightsReady = (completion.require_open_weights || [])
            .every(weight => lab.openWeights.includes(weight));
          if (
            latticesReady
            && weightsReady
            && lab.boundaryPrediction === completion.boundary_prediction
            && (!completion.factor_probe || (
              lab.factorChecked
              && lab.factorPrediction === completion.factor_probe.check
            ))
          ) markComplete(step);
        } else {
          const typesReady = (completion.require_check_types || [])
            .every(type => lab.visitedCheckTypes.includes(type));
          if (
            typesReady
            && (!completion.require_commutation_check || lab.commutationChecked)
            && (!completion.commutation_prediction
              || lab.commutationPrediction === completion.commutation_prediction)
          ) {
            markComplete(step);
          }
        }
      }

      function recordCheck(index) {
        const check = lattice.checks[index];
        if (!check) return;
        lab.selected = index;
        lab.inspected = true;
        lab.visitedCheckTypes = [...new Set([...lab.visitedCheckTypes, check.type])];
        if (productMode) {
          lab.visitedLattices = [...new Set([...lab.visitedLattices, lab.lattice])];
          if (lab.lattice === "open") {
            lab.openWeights = ordered(new Set([...lab.openWeights, check.support.length]));
          }
        } else if (lab.selectedByType[check.type] !== index) {
          lab.selectedByType[check.type] = index;
          lab.commutationPrediction = null;
          lab.commutationChecked = false;
          lab.commutationAttempted = false;
          unmarkComplete(step);
        }
        maybeCompleteConstruction();
      }

      const toolbarSection = section(
        productMode ? "Choose boundary condition and check family" : "Choose a CSS check row",
        productMode
          ? "The preserved tour data supplies factor-index notes and constructor-derived open/periodic scenes."
          : "The binary row and visible support are the same governed object."
      );
      if (productMode) {
        const latticeGrid = buttonGrid(toolbarSection);
        Object.entries(latticeSources).forEach(([key, candidate]) => latticeGrid.append(actionButton(
          candidate.label,
          lab.lattice === key,
          () => {
            lab.lattice = key;
            lab.selected = null;
            updateAndRender();
          }
        )));
      }
      const filterGrid = buttonGrid(toolbarSection);
      ["all", "X", "Z"].forEach(filter => filterGrid.append(actionButton(
        filter,
        lab.filter === filter,
        () => { lab.filter = filter; lab.selected = null; updateAndRender(); }
      )));
      const checkSection = section("Inspect an exact check");
      const checkGrid = buttonGrid(checkSection, "learn-check-grid");
      lattice.checks.forEach((check, index) => {
        if (lab.filter !== "all" && check.type !== lab.filter) return;
        checkGrid.append(actionButton(
          checkLabel({lattice}, index),
          productMode
            ? lab.selected === index
            : lab.selectedByType[check.type] === index,
          () => {
            recordCheck(index);
            updateAndRender();
          }
        ));
      });
      if (productMode) {
        const link = make("a", "learn-inline-link", data.advancedTour.label);
        link.href = data.advancedTour.href;
        link.dataset.learnReference = "";
        checkSection.append(link);
      }
      if (lab.selected !== null && lattice.checks[lab.selected]) {
        const check = lattice.checks[lab.selected];
        const row = Array(lattice.coords.length).fill("0");
        check.support.forEach(index => { row[index] = "1"; });
        const notes = productMode
          ? data.advancedTour.tour.check_notes?.[lab.lattice]?.[String(lab.selected)]
          : null;
        setFeedback(
          `${checkLabel({lattice}, lab.selected)} support {${check.support.join(", ")}}; `
          + `binary row ${row.join("")}. `
          + (notes ? `${notes.label}: ${notes.explanation}` : "The row is exported from the validated CSS CheckMatrix."),
          "success"
        );
      } else {
        const requirement = productMode
          ? `Inspect open and periodic checks; on open, collect weights ${(completion.require_open_weights || []).join(" and ")}.`
          : `Inspect both X and Z rows and verify ${primer.commutation.equation}.`;
        setFeedback(`Select a check to expose its exact support and binary row. ${requirement}`);
      }
      showScene({
        scene,
        lab,
        interaction: "item",
        select: index => {
          if (lab.filter !== "all" && lattice.checks[index]?.type !== lab.filter) return;
          recordCheck(index);
          updateAndRender();
        },
        drawState: () => ({mode: "lattice", round: 0, filter: lab.filter, highlight: lab.selected, nodeMarks: {}}),
        detailText: productMode
          ? `${sceneSource.label}. Switch the product boundary condition without treating the drawing as a hardware layout.`
          : `${source.label}. Select a stabilizer on the canvas or by keyboard-equivalent buttons.`,
        legendItems: [["check", "selected X/Z check support"]],
      });
    }

    function renderCircuit(step, lab, source) {
      const circuit = data.circuit;
      const circuitMode = step.circuit_mode || "schedule";
      lab.layer = Math.max(0, Math.min(circuit.cnot_layers.length - 1, Number(lab.layer) || 0));
      const layerSection = section(
        "Step the frozen CNOT layers",
        `${circuit.id} · ${originLabel(circuit.origin)}`
      );
      const layerGrid = buttonGrid(layerSection);
      circuit.cnot_layers.forEach((_edges, index) => layerGrid.append(actionButton(
        `Layer ${index + 1}`,
        lab.layer === index,
        () => {
          lab.layer = index;
          lab.inspected = true;
          lab.visitedLayers = ordered(new Set([...lab.visitedLayers, index]));
          if (
            circuitMode === "schedule"
            && lab.visitedLayers.length === circuit.cnot_layers.length
          ) markComplete(step);
          updateAndRender();
        }
      )));
      const edges = circuit.cnot_layers[lab.layer];
      const edgeList = make("ul", "learn-edge-list");
      edges.forEach(edge => {
        const check = circuit.checks.find(candidate => candidate.atlas_row === edge.check);
        const label = `${checkLabel(source, edge.check)} (row ${edge.check}, a${check.ancilla})`;
        const direction = check.type === "X"
          ? `a${check.ancilla} → q${edge.data}`
          : `q${edge.data} → a${check.ancilla}`;
        const item = make("li", "", `${label}: ${direction}`);
        edgeList.append(item);
      });
      layerSection.append(edgeList);
      const conventions = make("div", "learn-circuit-conventions");
      ["X", "Z"].forEach(type => {
        const convention = circuit.cnotConventions[type];
        conventions.append(make(
          "p",
          "learn-control-note",
          `${type} check: prepare ancilla ${convention.preparation}, ${convention.control}→${convention.target}, measure ${convention.measurement}. ${convention.propagationRule}`
        ));
      });
      layerSection.append(conventions);

      const activeChecks = [...new Set(edges.map(edge => edge.check))];
      const marks = {};
      edges.forEach(edge => { marks[edge.data] = "recovery"; });

      if (circuitMode === "schedule") {
        const allLayers = lab.visitedLayers.length === circuit.cnot_layers.length;
        setFeedback(
          `Layer ${lab.layer + 1} contains ${edges.length} nonconflicting directed CNOTs. `
          + `Visited ${lab.visitedLayers.length}/${circuit.cnot_layers.length} layers. `
          + (allLayers ? "The full governed order has been inspected." : "Inspect every layer before this schedule step is demonstrated."),
          allLayers ? "success" : "neutral"
        );
        showScene({
          scene: source.scene,
          lab,
          interaction: null,
          select: null,
          drawState: () => ({mode: "lattice", round: 0, filter: "all", highlights: activeChecks, nodeMarks: marks}),
          detailText: "Data nodes are constructor-derived. Every arrow is reconciled to the exact frozen artifact; X- and Z-check arrows have opposite control direction.",
          legendItems: [["recovery", "data touched in current layer"], ["check", "ancilla check participating"]],
        });
        return;
      }

      const fixtureSection = section(
        "Predict a loader-validated hook fixture",
        "Choose one named fault, use only later directed CNOTs, and commit the propagated data support before reveal."
      );
      const fixtureGrid = buttonGrid(fixtureSection);
      circuit.fault_fixtures.forEach(fixture => fixtureGrid.append(actionButton(
        fixture.id,
        lab.fixture === fixture.id,
        () => {
          lab.fixture = fixture.id;
          lab.inspected = true;
          updateAndRender();
        }
      )));
      const fixture = circuit.fault_fixtures.find(candidate => candidate.id === lab.fixture);
      if (fixture) {
        const identity = fixture.checkIdentity;
        const localLabel = checkLabel(source, identity.row);
        const prediction = lab.fixturePredictions[fixture.id] || [];
        fixtureSection.append(make(
          "p",
          "learn-equation-box",
          `${fixture.fault.pauli} fault after layer ${fixture.insertionLayer} on ${localLabel} `
          + `(global row ${identity.row}, ancilla a${identity.ancilla}). Candidate data support: {${identity.support.join(", ")}}.`
        ));
        const predictionGrid = buttonGrid(fixtureSection, "learn-qubit-grid");
        identity.support.forEach(index => predictionGrid.append(actionButton(
          `q${index}`,
          prediction.includes(index),
          () => {
            lab.fixturePredictions[fixture.id] = symmetricDifference(prediction, [index]);
            lab.submittedFixtures = lab.submittedFixtures.filter(id => id !== fixture.id);
            lab.verifiedFixtures = lab.verifiedFixtures.filter(id => id !== fixture.id);
            updateAndRender();
          }
        )));
        fixtureSection.append(actionButton("Check propagated support", null, () => {
          lab.submittedFixtures = [...new Set([...lab.submittedFixtures, fixture.id])];
          if (supportsEqual(prediction, fixture.propagated_data.atlas_indices)) {
            lab.verifiedFixtures = [...new Set([...lab.verifiedFixtures, fixture.id])];
            if (lab.verifiedFixtures.length === circuit.fault_fixtures.length) markComplete(step);
          }
          updateAndRender();
        }, "learn-primary-button"));
        const submitted = lab.submittedFixtures.includes(fixture.id);
        if (submitted) {
          const trace = make("ol", "learn-trace-list");
          fixture.trace.forEach(item => trace.append(make(
            "li",
            "",
            `After layer ${item.layer}: new {${item.newData.join(", ") || "∅"}}; accumulated {${item.cumulativeData.join(", ") || "∅"}}.`
          )));
          fixtureSection.append(trace);
          const correct = supportsEqual(prediction, fixture.propagated_data.atlas_indices);
          setFeedback(
            `${correct ? "Prediction confirmed." : "Prediction differs from the loader-validated trace."} `
            + `${circuit.cnotConventions[identity.type].propagationRule} `
            + `Final data support {${fixture.propagated_data.atlas_indices.join(", ")}}. `
            + `Verified fixtures ${lab.verifiedFixtures.length}/${circuit.fault_fixtures.length}; this is not a circuit-distance or threshold claim.`,
            correct ? "success" : "retry"
          );
          fixture.propagated_data.atlas_indices.forEach(index => { marks[index] = "error"; });
        } else {
          setFeedback(
            `Trace later CNOTs for ${localLabel} (row ${identity.row}, ancilla a${identity.ancilla}) and select the data support before reveal. `
            + `Verified fixtures ${lab.verifiedFixtures.length}/${circuit.fault_fixtures.length}.`
          );
          prediction.forEach(index => { marks[index] = "error"; });
        }
        if (!activeChecks.includes(identity.row)) activeChecks.push(identity.row);
      } else {
        setFeedback("Choose one of the two named fixtures. Completion requires predicting both propagated supports.");
      }
      showScene({
        scene: source.scene,
        lab,
        interaction: null,
        select: null,
        drawState: () => ({mode: "lattice", round: 0, filter: "all", highlights: activeChecks, nodeMarks: marks}),
        detailText: "The current layer shows directed interactions. Predicted hook support stays learner-controlled until the named trace is checked.",
        legendItems: [["recovery", "data touched in current layer"], ["error", "predicted/revealed propagated data"], ["check", "participating or faulted check"]],
      });
    }

    function renderSurgery(step, lab) {
      hideScene();
      const surgery = data.surgery;
      const mappingSection = section(
        `${surgery.label}: map symbols before multiplying`,
        `The intended measured observable is ${surgery.observable}. This side-by-side Z seam is a smooth merge; the rough dual exchanges X and Z.`
      );
      mappingSection.append(make(
        "p",
        "learn-equation-box",
        "patch A: [A0 A1 A2]  |  seam: [s0 s1]  |  patch B: [B0 B1 B2]"
      ));
      const legendList = make("ul", "learn-symbol-list");
      surgery.symbolLegend.forEach(item => legendList.append(make(
        "li",
        "",
        `${item.symbols}: ${item.meaning}`
      )));
      mappingSection.append(legendList);
      const checkSection = section("Multiply seam checks over GF(2)", surgery.scope);
      const grid = buttonGrid(checkSection, "learn-seam-grid");
      surgery.checks.forEach(check => grid.append(actionButton(
        `${check.id} = {${check.support.join(", ")}}`,
        lab.selected.includes(check.id),
        () => {
          lab.selected = symmetricDifference(lab.selected, [check.id]);
          lab.inspected = true;
          const supports = surgery.checks
            .filter(candidate => lab.selected.includes(candidate.id))
            .map(candidate => candidate.support);
          const product = symmetricDifference(...supports);
          if (supportsEqual(product, surgery.target)) markComplete(step);
          updateAndRender();
        }
      )));
      const supports = surgery.checks
        .filter(check => lab.selected.includes(check.id))
        .map(check => check.support);
      const product = symmetricDifference(...supports);
      const productBox = make("div", "learn-equation-box");
      productBox.append(
        make("strong", "", "Selected product: "),
        document.createTextNode(`{${product.join(", ") || "∅"}}`)
      );
      checkSection.append(productBox);
      const merged = surgery.mergedProduct;
      const parameterDetails = make("details", "learn-verifier-details");
      parameterDetails.append(make(
        "summary",
        "",
        "Verifier details for the separately declared merged product code"
      ));
      parameterDetails.append(make(
        "p",
        "learn-parameter-line",
        `[[${merged.n.value},${merged.k.value},${merged.d.exact}]] where n = data-qubit count, k = encoded-qubit count, and d = minimum nontrivial logical Pauli weight. `
        + `Origins: n ${originLabel(merged.n.origin)} · k ${originLabel(merged.k.origin)} · d ${originLabel(merged.d.origin)}.`
      ));
      parameterDetails.append(make(
        "p",
        "learn-control-note",
        `Construction: ${surgery.mergedConstruction.op}(rep_parity_${surgery.mergedConstruction.inputs.H1.length}, rep_parity_${surgery.mergedConstruction.inputs.H2.length}). These dimensions do not prove the seam protocol fault tolerant.`
      ));
      checkSection.append(parameterDetails);
      const exact = supportsEqual(product, surgery.target);
      setFeedback(
        exact
          ? `Seam symbols cancelled pairwise; ${surgery.observable} remains as outer support {${surgery.target.join(", ")}}. Now attach repeated rounds, decoding, projection, and a Pauli-frame update before claiming a protocol.`
          : `Current product {${product.join(", ") || "∅"}}. Select checks whose internal seam symbols occur twice and cancel.`,
        exact ? "success" : "neutral"
      );
    }

    function renderCheckpoint(step, lab, checkpointId = step.checkpoint, compact = false) {
      const checkpoint = data.lesson.checkpoints[checkpointId];
      if (!checkpoint) return null;
      const wrapper = compact ? make("fieldset", "learn-capstone-card") : section("Commit before feedback");
      if (compact) {
        const title = make("legend", "", checkpoint.question);
        wrapper.append(title);
      } else {
        wrapper.append(make("p", "learn-question", checkpoint.question));
      }
      appendEvidenceRecords(wrapper, checkpoint.evidence);
      if (!compact && checkpointId === "representation-scope") {
        appendReferenceBridge(wrapper);
      }
      const grid = buttonGrid(wrapper);
      checkpoint.choices.forEach((choice, index) => grid.append(actionButton(
        choice,
        lab.selected === index,
        () => {
          lab.selected = index;
          lab.attempted = true;
          if (index === checkpoint.answer) markComplete(step);
          updateAndRender();
        },
        "learn-choice-button"
      )));
      if (!compact) {
        if (lab.attempted) {
          const correct = lab.selected === checkpoint.answer;
          setFeedback(correct ? checkpoint.success : checkpoint.retry, correct ? "success" : "retry");
        } else {
          setFeedback("Choose one claim. Feedback appears only after the attempt.");
        }
      }
      return wrapper;
    }

    function renderCapstone(step, lab) {
      hideScene();
      const intro = section(
        "Independent audit portfolio",
        "These cases combine changed-instance formal reasoning with regime and evidence scope."
      );
      const cards = make("div", "learn-capstone-grid");
      data.lesson.capstone.tasks.forEach(item => {
        const checkpoint = data.lesson.checkpoints[item.checkpoint];
        const fieldset = make("fieldset", "learn-capstone-card");
        fieldset.append(make("legend", "", item.label), make("p", "learn-control-note", checkpoint.question));
        appendEvidenceRecords(fieldset, checkpoint.evidence);
        const grid = buttonGrid(fieldset);
        checkpoint.choices.forEach((choice, index) => grid.append(actionButton(
          choice,
          lab.answers[item.checkpoint] === index,
          () => {
            lab.answers[item.checkpoint] = index;
            lab.attempted = false;
            lab.reviewAcknowledged = false;
            unmarkComplete(step);
            updateAndRender();
          },
          "learn-choice-button"
        )));
        cards.append(fieldset);
      });
      intro.append(cards);
      const writing = section("Explain the causal chain in your own words", data.lesson.capstone.explanation_prompt);
      const textarea = make("textarea", "learn-capstone-response");
      textarea.rows = 6;
      textarea.value = state.capstoneResponse;
      textarea.placeholder = "Error string → syndrome → residual class → evidence limitation…";
      textarea.addEventListener("input", () => {
        state.capstoneResponse = textarea.value.slice(0, 8000);
        lab.attempted = false;
        lab.reviewAcknowledged = false;
        unmarkComplete(step);
        persist("replace");
      });
      writing.append(textarea);
      writing.append(actionButton("Audit my capstone", null, () => {
        lab.attempted = true;
        const answersCorrect = data.lesson.capstone.tasks.every(item => (
          lab.answers[item.checkpoint] === data.lesson.checkpoints[item.checkpoint].answer
        ));
        if (!answersCorrect || state.capstoneResponse.trim().length < 80) {
          lab.reviewAcknowledged = false;
          unmarkComplete(step);
        }
        updateAndRender();
      }, "learn-primary-button"));
      const ledger = data.referenceLedger;
      const ledgerSection = section(
        "Reference coverage ledger",
        "The capstone cards above expose actual governed records. Counts below show the wider dossier that remains available, not material silently certified by this exercise."
      );
      ledgerSection.append(make(
        "p",
        "learn-ledger-line",
        `${ledger.decoders.length} decoder records · ${ledger.operations.length} operation records · `
        + `${ledger.realizations.length} realization records · rungs ${[...new Set(ledger.views.map(view => view.rung))].join(", ")}`
      ));
      appendReferenceBridge(ledgerSection);
      const wrong = data.lesson.capstone.tasks.filter(item => (
        lab.answers[item.checkpoint] !== data.lesson.checkpoints[item.checkpoint].answer
      ));
      const enoughWriting = state.capstoneResponse.trim().length >= 80;
      const structuredReady = !wrong.length && enoughWriting;
      if (lab.attempted && structuredReady) {
        const review = section(
          "Human/self-review boundary",
          "The browser can check the structured record choices and presence of a response. It cannot assess whether your prose explanation is scientifically adequate."
        );
        review.append(make(
          "p",
          "learn-control-note",
          "Self-review rubric: name odd overlap, require recovery-syndrome agreement, classify the zero-syndrome residual, and attach one model/origin/gap limitation."
        ));
        review.append(actionButton(
          "I reviewed my explanation against this rubric",
          lab.reviewAcknowledged,
          () => {
            lab.reviewAcknowledged = true;
            markComplete(step);
            updateAndRender();
          },
          "learn-primary-button"
        ));
      }
      if (lab.attempted) {
        if (structuredReady && lab.reviewAcknowledged) {
          setFeedback(
            `${data.lesson.capstone.structured_pass_label}. Your explanation is saved and self-reviewed, but it is not machine-graded or certified as scientifically correct.`,
            "success"
          );
        } else if (structuredReady) {
          setFeedback(
            "The machine-checkable record choices are correct and a response is present. Review the prose against the visible rubric before marking this step demonstrated.",
            "neutral"
          );
        } else {
          setFeedback(
            `${wrong.length ? `${wrong.length} audit answer(s) still need revision. ` : "All audit choices are correct. "}`
            + (enoughWriting ? "A written response is present but is not machine-graded." : "Add a causal explanation of at least 80 characters."),
            "retry"
          );
        }
      } else {
        setFeedback(
          `Complete all ${data.lesson.capstone.tasks.length} structured audits and write an explanation; answers are not revealed until you submit the portfolio.`
        );
      }
    }

    function renderPanel(step, lab) {
      controls.replaceChildren();
      setFeedback("");
      const source = data.sources[step.source || "primary"];
      if (step.panel === "syndrome") renderSyndrome(step, lab, source);
      else if (step.panel === "recovery") renderRecovery(step, lab, source);
      else if (step.panel === "distance") renderDistance(step, lab, source);
      else if (step.panel === "construction") renderConstruction(step, lab, source);
      else if (step.panel === "circuit") renderCircuit(step, lab, source);
      else if (step.panel === "surgery") renderSurgery(step, lab);
      else if (step.panel === "checkpoint") {
        hideScene();
        renderCheckpoint(step, lab);
      } else if (step.panel === "capstone") renderCapstone(step, lab);
    }

    function stepAttempted(step, lab) {
      if (step.panel === "syndrome") return lab.revealed;
      if (step.panel === "recovery") return lab.submitted;
      if (step.panel === "distance") return lab.checked;
      if (["construction", "circuit", "surgery"].includes(step.panel)) return lab.inspected;
      if (["checkpoint", "capstone"].includes(step.panel)) return lab.attempted;
      return false;
    }

    function render() {
      const step = currentStep();
      const lab = labFor(step);
      const index = steps.findIndex(candidate => candidate.id === step.id);
      $("[data-learn-position]").textContent = `${step.chapterTitle} · Step ${step.stepIndex + 1}`;
      $("[data-learn-title]").textContent = step.title;
      $("[data-learn-prompt]").textContent = step.prompt;
      $("[data-learn-explanation-text]").textContent = step.explanation;
      $("[data-learn-origin]").textContent = `Evidence: ${originLabel(step.origin)}`;
      const explanation = $("[data-learn-explanation]");
      explanation.open = stepAttempted(step, lab) || state.completedSteps.includes(step.id);
      const reference = $("[data-learn-reference]");
      if (step.reference) {
        reference.hidden = false;
        reference.href = step.reference.href;
        reference.textContent = `${step.reference.label} →`;
        reference.dataset.learnReference = "";
      } else {
        reference.hidden = true;
      }
      $("[data-learn-prev]").disabled = index === 0;
      $("[data-learn-next]").disabled = index === steps.length - 1;
      $$("[data-learn-chapter]").forEach(button => {
        const chapterSteps = steps.filter(candidate => candidate.chapterId === button.dataset.learnChapter);
        const active = button.dataset.learnChapter === step.chapterId;
        button.setAttribute("aria-current", active ? "step" : "false");
        button.classList.toggle(
          "chapter-complete",
          chapterSteps.every(candidate => state.completedSteps.includes(candidate.id))
        );
      });
      const percent = Math.round(100 * state.completedSteps.length / steps.length);
      const progress = $("[data-learn-progress]");
      progress.setAttribute("aria-valuenow", String(percent));
      progress.firstElementChild.style.width = `${percent}%`;
      $("[data-learn-progress-label]").textContent = `${state.completedSteps.length} of ${steps.length} steps demonstrated`;
      const notice = $("[data-learn-notice]");
      if (restoreNotice) {
        notice.hidden = false;
        notice.textContent = restoreNotice;
        restoreNotice = "";
      } else {
        notice.hidden = true;
      }
      renderPanel(step, lab);
    }

    function goToIndex(index, mode = "push") {
      if (index < 0 || index >= steps.length) return;
      persist("replace");
      const target = steps[index];
      state.chapter = target.chapterId;
      state.step = target.id;
      state.scrollY = 0;
      persist(mode);
      render();
      $("[data-learn-title]").focus?.();
      window.scrollTo({top: 0, behavior: "auto"});
    }

    let scrollPersistPending = false;
    window.addEventListener("scroll", () => {
      if (scrollPersistPending) return;
      scrollPersistPending = true;
      requestAnimationFrame(() => {
        scrollPersistPending = false;
        persist("replace");
      });
    }, {passive: true});

    $$("[data-learn-chapter]").forEach(button => {
      button.addEventListener("click", () => {
        const index = steps.findIndex(step => step.chapterId === button.dataset.learnChapter);
        goToIndex(index);
      });
    });
    $("[data-learn-prev]").addEventListener("click", () => {
      goToIndex(steps.findIndex(step => step.id === currentStep().id) - 1);
    });
    $("[data-learn-next]").addEventListener("click", () => {
      goToIndex(steps.findIndex(step => step.id === currentStep().id) + 1);
    });
    $("[data-learn-reset]").addEventListener("click", () => {
      const step = currentStep();
      state.labs[step.id] = defaultLab(step, data);
      state.completedSteps = state.completedSteps.filter(id => id !== step.id);
      persist("replace");
      render();
    });
    $("[data-learn-start-over]").addEventListener("click", () => {
      if (typeof window.confirm === "function" && !window.confirm("Clear this tutorial's saved progress and start again?")) return;
      safeRemove(storageKey(data));
      safeRemove(`${CURRENT_PREFIX}${lesson.entry}`);
      state = defaultState(data);
      restoreNotice = "Tutorial progress was explicitly reset. Reference data was not changed.";
      persist("replace");
      render();
    });
    document.addEventListener("click", event => {
      const link = event.target.closest?.("[data-learn-reference]");
      if (!link) return;
      persist("replace");
    });

    let drag = null;
    canvas.addEventListener("pointerdown", event => {
      if (!activeScene || (event.button !== undefined && event.button !== 0)) return;
      const point = SceneExplorer.eventPoint(canvas, event);
      if (!point) return;
      canvas.focus();
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastPoint: point,
        moved: false,
      };
      canvas.setPointerCapture?.(event.pointerId);
    });
    canvas.addEventListener("pointermove", event => {
      if (!drag || !activeScene) return;
      const point = SceneExplorer.eventPoint(canvas, event);
      if (!point) return;
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 4) drag.moved = true;
      if (!drag.moved) return;
      SceneExplorer.panBy(
        activeScene.scene,
        point[0] - drag.lastPoint[0],
        point[1] - drag.lastPoint[1]
      );
      drag.lastPoint = point;
      drawActiveScene();
    });
    canvas.addEventListener("pointerup", event => {
      if (!drag || !activeScene) return;
      const point = SceneExplorer.eventPoint(canvas, event);
      if (!drag.moved && point && activeScene.select) {
        const selected = activeScene.interaction === "node"
          ? SceneExplorer.nearestNode(canvas, activeScene.scene, point[0], point[1])
          : SceneExplorer.nearestItem(canvas, activeScene.scene, activeScene.drawState(), point[0], point[1]);
        if (selected !== null) activeScene.select(selected);
      } else if (drag.moved) {
        saveCamera();
      }
      if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture?.(event.pointerId);
      drag = null;
    });
    canvas.addEventListener("pointercancel", event => {
      if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture?.(event.pointerId);
      drag = null;
    });
    canvas.addEventListener("wheel", event => {
      if (!activeScene) return;
      const point = SceneExplorer.eventPoint(canvas, event);
      if (!point) return;
      event.preventDefault();
      SceneExplorer.zoomAt(activeScene.scene, canvas, point, Math.exp(-event.deltaY * 0.0015));
      drawActiveScene();
      saveCamera();
    }, {passive: false});
    canvas.addEventListener("keydown", event => {
      if (!activeScene) return;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        SceneExplorer.zoomAt(activeScene.scene, canvas, [canvas.width / 2, canvas.height / 2], 1.25);
      } else if (event.key === "-") {
        event.preventDefault();
        SceneExplorer.zoomAt(activeScene.scene, canvas, [canvas.width / 2, canvas.height / 2], 0.8);
      } else if (event.key === "0") {
        event.preventDefault();
        SceneExplorer.resetView(activeScene.scene);
      } else {
        return;
      }
      drawActiveScene();
      saveCamera();
    });

    window.addEventListener("popstate", event => {
      const restored = validateSnapshot(event.state?.atlasLearn, data);
      const parsed = parseHash(data, window.location.hash);
      let replaceInvalidLocation = false;
      if (restored) {
        state = restored;
      } else if (parsed.location) {
        const fallback = readSavedSnapshot().snapshot || defaultState(data);
        state = fallback;
        state.chapter = parsed.location.chapter;
        state.step = parsed.location.step;
      } else {
        state = readSavedSnapshot().snapshot || defaultState(data);
        const first = steps[0];
        state.chapter = first.chapterId;
        state.step = first.id;
        restoreNotice = parsed.invalid
          ? "That deep link was not valid for this tutorial version; the nearest safe start was restored."
          : "History state was invalid; a safe tutorial state was restored.";
        replaceInvalidLocation = true;
      }
      const restoredScrollY = state.scrollY;
      render();
      if (replaceInvalidLocation) persist("replace");
      restoreScrollPosition(restoredScrollY);
    });
    window.addEventListener("pagehide", () => persist("replace"));

    const initialScrollY = state.scrollY;
    persist("replace");
    render();
    if (initialScrollY > 0) restoreScrollPosition(initialScrollY);
  }

  document.addEventListener("DOMContentLoaded", init);
  return {
    classifyResidual,
    defaultState,
    gf2Rank,
    inRowspace,
    locationHash,
    parseHash,
    parityOverlap,
    recoveryEvaluation,
    stepList,
    sanitizeLab,
    syndrome,
    symmetricDifference,
    validateSnapshot,
  };
})();
