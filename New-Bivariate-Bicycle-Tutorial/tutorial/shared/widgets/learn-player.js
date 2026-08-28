/* Generic Learn v2 player. Lesson content is declarative; computations use
   constructor-exported matrices, lattice supports, claims, and Scene v2 data. */
const AtlasLearnPlayer = (() => {
  "use strict";

  const mod = (value, order) => ((value % order) + order) % order;

  function translationDestination(anchor, term, l, m, reverse = false) {
    const sign = reverse ? -1 : 1;
    return [
      mod(anchor[0] + sign * term[0], l),
      mod(anchor[1] + sign * term[1], m),
    ];
  }

  function parityIntersection(left, right) {
    const rightSet = new Set(right);
    return left.reduce((value, item) => value ^ Number(rightSet.has(item)), 0);
  }

  function syndromeFor(errorSupport, checkRows) {
    return checkRows.map(row => parityIntersection(errorSupport, row));
  }

  function xorSupport(left, right) {
    const support = new Set(left);
    right.forEach(item => {
      if (support.has(item)) support.delete(item);
      else support.add(item);
    });
    return [...support].sort((a, b) => a - b);
  }

  function inRowSpace(support, rows, n) {
    const basis = new Map();
    const reduce = values => {
      const vector = new Uint8Array(n);
      values.forEach(index => { vector[index] ^= 1; });
      for (let pivot = 0; pivot < n; pivot += 1) {
        if (!vector[pivot]) continue;
        if (!basis.has(pivot)) return {vector, pivot};
        const row = basis.get(pivot);
        for (let column = pivot; column < n; column += 1) {
          vector[column] ^= row[column];
        }
      }
      return {vector, pivot: -1};
    };
    rows.forEach(row => {
      const reduced = reduce(row);
      if (reduced.pivot >= 0) basis.set(reduced.pivot, reduced.vector);
    });
    return reduce(support).pivot < 0;
  }

  function classifyError(errorType, support, formal) {
    const syndromeRows = errorType === "X" ? formal.zChecks : formal.xChecks;
    const stabilizerRows = errorType === "X" ? formal.xChecks : formal.zChecks;
    const syndrome = syndromeFor(support, syndromeRows);
    const fired = syndrome.flatMap((value, index) => value ? [index] : []);
    if (fired.length) return {kind: "detectable", fired, syndrome, logical: []};
    if (inRowSpace(support, stabilizerRows, formal.n)) {
      return {kind: "stabilizer", fired, syndrome, logical: []};
    }
    const logical = [];
    (formal.logicalPairs || []).forEach(pair => {
      const opposite = errorType === "X" ? pair.z.zSupport : pair.x.xSupport;
      if (parityIntersection(support, opposite)) {
        logical.push(`${errorType}̅${pair.id + 1}`);
      }
    });
    return {kind: "logical", fired, syndrome, logical};
  }

  function commutationViolations(xRows, zRows) {
    const pairs = [];
    xRows.forEach((xRow, xIndex) => {
      zRows.forEach((zRow, zIndex) => {
        if (parityIntersection(xRow, zRow)) pairs.push([xIndex, zIndex]);
      });
    });
    return {count: pairs.length, pairs};
  }

  function init() {
    if (
      typeof TOUR_DATA === "undefined"
      || TOUR_DATA.tour?.version !== 2
      || typeof SceneExplorer === "undefined"
    ) return;
    const canvas = document.querySelector("[data-tour-canvas]");
    if (!canvas) return;

    const tour = TOUR_DATA.tour;
    const sourceKeys = Object.keys(TOUR_DATA.lattices);
    const $ = selector => document.querySelector(selector);
    const continuity = typeof AtlasLearnContinuity === "undefined"
      ? null
      : AtlasLearnContinuity;
    const stored = continuity?.load() || {};
    const completed = new Set(
      Array.isArray(stored.completed)
        ? stored.completed.filter(id => tour.steps.some(step => step.id === id))
        : []
    );
    const labStates = stored.labStates && typeof stored.labStates === "object"
      ? {...stored.labStates}
      : {};
    const state = {
      step: 0,
      lattice: sourceKeys[0],
      mode: "lattice",
      filter: "all",
      highlight: null,
      hover: null,
      selected: null,
    };

    const source = () => TOUR_DATA.lattices[state.lattice];
    const step = () => tour.steps[state.step];
    const formal = () => source().formal;
    const activeHighlight = () => state.selected ?? state.hover ?? state.highlight;

    function make(tag, className = "", text = "") {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== "") node.textContent = text;
      return node;
    }

    function labelledControl(label, control) {
      const wrapper = make("label", "learn-control-field");
      wrapper.append(make("span", "learn-control-label", label), control);
      return wrapper;
    }

    function option(value, label = value) {
      const node = document.createElement("option");
      node.value = String(value);
      node.textContent = String(label);
      return node;
    }

    function integerInput(value, min, max) {
      const input = document.createElement("input");
      input.type = "number";
      input.min = String(min);
      input.max = String(max);
      input.step = "1";
      input.value = String(value);
      return input;
    }

    function actionButton(label, handler, className = "") {
      const button = make("button", className, label);
      button.type = "button";
      button.addEventListener("click", handler);
      return button;
    }

    function captureLabState() {
      const controls = $("[data-learn-controls]");
      const feedback = $("[data-learn-feedback]");
      if (!controls || !controls.children.length) return;
      labStates[step().id] = {
        lattice: state.lattice,
        filter: state.filter,
        metadata: {...controls.dataset},
        fields: [...controls.querySelectorAll("input, select")].map(control => ({
          value: control.value,
          checked: Boolean(control.checked),
          type: control.type || control.tagName.toLowerCase(),
        })),
        qubits: [...controls.querySelectorAll("[data-qubit]")].flatMap(button => (
          button.getAttribute("aria-pressed") === "true"
            ? [Number(button.dataset.qubit)]
            : []
        )),
        activeView: controls.querySelector("[data-view][aria-pressed='true']")?.dataset.view || null,
        notes: [...controls.querySelectorAll(".learn-answer-note")].map(note => ({
          text: note.textContent,
          className: note.className,
        })),
        feedback: {
          text: feedback?.textContent || "",
          className: feedback?.className || "learn-feedback",
        },
      };
    }

    function restoreLabState(stepId) {
      const saved = labStates[stepId];
      const controls = $("[data-learn-controls]");
      if (!saved || !controls) return;
      Object.entries(saved.metadata || {}).forEach(([key, value]) => {
        controls.dataset[key] = value;
      });
      const fields = [...controls.querySelectorAll("input, select")];
      fields.forEach((control, index) => {
        const value = saved.fields?.[index];
        if (!value) return;
        if (control.type === "radio" || control.type === "checkbox") {
          control.checked = value.checked;
        } else {
          control.value = value.value;
        }
        const eventType = control.tagName === "SELECT" ? "change" : "input";
        control.dispatchEvent(new Event(eventType, {bubbles: true}));
      });
      const selectedQubits = new Set(saved.qubits || []);
      controls.querySelectorAll("[data-qubit]").forEach(button => {
        const desired = selectedQubits.has(Number(button.dataset.qubit));
        const current = button.getAttribute("aria-pressed") === "true";
        if (desired !== current) button.click();
      });
      if (saved.activeView) {
        [...controls.querySelectorAll("[data-view]")]
          .find(button => button.dataset.view === saved.activeView)
          ?.click();
      }
      [...controls.querySelectorAll(".learn-answer-note")].forEach((note, index) => {
        const value = saved.notes?.[index];
        if (!value) return;
        note.textContent = value.text;
        note.className = value.className;
      });
      const feedback = $("[data-learn-feedback]");
      if (feedback && saved.feedback) {
        feedback.textContent = saved.feedback.text;
        feedback.className = saved.feedback.className;
      }
    }

    function persist({replace = false, capture = true} = {}) {
      if (capture) captureLabState();
      const remote = replace ? {} : continuity?.load() || {};
      if (!replace && Array.isArray(remote.completed)) {
        remote.completed.forEach(id => {
          if (tour.steps.some(candidate => candidate.id === id)) completed.add(id);
        });
      }
      const mergedLabStates = replace
        ? {...labStates}
        : {...(remote.labStates || {}), ...labStates};
      Object.assign(labStates, mergedLabStates);
      continuity?.save({
        stepId: step().id,
        completed: [...completed],
        finished: completed.size === tour.steps.length,
        labStates: mergedLabStates,
      });
    }

    function report(correct, message) {
      const feedback = $("[data-learn-feedback]");
      feedback.className = `learn-feedback ${correct ? "is-correct" : "is-incorrect"}`;
      feedback.textContent = message;
      if (correct) completed.add(step().id);
      persist();
      renderChrome();
    }

    function originText(origin) {
      if (origin.kind === "verified") return `Origin: verified (${origin.method})`;
      const refs = Array.isArray(origin.refs) ? origin.refs : [origin.ref];
      return `Origin: curated (${refs.filter(Boolean).join(", ")})`;
    }

    function defaultMode(key) {
      const modes = new Set(TOUR_DATA.lattices[key].scene.frames.map(frame => frame.mode));
      return ["lattice", "incidence", "construction", "schedule", "data", "logical"]
        .find(mode => modes.has(mode));
    }

    function itemDetail(index) {
      if (index === null || index === undefined) {
        return "Point at a visible check, click to pin it, or use the arrow keys to select one.";
      }
      const check = source().lattice?.checks[index];
      if (!check) return "The selected scene item has no static check payload.";
      return `${check.type}-check ${index}; weight ${check.support.length}; support {${check.support.join(", ")}}.`;
    }

    function updateCameraStatus() {
      const output = $("[data-tour-camera-status]");
      if (!output) return;
      const status = SceneExplorer.cameraStatus(source().scene);
      output.textContent = status.label;
      output.setAttribute("aria-label", `Scene zoom ${status.label}`);
    }

    function renderScene() {
      SceneExplorer.render(canvas, source().scene, {
        mode: state.mode,
        round: 0,
        filter: state.filter,
        highlight: activeHighlight(),
      });
      $("[data-tour-check-detail]").textContent = itemDetail(activeHighlight());
      updateCameraStatus();
      document.querySelectorAll("[data-tour-filter]").forEach(button => {
        button.setAttribute("aria-pressed", button.dataset.tourFilter === state.filter);
      });
      document.querySelectorAll("[data-tour-lattice]").forEach(button => {
        button.setAttribute("aria-pressed", button.dataset.tourLattice === state.lattice);
      });
    }

    function renderReferenceLinks() {
      const holder = $("[data-learn-reference-links]");
      holder.replaceChildren();
      (step().reference_links || []).forEach(link => {
        const anchor = make("a", "learn-reference-link", `${link.label} ↗`);
        anchor.href = continuity
          ? continuity.referenceHref(link.href, step().id)
          : link.href;
        anchor.addEventListener("click", () => persist());
        holder.append(anchor);
      });
      document.querySelectorAll("[data-learn-reference]").forEach(anchor => {
        const rawHref = anchor.getAttribute("href");
        if (continuity && rawHref) {
          anchor.href = continuity.referenceHref(rawHref, step().id);
        }
        anchor.onclick = () => persist();
      });
    }

    function renderChrome() {
      const current = step();
      const done = completed.has(current.id);
      $("[data-tour-progress]").textContent = `Step ${state.step + 1} of ${tour.steps.length}`;
      $("[data-tour-title]").textContent = current.title;
      $("[data-learn-task]").textContent = current.task;
      $("[data-learn-chapter-label]").textContent = tour.chapters.find(
        chapter => chapter.id === current.chapter
      )?.title || current.chapter;
      const hintWrap = $("[data-learn-hint-wrap]");
      hintWrap.hidden = !current.hint;
      $("[data-learn-hint]").textContent = current.hint || "";
      const explanation = $("[data-learn-explanation]");
      explanation.hidden = !done;
      $("[data-tour-narrative]").textContent = current.narrative;
      $("[data-tour-origin]").textContent = originText(current.origin);
      $("[data-tour-refs]").textContent = current.refs?.length
        ? `References: ${current.refs.join(", ")}`
        : "";
      $("[data-tour-prev]").disabled = state.step === 0;
      const next = $("[data-tour-next]");
      const lastStep = state.step === tour.steps.length - 1;
      const graduated = completed.size === tour.steps.length;
      next.disabled = !done || (lastStep && !graduated);
      next.textContent = lastStep
        ? graduated
          ? "Graduated ✓"
          : `${tour.steps.length - completed.size} labs remain`
        : "Next →";
      const percentage = Math.round(100 * completed.size / tour.steps.length);
      $("[data-learn-overall-progress]").textContent = (
        `${completed.size} of ${tour.steps.length} labs complete · ${percentage}%`
      );
      $("[data-learn-progress-bar]").style.width = `${percentage}%`;
      document.querySelectorAll("[data-learn-step]").forEach(button => {
        const id = button.dataset.learnStep;
        const active = id === current.id;
        button.setAttribute("aria-current", active ? "step" : "false");
        button.classList.toggle("is-complete", completed.has(id));
      });
      renderReferenceLinks();
    }

    function renderAudit(interaction) {
      const controls = $("[data-learn-controls]");
      const questions = interaction.questions || [];
      const records = [];
      questions.forEach((question, questionIndex) => {
        const fieldset = make("fieldset", "learn-question");
        fieldset.append(make("legend", "", question.prompt));
        const radios = question.options.map((label, optionIndex) => {
          const wrapper = make("label", "learn-choice");
          const input = document.createElement("input");
          input.type = "radio";
          input.name = `${step().id}-${questionIndex}`;
          input.value = String(optionIndex);
          wrapper.append(input, make("span", "", label));
          fieldset.append(wrapper);
          return input;
        });
        const note = make("p", "learn-answer-note");
        fieldset.append(note);
        controls.append(fieldset);
        records.push({question, radios, note});
      });
      controls.append(actionButton("Check my audit", () => {
        let complete = true;
        let correct = true;
        records.forEach(record => {
          const selected = record.radios.find(input => input.checked);
          if (!selected) {
            complete = false;
            record.note.textContent = "Choose one answer.";
            record.note.className = "learn-answer-note is-incorrect";
            return;
          }
          const matches = Number(selected.value) === record.question.correct;
          correct = correct && matches;
          const explanation = record.question.explanation || (
            matches
              ? "That conclusion matches what the synchronized evidence licenses."
              : "Keep exact object mappings separate from broader physical interpretations."
          );
          record.note.textContent = matches
            ? `Correct. ${explanation}`
            : `Not yet. ${explanation}`;
          record.note.className = `learn-answer-note ${matches ? "is-correct" : "is-incorrect"}`;
        });
        if (!complete) report(false, "Complete every evidence decision before checking.");
        else if (correct) report(true, "Audit passed. The claim keeps its scope, evidence, and missing obligations attached.");
        else report(false, "At least one inference still overreaches the available evidence.");
      }, "learn-check-button"));
    }

    function termsFor(block) {
      const params = source().params;
      return block === "B" ? params.b_terms : params.a_terms;
    }

    function supportFromTerms(anchor, terms, blockOffset, reverse = false) {
      return terms.reduce((support, term) => {
        const destination = translationDestination(
          anchor,
          term,
          source().params.l,
          source().params.m,
          reverse
        );
        const index = destination[0] * source().params.m + destination[1] + blockOffset;
        return xorSupport(support, [index]);
      }, []);
    }

    function renderTranslation(interaction) {
      const controls = $("[data-learn-controls]");
      const params = source().params;
      const anchorX = integerInput(interaction.anchor?.[0] || 0, 0, params.l - 1);
      const anchorY = integerInput(interaction.anchor?.[1] || 0, 0, params.m - 1);
      controls.append(
        labelledControl("Anchor x", anchorX),
        labelledControl("Anchor y", anchorY)
      );
      if (interaction.assemble) {
        const predictedWeight = integerInput(0, 0, formal().n);
        controls.append(labelledControl("Predicted row weight", predictedWeight));
        controls.append(actionButton("Assemble and compare", () => {
          const anchor = [Number(anchorX.value), Number(anchorY.value)];
          const blockSize = params.l * params.m;
          const support = xorSupport(
            supportFromTerms(anchor, params.a_terms, 0),
            supportFromTerms(anchor, params.b_terms, blockSize)
          );
          const rowIndex = anchor[0] * params.m + anchor[1];
          const exact = formal().xChecks[rowIndex];
          state.highlight = rowIndex;
          state.filter = "X";
          state.selected = null;
          renderScene();
          const matches = JSON.stringify(support) === JSON.stringify(exact);
          const correct = Number(predictedWeight.value) === exact.length && matches;
          report(correct, correct
            ? `Verified H_X row ${rowIndex}: A|B support {${exact.join(", ")}} and weight ${exact.length}.`
            : `A contributes ${params.a_terms.length} endpoints and B contributes ${params.b_terms.length}; after binary cancellation the exact support is {${exact.join(", ")}}, so the row weight is ${exact.length}. The two blocks are coordinates, not device layers.`);
        }, "learn-check-button"));
        return;
      }

      const block = document.createElement("select");
      ["A", "B"].forEach(value => block.append(option(value)));
      block.value = interaction.block || "A";
      const term = document.createElement("select");
      const direction = document.createElement("select");
      direction.append(option("forward", "row incidence (+ exponent)"));
      direction.append(option("reverse", "transposed row incidence (− exponent)"));
      direction.value = interaction.reverse ? "reverse" : "forward";
      const predictedX = integerInput(0, 0, params.l - 1);
      const predictedY = integerInput(0, 0, params.m - 1);

      function updateTerms() {
        term.replaceChildren();
        termsFor(block.value).forEach((value, index) => {
          term.append(option(index, `x^${value[0]} y^${value[1]}`));
        });
        const requested = termsFor(block.value).findIndex(value => (
          value[0] === interaction.term?.[0] && value[1] === interaction.term?.[1]
        ));
        term.value = String(Math.max(0, requested));
      }
      block.addEventListener("change", updateTerms);
      updateTerms();
      controls.append(
        labelledControl("Polynomial block", block),
        labelledControl("Monomial", term),
        labelledControl("Direction", direction),
        labelledControl("Predict destination x", predictedX),
        labelledControl("Predict destination y", predictedY)
      );
      controls.append(actionButton("Check wrapped move", () => {
        const anchor = [Number(anchorX.value), Number(anchorY.value)];
        const selectedTerm = termsFor(block.value)[Number(term.value)];
        const reverse = direction.value === "reverse";
        const destination = translationDestination(
          anchor, selectedTerm, params.l, params.m, reverse
        );
        const correct = Number(predictedX.value) === destination[0]
          && Number(predictedY.value) === destination[1];
        const wrapped = (
          anchor[0] + (reverse ? -1 : 1) * selectedTerm[0] !== destination[0]
          || anchor[1] + (reverse ? -1 : 1) * selectedTerm[1] !== destination[1]
        );
        const polynomialColumn = destination[0] * params.m + destination[1];
        const blockSize = params.l * params.m;
        const cssColumn = reverse
          ? polynomialColumn + (block.value === "A" ? blockSize : 0)
          : polynomialColumn + (block.value === "B" ? blockSize : 0);
        const matrixNote = reverse
          ? `The transposed ${block.value} move occupies H_Z column ${cssColumn}.`
          : `The ${block.value} block of H_X records column ${cssColumn}.`;
        report(correct, correct
          ? `Correct row incidence: anchor (${anchor.join(",")}) → nonzero column (${destination.join(",")})${wrapped ? " with wraparound" : ""}. ${matrixNote}`
          : `For this row-incidence convention, compute (${anchor[0]} ${reverse ? "−" : "+"} ${selectedTerm[0]}) mod ${params.l} and (${anchor[1]} ${reverse ? "−" : "+"} ${selectedTerm[1]}) mod ${params.m}. The nonzero column coordinate is (${destination.join(",")}); column-vector action would use the opposite direction.`);
      }, "learn-check-button"));
    }

    function renderCommutation(interaction) {
      const controls = $("[data-learn-controls]");
      const candidates = formal().twoBlockCandidates;
      const candidate = document.createElement("select");
      candidate.append(option("swapped", "[Bᵀ | Aᵀ] (swapped)"));
      candidate.append(option("unswapped", "[Aᵀ | Bᵀ] (unswapped)"));
      candidate.value = interaction.candidate || "swapped";
      const xRow = integerInput(interaction.x_row || 0, 0, formal().xChecks.length - 1);
      const zRow = integerInput(interaction.z_row || 0, 0, formal().zChecks.length - 1);
      const prediction = document.createElement("select");
      prediction.append(option("commutes", "commutes for every row pair"));
      prediction.append(option("violates", "has at least one odd overlap"));
      controls.append(
        labelledControl("Z construction", candidate),
        labelledControl("Inspect X row", xRow),
        labelledControl("Inspect Z row", zRow),
        labelledControl("Prediction", prediction)
      );
      controls.append(actionButton("Compute selected overlap and full commutator", () => {
        const zRows = candidate.value === "swapped"
          ? candidates.swappedZChecks
          : candidates.unswappedZChecks;
        const xIndex = Number(xRow.value);
        const zIndex = Number(zRow.value);
        const intersection = formal().xChecks[xIndex].filter(index => zRows[zIndex].includes(index));
        const violations = commutationViolations(formal().xChecks, zRows);
        const predictsCommutes = prediction.value === "commutes";
        const correct = predictsCommutes === (violations.count === 0);
        state.filter = "Z";
        state.highlight = formal().xChecks.length + zIndex;
        state.selected = null;
        renderScene();
        report(correct, (
          `Selected overlap {${intersection.join(", ") || "∅"}} has parity ${intersection.length % 2}; `
          + `${violations.count} odd row-pair violation${violations.count === 1 ? "" : "s"} across the full matrix. `
          + (correct ? "Your prediction matches the computed commutator." : "Revise which construction commutes globally.")
        ));
      }, "learn-check-button"));
    }

    function renderSyndrome(interaction) {
      const controls = $("[data-learn-controls]");
      if (!formal()) {
        controls.append(make("p", "empty-state", "No exact CSS matrix is exported for this instance."));
        return;
      }
      const errorType = document.createElement("select");
      errorType.append(option("X", "X error (observed by Z checks)"));
      errorType.append(option("Z", "Z error (observed by X checks)"));
      errorType.value = interaction.error_type || "X";
      controls.append(labelledControl("Error Pauli", errorType));
      let support = interaction.preset ? [...interaction.preset] : [];
      if (interaction.preset_logical) {
        const pair = formal().logicalPairs[interaction.preset_logical.pair];
        const pauli = pair?.[interaction.preset_logical.pauli];
        support = [...(pauli?.xSupport?.length ? pauli.xSupport : pauli?.zSupport || [])];
      }
      const supportReadout = make("output", "learn-support-readout");
      const qubitArea = make("div", "learn-qubit-grid");
      const qubitButtons = [];
      const refreshSupport = () => {
        supportReadout.textContent = `Error support {${support.join(", ") || "∅"}}`;
        qubitButtons.forEach(button => {
          button.setAttribute("aria-pressed", support.includes(Number(button.dataset.qubit)));
        });
      };
      for (let index = 0; index < formal().n; index += 1) {
        const button = actionButton(String(index), () => {
          support = support.includes(index)
            ? support.filter(value => value !== index)
            : [...support, index].sort((a, b) => a - b);
          refreshSupport();
        }, "learn-qubit-toggle");
        button.dataset.qubit = String(index);
        button.setAttribute("aria-label", `Toggle qubit ${index}`);
        qubitArea.append(button);
        qubitButtons.push(button);
      }
      controls.append(supportReadout, qubitArea);
      refreshSupport();

      if (interaction.mode === "coset") {
        const stabilizerIndex = integerInput(
          interaction.stabilizer_index || 0,
          0,
          formal().xChecks.length - 1
        );
        controls.append(labelledControl("Same-type stabilizer row", stabilizerIndex));
        controls.append(actionButton("1 · Compute current syndrome", () => {
          const result = classifyError(errorType.value, support, formal());
          controls.dataset.baselineSyndrome = result.syndrome.join("");
          report(false, `Baseline fired checks: {${result.fired.join(", ") || "∅"}}. Now add a stabilizer and compare.`);
        }));
        controls.append(actionButton("2 · Add stabilizer and compare", () => {
          const baseline = controls.dataset.baselineSyndrome || null;
          if (baseline === null) {
            report(false, "Compute the baseline syndrome first.");
            return;
          }
          const rows = errorType.value === "X" ? formal().xChecks : formal().zChecks;
          support = xorSupport(support, rows[Number(stabilizerIndex.value)]);
          refreshSupport();
          const result = classifyError(errorType.value, support, formal());
          const same = result.syndrome.join("") === baseline;
          const stabilizerTerm = errorType.value === "X" ? "coboundary" : "boundary";
          report(same, same
            ? `Syndrome unchanged: fired checks {${result.fired.join(", ") || "∅"}}. The support changed by a stabilizer ${stabilizerTerm}.`
            : "The syndrome changed; inspect the selected same-type stabilizer row.");
        }, "learn-check-button"));
        return;
      }

      const prediction = document.createElement("select");
      prediction.append(option("detectable", "detectable (nonzero syndrome)"));
      prediction.append(option("stabilizer", "stabilizer-trivial zero-syndrome Pauli"));
      prediction.append(option("logical", "logical zero-syndrome Pauli"));
      controls.append(labelledControl("Predict classification", prediction));
      controls.append(actionButton("Compute syndrome and class", () => {
        const result = classifyError(errorType.value, support, formal());
        const correct = prediction.value === result.kind;
        const logical = result.logical.length
          ? ` Logical signature: ${result.logical.join(", ")}.`
          : result.kind === "logical"
            ? " Logical basis is intentionally not exported for this instance."
            : "";
        const closedTerm = errorType.value === "X" ? "cocycle" : "cycle";
        const stabilizerTerm = errorType.value === "X" ? "coboundary" : "boundary";
        const reason = result.kind === "detectable"
          ? `${result.fired.length} opposite-type checks fire, so the syndrome is nonzero.`
          : result.kind === "stabilizer"
            ? `The syndrome is zero and the support reduces into the same-type stabilizer row space: a ${stabilizerTerm}.`
            : `The syndrome is zero, but the support is outside the same-type stabilizer row space: a ${closedTerm} that is not a ${stabilizerTerm}.`;
        report(correct, (
          `Fired opposite-type checks: {${result.fired.join(", ") || "∅"}}. `
          + `${reason} Classification: ${result.kind}.${logical} `
          + (correct ? "Your prediction matches." : "Revise the prediction and try a changed support.")
        ));
      }, "learn-check-button"));
    }

    function distanceOrigin() {
      const claim = (source().claims || []).find(item => item.property === "d");
      return claim?.origin?.kind || "unknown";
    }

    function renderRank(interaction) {
      const controls = $("[data-learn-controls]");
      const rows = interaction.check_type === "Z" ? formal().zChecks : formal().xChecks;
      const row = rows[interaction.check_index || 0];
      const weight = integerInput(0, 0, formal().n);
      const encoded = integerInput(0, 0, formal().n);
      const provenance = document.createElement("select");
      ["verified", "bounded", "claimed"].forEach(value => provenance.append(option(value)));
      controls.append(
        labelledControl("Predicted check weight", weight),
        labelledControl("Predicted k", encoded),
        labelledControl("Distance evidence", provenance)
      );
      controls.append(actionButton("Ask the matrices and claims", () => {
        const expectedK = formal().n - formal().ranks.X - formal().ranks.Z;
        const expectedOrigin = distanceOrigin();
        const correct = Number(weight.value) === row.length
          && Number(encoded.value) === expectedK
          && provenance.value === expectedOrigin;
        report(correct, (
          `Computed: n=${formal().n}, ranks (${formal().ranks.X}, ${formal().ranks.Z}), `
          + `k=${formal().n}−${formal().ranks.X}−${formal().ranks.Z}=${expectedK}; `
          + `selected weight=${row.length}; d origin=${expectedOrigin}. `
          + (correct ? "All three obligations are separated correctly." : "At least one prediction confuses term count, rank, or provenance.")
        ));
      }, "learn-check-button"));
    }

    function renderRepresentation(interaction) {
      const controls = $("[data-learn-controls]");
      const type = document.createElement("select");
      type.append(option("X"), option("Z"));
      type.value = interaction.check_type || "X";
      const index = integerInput(interaction.check_index || 0, 0, formal().xChecks.length - 1);
      const view = make("div", "learn-representation-view");
      const viewButtons = make("div", "learn-representation-tabs");
      const views = ["polynomial", "matrix", "Tanner", "chain", "curated boundary"];
      function syncScene() {
        const rows = type.value === "X" ? formal().xChecks : formal().zChecks;
        index.max = String(rows.length - 1);
        index.value = String(Math.max(0, Math.min(rows.length - 1, Number(index.value))));
        state.filter = type.value;
        state.highlight = (type.value === "X" ? 0 : formal().xChecks.length) + Number(index.value);
        state.hover = null;
        state.selected = null;
        renderScene();
      }
      function showView(name) {
        const rows = type.value === "X" ? formal().xChecks : formal().zChecks;
        const selected = rows[Math.max(0, Math.min(rows.length - 1, Number(index.value)))] || [];
        const params = source().params;
        const terms = type.value === "X"
          ? `A=${JSON.stringify(params.a_terms)}, B=${JSON.stringify(params.b_terms)}`
          : `Bᵀ and Aᵀ reverse the same term translations`;
        const messages = {
          polynomial: `${type.value} family: ${terms}. Row index fixes the torus anchor.`,
          matrix: `Binary row support {${selected.join(", ")}}; weight ${selected.length}.`,
          Tanner: `One ${type.value}-check node is adjacent exactly to data nodes {${selected.join(", ")}}.`,
          chain: type.value === "X"
            ? `For X errors, ker(∂₂ᵀ) contains cocycles and im(∂₁ᵀ) contains coboundaries. This X-check row of ∂₁=[A|B], viewed as a column of ∂₁ᵀ, is a coboundary generator in the dual complex.`
            : `For Z errors, ker(∂₁) contains cycles and im(∂₂) contains boundaries. This Z-check row ∂₂ᵀ=[Bᵀ|Aᵀ], transposed back to a column of ∂₂, is a boundary generator in the primal complex.`,
          "curated boundary": "Quotient, anyon, cylinder, coupling-layer, and hardware readings require additional scoped evidence; this exact row does not identify them by itself.",
        };
        view.textContent = messages[name];
        [...viewButtons.children].forEach(button => {
          button.setAttribute("aria-pressed", button.dataset.view === name);
        });
        syncScene();
      }
      views.forEach(name => {
        const button = actionButton(name, () => showView(name));
        button.dataset.view = name;
        viewButtons.append(button);
      });
      controls.append(
        labelledControl("Check family", type),
        labelledControl("Row index", index),
        viewButtons,
        view
      );
      type.addEventListener("change", () => showView("matrix"));
      index.addEventListener("input", () => showView("matrix"));
      showView("polynomial");
      renderAudit({questions: [interaction.question]});
    }

    function renderLab() {
      const current = step();
      const controls = $("[data-learn-controls]");
      const feedback = $("[data-learn-feedback]");
      controls.replaceChildren();
      feedback.className = "learn-feedback";
      feedback.textContent = completed.has(current.id)
        ? "Completed earlier. Re-run the computation or continue when ready."
        : "Make a prediction, then ask the governed data.";
      $("[data-learn-lab-title]").textContent = `${current.title} · ${source().label}`;
      const interaction = current.interaction;
      if (interaction.kind === "audit") renderAudit(interaction);
      else if (interaction.kind === "translation") renderTranslation(interaction);
      else if (interaction.kind === "commutation") renderCommutation(interaction);
      else if (interaction.kind === "syndrome") renderSyndrome(interaction);
      else if (interaction.kind === "rank") renderRank(interaction);
      else if (interaction.kind === "representation") renderRepresentation(interaction);
      restoreLabState(current.id);
    }

    function stepIndexFromHash() {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const id = params.get("step");
      return tour.steps.findIndex(candidate => candidate.id === id);
    }

    function applyStep(index, historyMode = "push") {
      const previousControls = $("[data-learn-controls]");
      if (previousControls?.children.length) {
        captureLabState();
        persist({capture: false});
      }
      state.step = Math.max(0, Math.min(tour.steps.length - 1, index));
      const next = step().state || {};
      state.lattice = next.lattice || sourceKeys[0];
      state.mode = next.mode || defaultMode(state.lattice);
      state.filter = next.filter || "all";
      const saved = labStates[step().id];
      if (saved?.lattice && sourceKeys.includes(saved.lattice)) {
        state.lattice = saved.lattice;
        state.mode = defaultMode(state.lattice);
      }
      if (["all", "X", "Y", "Z"].includes(saved?.filter)) {
        state.filter = saved.filter;
      }
      state.highlight = Number.isInteger(next.highlight) ? next.highlight : null;
      state.hover = null;
      state.selected = null;
      const hash = `#step=${encodeURIComponent(step().id)}`;
      if (historyMode === "push" && window.location.hash !== hash) {
        window.history.pushState({learnStep: step().id}, "", hash);
      } else if (historyMode === "replace" && window.location.hash !== hash) {
        window.history.replaceState({learnStep: step().id}, "", hash);
      }
      renderScene();
      renderChrome();
      renderLab();
      persist({capture: false});
      window.scrollTo?.({top: 0, behavior: historyMode === "push" ? "smooth" : "auto"});
    }

    $("[data-tour-prev]").addEventListener("click", () => applyStep(state.step - 1));
    $("[data-tour-next]").addEventListener("click", () => {
      if (completed.has(step().id) && state.step < tour.steps.length - 1) {
        applyStep(state.step + 1);
      }
    });
    document.querySelectorAll("[data-learn-step]").forEach(button => {
      button.addEventListener("click", () => {
        const index = tour.steps.findIndex(candidate => candidate.id === button.dataset.learnStep);
        if (index >= 0) applyStep(index);
      });
    });
    document.querySelectorAll("[data-tour-filter]").forEach(button => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.tourFilter;
        state.highlight = null;
        state.hover = null;
        state.selected = null;
        renderScene();
      });
    });
    document.querySelectorAll("[data-tour-lattice]").forEach(button => {
      button.addEventListener("click", () => {
        state.lattice = button.dataset.tourLattice;
        state.mode = defaultMode(state.lattice);
        state.highlight = null;
        state.hover = null;
        state.selected = null;
        completed.delete(step().id);
        delete labStates[step().id];
        renderScene();
        renderChrome();
        renderLab();
        persist({replace: true, capture: false});
      });
    });
    $("[data-learn-reset-lab]").addEventListener("click", () => {
      completed.delete(step().id);
      delete labStates[step().id];
      renderChrome();
      renderLab();
      persist({replace: true, capture: false});
    });
    $("[data-learn-start-over]").addEventListener("click", () => {
      completed.clear();
      Object.keys(labStates).forEach(id => { delete labStates[id]; });
      $("[data-learn-controls]").replaceChildren();
      continuity?.clear();
      applyStep(0, "replace");
    });
    const controlsRoot = $("[data-learn-controls]");
    ["input", "change", "click"].forEach(eventType => {
      controlsRoot.addEventListener(eventType, () => {
        window.setTimeout(() => persist(), 0);
      });
    });

    function changeZoom(factor, point = null) {
      SceneExplorer.zoomAt(
        source().scene,
        canvas,
        point || [canvas.width / 2, canvas.height / 2],
        factor
      );
      state.hover = null;
      renderScene();
    }
    $("[data-tour-zoom-in]").addEventListener("click", () => changeZoom(1.25));
    $("[data-tour-zoom-out]").addEventListener("click", () => changeZoom(0.8));
    $("[data-tour-camera-reset]").addEventListener("click", () => {
      SceneExplorer.resetView(source().scene);
      state.hover = null;
      renderScene();
    });

    function pointItem(event) {
      const point = SceneExplorer.eventPoint(canvas, event);
      if (point === null) return null;
      return SceneExplorer.nearestItem(
        canvas,
        source().scene,
        {mode: state.mode, round: 0, filter: state.filter},
        point[0],
        point[1]
      );
    }

    let drag = null;
    canvas.addEventListener("pointerdown", event => {
      if (event.button !== undefined && event.button !== 0) return;
      const point = SceneExplorer.eventPoint(canvas, event);
      if (point === null) return;
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
      if (drag) {
        const point = SceneExplorer.eventPoint(canvas, event);
        if (point === null) return;
        if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 4) {
          drag.moved = true;
        }
        if (drag.moved) {
          SceneExplorer.panBy(
            source().scene,
            point[0] - drag.lastPoint[0],
            point[1] - drag.lastPoint[1]
          );
          drag.lastPoint = point;
          state.hover = null;
          renderScene();
        }
        return;
      }
      if (event.pointerType === "touch") return;
      const next = pointItem(event);
      if (next !== state.hover) {
        state.hover = next;
        renderScene();
      }
    });
    canvas.addEventListener("pointerup", event => {
      if (!drag) return;
      if (!drag.moved) {
        const item = pointItem(event);
        state.selected = state.selected === item ? null : item;
        state.hover = null;
        renderScene();
      }
      if (canvas.hasPointerCapture?.(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      drag = null;
    });
    canvas.addEventListener("pointercancel", () => { drag = null; });
    canvas.addEventListener("pointerleave", () => {
      if (!drag && state.hover !== null) {
        state.hover = null;
        renderScene();
      }
    });
    canvas.addEventListener("wheel", event => {
      const point = SceneExplorer.eventPoint(canvas, event);
      if (point === null) return;
      event.preventDefault();
      changeZoom(Math.exp(-event.deltaY * 0.0015), point);
    }, {passive: false});
    canvas.addEventListener("keydown", event => {
      if (["+", "="].includes(event.key)) {
        event.preventDefault();
        changeZoom(1.25);
        return;
      }
      if (event.key === "-") {
        event.preventDefault();
        changeZoom(0.8);
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        SceneExplorer.resetView(source().scene);
        renderScene();
        return;
      }
      const direction = {ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1}[event.key];
      if (!direction) return;
      event.preventDefault();
      const visible = (source().lattice?.checks || []).flatMap((check, index) => (
        state.filter === "all" || check.type === state.filter ? [index] : []
      ));
      if (!visible.length) return;
      const current = visible.indexOf(state.selected ?? state.highlight);
      state.selected = visible[mod(current + direction, visible.length)];
      state.hover = null;
      renderScene();
    });
    SceneExplorer.observeResize(canvas, () => {
      state.hover = null;
      renderScene();
    });

    const handleHistory = () => {
      const index = stepIndexFromHash();
      if (index >= 0 && index !== state.step) applyStep(index, "none");
    };
    window.addEventListener("popstate", handleHistory);

    let initial = stepIndexFromHash();
    if (initial < 0 && stored.stepId) {
      initial = tour.steps.findIndex(candidate => candidate.id === stored.stepId);
    }
    applyStep(initial >= 0 ? initial : 0, "replace");
  }

  document.addEventListener("DOMContentLoaded", init);
  return {
    init,
    classifyError,
    commutationViolations,
    inRowSpace,
    parityIntersection,
    syndromeFor,
    translationDestination,
    xorSupport,
  };
})();
