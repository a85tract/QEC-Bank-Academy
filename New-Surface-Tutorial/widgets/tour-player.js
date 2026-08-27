/* Generic Atlas guided-tour player. Entry-specific narrative and view state
   live in tour.yaml; Scene v2 geometry comes from constructor-derived data. */
const AtlasTourPlayer = (() => {
  "use strict";

  function init() {
    if (
      typeof TOUR_DATA === "undefined"
      || typeof SceneExplorer === "undefined"
    ) return;
    const canvas = document.querySelector("[data-tour-canvas]");
    if (!canvas) return;

    const tour = TOUR_DATA.tour;
    const sourceKeys = Object.keys(TOUR_DATA.lattices);
    const hasMode = (key, mode) => (
      TOUR_DATA.lattices[key].scene.frames.some(frame => frame.mode === mode)
    );
    const defaultMode = key => [
      "lattice",
      "incidence",
      "construction",
      "schedule",
      "data",
      "logical",
    ].find(mode => hasMode(key, mode));
    const state = {
      step: 0,
      lattice: sourceKeys[0],
      mode: defaultMode(sourceKeys[0]),
      round: 0,
      filter: "all",
      highlight: null,
      hover: null,
      selected: null,
      freeExplore: false,
    };

    const $ = selector => document.querySelector(selector);
    const source = () => TOUR_DATA.lattices[state.lattice];
    const step = () => tour.steps[state.step];
    const activeHighlight = () => (
      state.selected ?? state.hover ?? state.highlight
    );

    function annotation(itemIndex) {
      const byMode = tour.item_notes?.[state.lattice]?.[state.mode] || {};
      if (byMode[String(itemIndex)]) return byMode[String(itemIndex)];
      const legacy = state.mode === "lattice"
        ? tour.check_notes?.[state.lattice] || {}
        : {};
      return legacy[String(itemIndex)] || null;
    }

    function latticeDetail(checkIndex) {
      if (checkIndex === null || checkIndex === undefined) {
        return "Point at a visible check to preview it; select it to keep the detail.";
      }
      const check = source().lattice?.checks[checkIndex];
      if (!check) return "The selected scene object has no check payload.";
      const note = annotation(checkIndex);
      const prefix = `${check.type}-check ${checkIndex}; support {${check.support.join(", ")}}.`;
      return note ? `${note.label}. ${note.explanation} ${prefix}` : prefix;
    }

    function selectedRound() {
      const schedule = source().schedule;
      const index = Math.max(
        0,
        Math.min(schedule.rounds.length - 1, state.round || 0)
      );
      return schedule.rounds[index];
    }

    function roundLabel() {
      const period = source().schedule.rounds.length;
      const index = Math.max(0, Math.min(period - 1, state.round || 0));
      return `Round ${index + 1} of ${period} · t mod ${period} = ${index}`;
    }

    function scheduleDetail(itemIndex) {
      if (itemIndex === null || itemIndex === undefined) {
        return "Point at a visible measurement to preview it; select it to keep the detail.";
      }
      const measurement = selectedRound().measurements[itemIndex];
      if (!measurement) {
        return "The selected scene object has no measurement payload.";
      }
      return (
        `${measurement.type} measurement ${measurement.index}; `
        + `qubits {${measurement.support.join(", ")}}; `
        + `operator ${measurement.pauli}.`
      );
    }

    function logicalDetail(itemIndex) {
      if (itemIndex === null || itemIndex === undefined) {
        return (
          "Point at a logical path to preview it; select it to keep the detail."
        );
      }
      const logical = source().lattice?.logicalOperators?.[itemIndex];
      if (!logical) {
        return "The selected scene object has no logical-operator payload.";
      }
      const note = annotation(itemIndex);
      const prefix = (
        `${logical.label}; ${logical.type}-type logical; `
        + `weight ${logical.support.length}; `
        + `support {${logical.support.join(", ")}}.`
      );
      return note ? `${note.label}. ${note.explanation} ${prefix}` : prefix;
    }

    function formalRelationDetail(itemIndex) {
      if (itemIndex === null || itemIndex === undefined) {
        return (
          "Point at a formal relation to preview it; select it to keep the detail."
        );
      }
      const selectedFrame = source().scene.frames.find(
        candidate => candidate.mode === state.mode
      );
      const object = selectedFrame?.objects.find(
        candidate => candidate.item === itemIndex
      );
      if (!object) {
        return "The selected scene object has no formal-relation payload.";
      }
      const note = annotation(itemIndex);
      const prefix = object.label || `${state.mode} item ${itemIndex}.`;
      return note ? `${note.label}. ${note.explanation} ${prefix}` : prefix;
    }

    function itemDetail(itemIndex) {
      if (state.mode === "data") {
        return (
          "Numbered black points are constructor-derived data qubits on "
          + "lattice edges."
        );
      }
      if (state.mode === "schedule") return scheduleDetail(itemIndex);
      if (state.mode === "logical") return logicalDetail(itemIndex);
      if (state.mode === "incidence" || state.mode === "construction") {
        return formalRelationDetail(itemIndex);
      }
      return latticeDetail(itemIndex);
    }

    function updateDetail() {
      const detail = $("[data-tour-check-detail]");
      if (detail) detail.textContent = itemDetail(activeHighlight());
    }

    function updateCameraStatus() {
      const output = $("[data-tour-camera-status]");
      if (!output) return;
      const status = SceneExplorer.cameraStatus(source().scene);
      output.textContent = status.label;
      output.setAttribute("aria-label", `Scene zoom ${status.label}`);
    }

    function updateModeControls() {
      document.querySelectorAll("[data-tour-mode]").forEach(button => {
        const mode = button.dataset.tourMode;
        button.setAttribute("aria-pressed", mode === state.mode);
        button.disabled = !hasMode(state.lattice, mode);
      });
      const filterControl = $("[data-tour-filter-control]");
      if (filterControl) filterControl.hidden = state.mode === "data";
      document.querySelectorAll("[data-tour-filter]").forEach(button => {
        button.disabled = state.mode === "data";
      });
      const roundControl = $("[data-tour-round-control]");
      const roundInput = $("[data-tour-round]");
      const roundLabelOutput = $("[data-tour-round-label]");
      const roundPrevious = $("[data-tour-round-prev]");
      const roundNext = $("[data-tour-round-next]");
      const scheduleMode = state.mode === "schedule";
      if (roundControl) roundControl.hidden = !scheduleMode;
      if (!roundInput) return;
      roundInput.disabled = !scheduleMode;
      if (!scheduleMode) return;
      const schedule = source().schedule;
      roundInput.min = "0";
      roundInput.max = String(schedule.rounds.length - 1);
      roundInput.step = "1";
      roundInput.value = String(state.round);
      const label = roundLabel();
      roundInput.setAttribute("aria-valuetext", label);
      if (roundLabelOutput) roundLabelOutput.textContent = label;
      if (roundPrevious) roundPrevious.disabled = schedule.rounds.length < 2;
      if (roundNext) roundNext.disabled = schedule.rounds.length < 2;
    }

    function renderScene() {
      SceneExplorer.render(canvas, source().scene, {
        mode: state.mode,
        round: state.round,
        filter: state.filter,
        highlight: activeHighlight(),
      });
      updateDetail();
      updateCameraStatus();
    }

    function renderChrome() {
      const guidedStep = step();
      const origin = state.freeExplore
        ? source().scene.origin
        : guidedStep.origin;
      $("[data-tour-progress]").textContent = state.freeExplore
        ? `Free explore · ${state.step + 1} / ${tour.steps.length}`
        : `${state.step + 1} / ${tour.steps.length}`;
      $("[data-tour-title]").textContent = state.freeExplore
        ? "Free exploration"
        : guidedStep.title;
      $("[data-tour-narrative]").textContent = state.freeExplore
        ? (
          "You changed the guided view. Inspect the current formal data and "
          + "filters directly; Previous or Next resumes the guided sequence."
        )
        : guidedStep.narrative;
      $("[data-tour-origin]").textContent = origin.kind === "verified"
        ? `Origin: verified (${origin.method})`
        : `Origin: curated (${origin.ref})`;
      $("[data-tour-refs]").textContent = !state.freeExplore && guidedStep.refs?.length
        ? `References: ${guidedStep.refs.join(", ")}`
        : "";
      $("[data-tour-prev]").disabled = state.step === 0;
      $("[data-tour-next]").disabled = state.step === tour.steps.length - 1;
      document.querySelectorAll("[data-tour-filter]").forEach(button => {
        button.setAttribute(
          "aria-pressed",
          button.dataset.tourFilter === state.filter
        );
      });
      document.querySelectorAll("[data-tour-lattice]").forEach(button => {
        button.setAttribute(
          "aria-pressed",
          button.dataset.tourLattice === state.lattice
        );
      });
      updateModeControls();
    }

    function render() {
      renderScene();
      renderChrome();
    }

    function clearInteraction() {
      state.hover = null;
      state.selected = null;
    }

    function applyStep(index) {
      state.step = Math.max(0, Math.min(tour.steps.length - 1, index));
      state.freeExplore = false;
      const next = step().state || {};
      state.lattice = next.lattice || sourceKeys[0];
      state.mode = next.mode || defaultMode(state.lattice);
      state.round = Number.isInteger(next.round) ? next.round : 0;
      state.filter = state.mode === "data" ? "all" : next.filter || "all";
      state.highlight = Number.isInteger(next.highlight) ? next.highlight : null;
      clearInteraction();
      render();
    }

    function setRound(index, wrap = false) {
      if (state.mode !== "schedule") return;
      state.freeExplore = true;
      const period = source().schedule.rounds.length;
      state.round = wrap
        ? ((index % period) + period) % period
        : Math.max(0, Math.min(period - 1, index));
      state.highlight = null;
      clearInteraction();
      render();
    }

    function pointItem(event) {
      const point = SceneExplorer.eventPoint(canvas, event);
      if (point === null) return null;
      return SceneExplorer.nearestItem(
        canvas,
        source().scene,
        {
          mode: state.mode,
          round: state.round,
          filter: state.filter,
        },
        point[0],
        point[1]
      );
    }

    function changeZoom(factor, point = null) {
      const center = point || [canvas.width / 2, canvas.height / 2];
      SceneExplorer.zoomAt(source().scene, canvas, center, factor);
      state.hover = null;
      renderScene();
    }

    $("[data-tour-prev]").addEventListener("click", () => applyStep(state.step - 1));
    $("[data-tour-next]").addEventListener("click", () => applyStep(state.step + 1));
    document.querySelectorAll("[data-tour-filter]").forEach(button => {
      button.addEventListener("click", () => {
        state.freeExplore = true;
        state.filter = button.dataset.tourFilter;
        state.highlight = null;
        clearInteraction();
        render();
      });
    });
    document.querySelectorAll("[data-tour-lattice]").forEach(button => {
      button.addEventListener("click", () => {
        state.freeExplore = true;
        state.lattice = button.dataset.tourLattice;
        if (!hasMode(state.lattice, state.mode)) {
          state.mode = defaultMode(state.lattice);
        }
        state.round = 0;
        state.highlight = null;
        clearInteraction();
        render();
      });
    });
    document.querySelectorAll("[data-tour-mode]").forEach(button => {
      button.addEventListener("click", () => {
        const mode = button.dataset.tourMode;
        if (!hasMode(state.lattice, mode)) return;
        state.freeExplore = true;
        state.mode = mode;
        state.round = 0;
        state.filter = "all";
        state.highlight = null;
        clearInteraction();
        render();
      });
    });

    const roundInput = $("[data-tour-round]");
    if (roundInput) {
      roundInput.addEventListener("input", () => {
        setRound(Number.parseInt(roundInput.value, 10) || 0);
      });
      roundInput.addEventListener("keydown", event => {
        const keys = {
          ArrowLeft: -1,
          ArrowDown: -1,
          ArrowRight: 1,
          ArrowUp: 1,
        };
        if (event.key === "Home") {
          event.preventDefault();
          setRound(0);
          return;
        }
        if (event.key === "End") {
          event.preventDefault();
          setRound(source().schedule.rounds.length - 1);
          return;
        }
        if (!(event.key in keys)) return;
        event.preventDefault();
        setRound(state.round + keys[event.key]);
      });
      let draggingRound = false;
      const roundFromPointer = event => {
        const rect = roundInput.getBoundingClientRect();
        if (!rect.width) return;
        const ratio = Math.max(
          0,
          Math.min(1, (event.clientX - rect.left) / rect.width)
        );
        setRound(Math.round(ratio * (source().schedule.rounds.length - 1)));
      };
      roundInput.addEventListener("pointerdown", event => {
        draggingRound = true;
        roundInput.setPointerCapture?.(event.pointerId);
        roundFromPointer(event);
      });
      roundInput.addEventListener("pointermove", event => {
        if (draggingRound) roundFromPointer(event);
      });
      const stopRoundDrag = event => {
        draggingRound = false;
        if (roundInput.hasPointerCapture?.(event.pointerId)) {
          roundInput.releasePointerCapture?.(event.pointerId);
        }
      };
      roundInput.addEventListener("pointerup", stopRoundDrag);
      roundInput.addEventListener("pointercancel", stopRoundDrag);
    }

    const roundPrevious = $("[data-tour-round-prev]");
    const roundNext = $("[data-tour-round-next]");
    if (roundPrevious) {
      roundPrevious.addEventListener("click", () => setRound(state.round - 1, true));
    }
    if (roundNext) {
      roundNext.addEventListener("click", () => setRound(state.round + 1, true));
    }

    $("[data-tour-zoom-in]")?.addEventListener("click", () => changeZoom(1.25));
    $("[data-tour-zoom-out]")?.addEventListener("click", () => changeZoom(0.8));
    $("[data-tour-camera-reset]")?.addEventListener("click", () => {
      SceneExplorer.resetView(source().scene);
      state.hover = null;
      renderScene();
    });

    let pendingPointer = null;
    let pointerFrame = null;
    let drag = null;
    let suppressClick = false;
    const flushPointer = () => {
      pointerFrame = null;
      if (!pendingPointer || drag) return;
      const nextHover = pointItem(pendingPointer);
      pendingPointer = null;
      if (nextHover === state.hover) return;
      state.hover = nextHover;
      renderScene();
    };
    canvas.addEventListener("pointerdown", event => {
      if (event.button !== undefined && event.button !== 0) return;
      const point = SceneExplorer.eventPoint(canvas, event);
      if (point === null) return;
      canvas.focus?.();
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
      if (drag && (
        drag.pointerId === undefined
        || event.pointerId === undefined
        || drag.pointerId === event.pointerId
      )) {
        const point = SceneExplorer.eventPoint(canvas, event);
        if (point === null) return;
        const distance = Math.hypot(
          event.clientX - drag.startX,
          event.clientY - drag.startY
        );
        if (distance >= 4) drag.moved = true;
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
      pendingPointer = event;
      if (pointerFrame !== null) return;
      if (typeof requestAnimationFrame === "function") {
        pointerFrame = requestAnimationFrame(flushPointer);
      } else {
        flushPointer();
      }
    });
    const finishPointer = event => {
      if (!drag) return;
      if (!drag.moved) {
        const item = pointItem(event);
        state.selected = state.selected === item ? null : item;
        state.hover = null;
        renderScene();
      }
      suppressClick = true;
      if (canvas.hasPointerCapture?.(event.pointerId)) {
        canvas.releasePointerCapture?.(event.pointerId);
      }
      drag = null;
    };
    canvas.addEventListener("pointerup", finishPointer);
    canvas.addEventListener("pointercancel", event => {
      if (canvas.hasPointerCapture?.(event.pointerId)) {
        canvas.releasePointerCapture?.(event.pointerId);
      }
      drag = null;
    });
    canvas.addEventListener("pointerleave", () => {
      pendingPointer = null;
      if (drag || state.hover === null) return;
      state.hover = null;
      renderScene();
    });
    canvas.addEventListener("click", event => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      const item = pointItem(event);
      state.selected = state.selected === item ? null : item;
      state.hover = null;
      renderScene();
    });
    canvas.addEventListener("wheel", event => {
      const point = SceneExplorer.eventPoint(canvas, event);
      if (point === null) return;
      event.preventDefault();
      changeZoom(Math.exp(-event.deltaY * 0.0015), point);
    }, {passive: false});
    canvas.addEventListener("dblclick", event => {
      event.preventDefault();
      SceneExplorer.resetView(source().scene);
      state.hover = null;
      renderScene();
    });
    canvas.addEventListener("keydown", event => {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        changeZoom(1.25);
      } else if (event.key === "-") {
        event.preventDefault();
        changeZoom(0.8);
      } else if (event.key === "0") {
        event.preventDefault();
        SceneExplorer.resetView(source().scene);
        renderScene();
      }
    });

    SceneExplorer.observeResize(canvas, () => {
      state.hover = null;
      renderScene();
    });
    document.addEventListener("keydown", event => {
      const target = event.target;
      const tag = String(target?.tagName || "").toUpperCase();
      if (
        event.defaultPrevented
        || target?.isContentEditable
        || ["INPUT", "BUTTON", "SELECT", "TEXTAREA", "A", "CANVAS"].includes(tag)
      ) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        applyStep(state.step - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        applyStep(state.step + 1);
      }
    });

    applyStep(0);
  }

  document.addEventListener("DOMContentLoaded", init);
  return {init};
})();
