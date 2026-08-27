/* scene-explorer: generic renderer for machine-validated QEC Atlas Scene v2.
   Geometry, frames, styles, and camera limits come from exported data only. */
const SceneExplorer = (() => {
  "use strict";

  const STYLES = {
    X: {stroke: "#c73737", fill: "rgba(199, 55, 55, 0.20)"},
    Y: {stroke: "#9a6700", fill: "rgba(154, 103, 0, 0.18)"},
    Z: {stroke: "#2563a8", fill: "rgba(37, 99, 168, 0.20)"},
    mixed: {stroke: "#6b7280", fill: "rgba(107, 114, 128, 0.16)"},
    neutral: {stroke: "#6b7280", fill: "rgba(107, 114, 128, 0.12)"},
  };
  const viewStates = new WeakMap();

  function viewState(scene) {
    if (!viewStates.has(scene)) {
      viewStates.set(scene, {zoom: 1, panX: 0, panY: 0});
    }
    return viewStates.get(scene);
  }

  function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    if (!canvas.style.aspectRatio) {
      canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
    }
    const ratio = typeof window === "undefined"
      ? 1
      : Math.max(window.devicePixelRatio || 1, 1);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width === width && canvas.height === height) return false;
    canvas.width = width;
    canvas.height = height;
    return true;
  }

  function observeResize(canvas, redraw) {
    const onResize = () => {
      if (resizeCanvas(canvas)) redraw();
    };
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(onResize);
      observer.observe(canvas);
      return () => observer.disconnect();
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    return () => {};
  }

  function eventPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return [
      (event.clientX - rect.left) * canvas.width / rect.width,
      (event.clientY - rect.top) * canvas.height / rect.height,
    ];
  }

  function frame(scene, state) {
    const requestedRound = state.mode === "schedule" ? state.round || 0 : null;
    return scene.frames.find(candidate =>
      candidate.mode === state.mode
      && (
        candidate.mode !== "schedule"
        || candidate.round === requestedRound
      )
    ) || null;
  }

  function periodicCorners(scene) {
    const system = scene.coordinateSystem;
    if (system.kind !== "periodic") return [];
    const origin = system.origin;
    const [first, second] = system.basis;
    return [
      origin,
      [origin[0] + first[0], origin[1] + first[1]],
      [
        origin[0] + first[0] + second[0],
        origin[1] + first[1] + second[1],
      ],
      [origin[0] + second[0], origin[1] + second[1]],
    ];
  }

  function worldBounds(scene) {
    const periodic = periodicCorners(scene);
    const points = periodic.length
      ? periodic
      : [
        ...scene.nodes.map(node => node.position),
        ...scene.frames.flatMap(itemFrame =>
          itemFrame.objects.flatMap(item => item.points)
        ),
      ];
    const xs = points.map(point => point[0]);
    const ys = points.map(point => point[1]);
    return {
      x0: Math.min(...xs),
      x1: Math.max(...xs),
      y0: Math.min(...ys),
      y1: Math.max(...ys),
    };
  }

  function baseTransform(scene, canvas) {
    const bounds = worldBounds(scene);
    const pad = Math.min(canvas.width, canvas.height) * scene.camera.padding;
    const dx = Math.max(bounds.x1 - bounds.x0, 1e-9);
    const dy = Math.max(bounds.y1 - bounds.y0, 1e-9);
    const scale = Math.min(
      Math.max(canvas.width - 2 * pad, 1) / dx,
      Math.max(canvas.height - 2 * pad, 1) / dy
    );
    const worldCenter = [
      (bounds.x0 + bounds.x1) / 2,
      (bounds.y0 + bounds.y1) / 2,
    ];
    return point => [
      canvas.width / 2 + (point[0] - worldCenter[0]) * scale,
      canvas.height / 2 - (point[1] - worldCenter[1]) * scale,
    ];
  }

  function transform(scene, canvas, point) {
    const basePoint = baseTransform(scene, canvas)(point);
    const view = viewState(scene);
    const center = [canvas.width / 2, canvas.height / 2];
    return [
      center[0] + (basePoint[0] - center[0]) * view.zoom + view.panX,
      center[1] + (basePoint[1] - center[1]) * view.zoom + view.panY,
    ];
  }

  function pixelRatio(canvas) {
    const rect = canvas.getBoundingClientRect();
    return rect.width ? canvas.width / rect.width : 1;
  }

  function visibleObjects(scene, state) {
    const selected = frame(scene, state);
    if (!selected) return [];
    return selected.objects.filter(item =>
      state.filter === "all" || item.style === state.filter
    );
  }

  function trace(context, points, close = false) {
    if (!points.length) return;
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(point => context.lineTo(point[0], point[1]));
    if (close) context.closePath();
  }

  function periodicOffsets(scene) {
    if (scene.coordinateSystem.kind !== "periodic") return [[0, 0]];
    const [first, second] = scene.coordinateSystem.basis;
    const offsets = [];
    for (let i = -1; i <= 1; i += 1) {
      for (let j = -1; j <= 1; j += 1) {
        offsets.push([
          i * first[0] + j * second[0],
          i * first[1] + j * second[1],
        ]);
      }
    }
    return offsets;
  }

  function pointInConvexPolygon(point, polygon) {
    let orientation = 0;
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const cross = (
        (end[0] - start[0]) * (point[1] - start[1])
        - (end[1] - start[1]) * (point[0] - start[0])
      );
      if (Math.abs(cross) <= 1e-9) continue;
      const current = Math.sign(cross);
      if (orientation !== 0 && current !== orientation) return false;
      orientation = current;
    }
    return true;
  }

  function pointInPeriodicDomain(scene, canvas, point) {
    const corners = periodicCorners(scene);
    if (!corners.length) return true;
    return pointInConvexPolygon(
      point,
      corners.map(corner => transform(scene, canvas, corner))
    );
  }

  function shifted(point, offset) {
    return [point[0] + offset[0], point[1] + offset[1]];
  }

  function clipPeriodicDomain(context, scene, canvas) {
    const corners = periodicCorners(scene);
    if (!corners.length) return;
    trace(
      context,
      corners.map(point => transform(scene, canvas, point)),
      true
    );
    context.clip();
  }

  function drawArrowMarker(context, start, end, ratio) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy);
    if (!length) return;
    const ux = dx / length;
    const uy = dy / length;
    const nx = -uy;
    const ny = ux;
    const midpoint = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
    ];
    const tip = [
      midpoint[0] + ux * 7 * ratio,
      midpoint[1] + uy * 7 * ratio,
    ];
    const left = [
      midpoint[0] - ux * 4 * ratio + nx * 4 * ratio,
      midpoint[1] - uy * 4 * ratio + ny * 4 * ratio,
    ];
    const right = [
      midpoint[0] - ux * 4 * ratio - nx * 4 * ratio,
      midpoint[1] - uy * 4 * ratio - ny * 4 * ratio,
    ];
    trace(context, [left, tip, right]);
    context.stroke();
  }

  function drawIdentifiedEdge(context, start, end, color, ratio) {
    context.strokeStyle = color;
    context.lineWidth = 2 * ratio;
    context.setLineDash([8 * ratio, 6 * ratio]);
    trace(context, [start, end]);
    context.stroke();
    context.setLineDash([]);
    drawArrowMarker(context, start, end, ratio);
  }

  function drawPeriodicBoundary(context, scene, canvas, ratio) {
    const corners = periodicCorners(scene);
    if (!corners.length) return;
    const points = corners.map(point => transform(scene, canvas, point));
    context.save();
    context.globalAlpha = 0.9;
    drawIdentifiedEdge(context, points[0], points[1], "#0f8b8d", ratio);
    drawIdentifiedEdge(context, points[3], points[2], "#0f8b8d", ratio);
    drawIdentifiedEdge(context, points[0], points[3], "#7c3aed", ratio);
    drawIdentifiedEdge(context, points[1], points[2], "#7c3aed", ratio);
    context.restore();
  }

  function drawObject(
    context,
    scene,
    canvas,
    item,
    state,
    ratio,
    offset = [0, 0]
  ) {
    const style = STYLES[item.style] || STYLES.neutral;
    const points = item.points.map(point =>
      transform(scene, canvas, shifted(point, offset))
    );
    const highlighted = state.highlight === item.item;
    const hasHighlight = state.highlight !== null && state.highlight !== undefined;
    context.save();
    context.globalAlpha = hasHighlight && !highlighted ? 0.12 : 1;
    context.strokeStyle = style.stroke;
    context.fillStyle = style.fill;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = (highlighted ? 4.5 : 2.25) * ratio;
    if (item.kind === "spokes") {
      const center = points[0];
      points.slice(1).forEach(endpoint => {
        trace(context, [center, endpoint]);
        context.stroke();
      });
    } else {
      trace(context, points, item.kind === "face");
      if (item.kind === "face") context.fill();
      context.stroke();
    }
    if (highlighted) {
      const hit = transform(scene, canvas, shifted(item.hitPoint, offset));
      context.beginPath();
      context.arc(hit[0], hit[1], 8 * ratio, 0, 2 * Math.PI);
      context.strokeStyle = "#111827";
      context.lineWidth = 1.5 * ratio;
      context.globalAlpha = 0.8;
      context.stroke();
    }
    context.restore();
  }

  function drawNodes(context, scene, canvas, ratio, offsets = [[0, 0]]) {
    const showLabels = scene.nodes.length <= 40 || viewState(scene).zoom >= 2.5;
    scene.nodes.forEach(node => {
      offsets.forEach(offset => {
        const point = transform(
          scene,
          canvas,
          shifted(node.position, offset)
        );
        context.beginPath();
        context.arc(point[0], point[1], 4.25 * ratio, 0, 2 * Math.PI);
        context.fillStyle = "#17202a";
        context.fill();
        context.strokeStyle = "#fff";
        context.lineWidth = ratio;
        context.stroke();
        if (showLabels && typeof context.fillText === "function") {
          context.fillStyle = "#374151";
          context.font = `${11 * ratio}px ui-monospace, monospace`;
          context.fillText(
            node.label,
            point[0] + 6 * ratio,
            point[1] - 6 * ratio
          );
        }
      });
    });
  }

  function render(canvas, scene, state) {
    resizeCanvas(canvas);
    const context = canvas.getContext("2d");
    const ratio = pixelRatio(canvas);
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fbfcff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const offsets = periodicOffsets(scene);
    if (scene.coordinateSystem.kind === "periodic") {
      context.save();
      clipPeriodicDomain(context, scene, canvas);
      visibleObjects(scene, state).forEach(item => {
        offsets.forEach(offset =>
          drawObject(context, scene, canvas, item, state, ratio, offset)
        );
      });
      drawNodes(context, scene, canvas, ratio, offsets);
      context.restore();
      drawPeriodicBoundary(context, scene, canvas, ratio);
    } else {
      visibleObjects(scene, state).forEach(item =>
        drawObject(context, scene, canvas, item, state, ratio)
      );
      drawNodes(context, scene, canvas, ratio);
    }
    context.restore();
  }

  function nearestItem(canvas, scene, state, mouseX, mouseY) {
    if (!pointInPeriodicDomain(scene, canvas, [mouseX, mouseY])) return null;
    const ratio = pixelRatio(canvas);
    let best = null;
    let bestDistance = (34 * ratio) ** 2;
    visibleObjects(scene, state).forEach(item => {
      periodicOffsets(scene).forEach(offset => {
        const hit = transform(
          scene,
          canvas,
          shifted(item.hitPoint, offset)
        );
        const distance = (hit[0] - mouseX) ** 2 + (hit[1] - mouseY) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = item.item;
        }
      });
    });
    return best;
  }

  function panBy(scene, deltaX, deltaY) {
    const view = viewState(scene);
    view.panX += deltaX;
    view.panY += deltaY;
  }

  function zoomAt(scene, canvas, point, factor) {
    const view = viewState(scene);
    const previous = view.zoom;
    const next = Math.max(
      scene.camera.minZoom,
      Math.min(scene.camera.maxZoom, previous * factor)
    );
    if (next === previous) return;
    const center = [canvas.width / 2, canvas.height / 2];
    view.panX = (
      point[0] - center[0]
      - (point[0] - center[0] - view.panX) * next / previous
    );
    view.panY = (
      point[1] - center[1]
      - (point[1] - center[1] - view.panY) * next / previous
    );
    view.zoom = next;
  }

  function resetView(scene) {
    const view = viewState(scene);
    view.zoom = 1;
    view.panX = 0;
    view.panY = 0;
  }

  function cameraStatus(scene) {
    const view = viewState(scene);
    return {
      zoom: view.zoom,
      label: `${Math.round(view.zoom * 100)}%`,
      panX: view.panX,
      panY: view.panY,
    };
  }

  function initEntry() {
    const canvas = document.querySelector("[data-scene-canvas]");
    if (
      !canvas
      || typeof ENTRY_DATA === "undefined"
      || !ENTRY_DATA.scene
      || ENTRY_DATA.scene.dimension !== 2
    ) return;
    const scene = ENTRY_DATA.scene;
    const lattice = ENTRY_DATA.lattice || {};
    const schedule = ENTRY_DATA.schedule || {};
    const modes = scene.frames.map(itemFrame => itemFrame.mode);
    const initialMode = ["lattice", "construction", "incidence", "schedule", "data"]
      .find(mode => modes.includes(mode)) || modes[0];
    const state = {
      mode: initialMode,
      round: 0,
      filter: "all",
      hover: null,
      selected: null,
    };
    const $ = selector => document.querySelector(selector);
    const activeHighlight = () => state.selected ?? state.hover;

    function latticeDetail(itemIndex) {
      if (itemIndex === null || itemIndex === undefined) {
        return (
          "Point, tap, or focus the scene and use arrow keys to inspect "
          + "a stabilizer."
        );
      }
      const check = lattice.checks?.[itemIndex];
      if (!check) return "The selected scene object has no stabilizer payload.";
      const declaredStyle = lattice.layout?.checkStyles?.[check.type];
      const semantic = declaredStyle === "spokes"
        ? "vertex/star"
        : declaredStyle === "face"
          ? "plaquette/face"
          : "stabilizer";
      return (
        `${check.type}-check ${itemIndex} (${semantic}); `
        + `support {${check.support.join(", ")}}.`
      );
    }

    function logicalDetail(itemIndex) {
      if (itemIndex === null || itemIndex === undefined) {
        return (
          "Each colored path is a noncontractible logical operator; "
          + "select one to inspect its exact qubit support."
        );
      }
      const logical = lattice.logicalOperators?.[itemIndex];
      if (!logical) return "The selected scene object has no logical payload.";
      return (
        `${logical.label}; ${logical.type}-type logical; `
        + `weight ${logical.support.length}; `
        + `support {${logical.support.join(", ")}}.`
      );
    }

    function sceneObjectDetail(itemIndex, emptyMessage) {
      if (itemIndex === null || itemIndex === undefined) return emptyMessage;
      const selectedFrame = frame(scene, state);
      const item = selectedFrame?.objects.find(candidate => candidate.item === itemIndex);
      return item?.label || "The selected scene object has no detail payload.";
    }

    function selectedRound() {
      const rounds = schedule.rounds || [];
      return rounds.find(round => round.index === state.round) || rounds[0] || null;
    }

    function roundLabel() {
      const frames = scene.frames.filter(candidate => candidate.mode === "schedule");
      const position = Math.max(0, frames.findIndex(candidate => candidate.round === state.round));
      return `Round ${position + 1} of ${frames.length} · t mod ${frames.length} = ${state.round}`;
    }

    function scheduleDetail(itemIndex) {
      if (itemIndex === null || itemIndex === undefined) {
        return "Point, tap, or use arrow keys to inspect a measured operator.";
      }
      const measurement = selectedRound()?.measurements?.[itemIndex];
      if (!measurement) {
        return sceneObjectDetail(itemIndex, "Select a measurement to inspect it.");
      }
      return (
        `${measurement.type} measurement ${measurement.index}; `
        + `qubits {${measurement.support.join(", ")}}; `
        + `operator ${measurement.pauli}.`
      );
    }

    function itemDetail(itemIndex) {
      if (state.mode === "data") {
        return (
          "Numbered black points are constructor-derived data qubits."
        );
      }
      if (state.mode === "logical") return logicalDetail(itemIndex);
      if (state.mode === "schedule") return scheduleDetail(itemIndex);
      if (state.mode === "incidence" || state.mode === "construction") {
        return sceneObjectDetail(
          itemIndex,
          "Point, tap, or use arrow keys to inspect a formal relation."
        );
      }
      return latticeDetail(itemIndex);
    }

    function updateControls() {
      document.querySelectorAll("[data-scene-mode]").forEach(button => {
        button.setAttribute(
          "aria-pressed",
          button.dataset.sceneMode === state.mode
        );
      });
      document.querySelectorAll("[data-scene-filter]").forEach(button => {
        button.setAttribute(
          "aria-pressed",
          button.dataset.sceneFilter === state.filter
        );
        button.disabled = state.mode === "data";
      });
      const filterControl = $("[data-scene-filter-control]");
      if (filterControl) filterControl.hidden = state.mode === "data";
      const roundControl = $("[data-scene-round-control]");
      const roundInput = $("[data-scene-round]");
      const roundOutput = $("[data-scene-round-label]");
      const roundPrevious = $("[data-scene-round-prev]");
      const roundNext = $("[data-scene-round-next]");
      const scheduleMode = state.mode === "schedule";
      if (roundControl) roundControl.hidden = !scheduleMode;
      if (roundInput) roundInput.disabled = !scheduleMode;
      if (!scheduleMode || !roundInput) return;
      const rounds = scene.frames
        .filter(candidate => candidate.mode === "schedule")
        .map(candidate => candidate.round);
      roundInput.min = String(Math.min(...rounds));
      roundInput.max = String(Math.max(...rounds));
      roundInput.step = "1";
      roundInput.value = String(state.round);
      const label = roundLabel();
      roundInput.setAttribute("aria-valuetext", label);
      if (roundOutput) roundOutput.textContent = label;
      if (roundPrevious) roundPrevious.disabled = rounds.length < 2;
      if (roundNext) roundNext.disabled = rounds.length < 2;
    }

    function updateCameraStatus() {
      const output = $("[data-scene-camera-status]");
      if (!output) return;
      const status = cameraStatus(scene);
      output.textContent = status.label;
      output.setAttribute("aria-label", `Scene zoom ${status.label}`);
    }

    function renderEntry() {
      render(canvas, scene, {
        mode: state.mode,
        round: state.round,
        filter: state.filter,
        highlight: activeHighlight(),
      });
      const detail = $("[data-scene-detail]");
      if (detail) detail.textContent = itemDetail(activeHighlight());
      updateControls();
      updateCameraStatus();
    }

    function pointItem(event) {
      const point = eventPoint(canvas, event);
      if (point === null || state.mode === "data") return null;
      return nearestItem(
        canvas,
        scene,
        {
          mode: state.mode,
          round: state.round,
          filter: state.filter,
        },
        point[0],
        point[1]
      );
    }

    function visibleIndices() {
      return visibleObjects(scene, {
        mode: state.mode,
        round: state.round,
        filter: state.filter,
      }).map(item => item.item);
    }

    function selectRelative(delta) {
      const indices = visibleIndices();
      if (!indices.length) return;
      const current = state.selected ?? state.hover;
      const position = indices.indexOf(current);
      const next = position < 0
        ? (delta < 0 ? indices.length - 1 : 0)
        : (position + delta + indices.length) % indices.length;
      state.selected = indices[next];
      state.hover = null;
      renderEntry();
    }

    function changeZoom(factor, point = null) {
      zoomAt(
        scene,
        canvas,
        point || [canvas.width / 2, canvas.height / 2],
        factor
      );
      state.hover = null;
      renderEntry();
    }

    document.querySelectorAll("[data-scene-mode]").forEach(button => {
      button.addEventListener("click", () => {
        const mode = button.dataset.sceneMode;
        if (!modes.includes(mode)) return;
        state.mode = mode;
        state.round = 0;
        state.filter = "all";
        state.hover = null;
        state.selected = null;
        renderEntry();
      });
    });
    document.querySelectorAll("[data-scene-filter]").forEach(button => {
      button.addEventListener("click", () => {
        if (state.mode === "data") return;
        state.filter = button.dataset.sceneFilter;
        state.hover = null;
        state.selected = null;
        renderEntry();
      });
    });
    $("[data-scene-zoom-in]")?.addEventListener(
      "click",
      () => changeZoom(1.25)
    );
    $("[data-scene-zoom-out]")?.addEventListener(
      "click",
      () => changeZoom(0.8)
    );
    $("[data-scene-camera-reset]")?.addEventListener("click", () => {
      resetView(scene);
      state.hover = null;
      renderEntry();
    });

    function setRound(index, wrap = false) {
      if (state.mode !== "schedule") return;
      const rounds = scene.frames
        .filter(candidate => candidate.mode === "schedule")
        .map(candidate => candidate.round)
        .sort((first, second) => first - second);
      if (!rounds.length) return;
      const currentPosition = Math.max(0, rounds.indexOf(state.round));
      const requestedPosition = wrap
        ? ((index % rounds.length) + rounds.length) % rounds.length
        : Math.max(0, Math.min(rounds.length - 1, index));
      state.round = rounds[requestedPosition];
      state.hover = null;
      state.selected = null;
      renderEntry();
    }

    const roundInput = $("[data-scene-round]");
    if (roundInput) {
      roundInput.addEventListener("input", () => {
        const rounds = scene.frames
          .filter(candidate => candidate.mode === "schedule")
          .map(candidate => candidate.round)
          .sort((first, second) => first - second);
        const requested = Number.parseInt(roundInput.value, 10) || 0;
        const position = Math.max(0, rounds.indexOf(requested));
        setRound(position);
      });
      roundInput.addEventListener("keydown", event => {
        const delta = {
          ArrowLeft: -1,
          ArrowDown: -1,
          ArrowRight: 1,
          ArrowUp: 1,
        }[event.key];
        const rounds = scene.frames
          .filter(candidate => candidate.mode === "schedule")
          .map(candidate => candidate.round)
          .sort((first, second) => first - second);
        const position = Math.max(0, rounds.indexOf(state.round));
        if (event.key === "Home") {
          event.preventDefault();
          setRound(0);
        } else if (event.key === "End") {
          event.preventDefault();
          setRound(rounds.length - 1);
        } else if (delta !== undefined) {
          event.preventDefault();
          setRound(position + delta);
        }
      });
      let draggingRound = false;
      const roundFromPointer = event => {
        const rect = roundInput.getBoundingClientRect();
        if (!rect.width) return;
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const count = scene.frames.filter(candidate => candidate.mode === "schedule").length;
        setRound(Math.round(ratio * (count - 1)));
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

    const roundPrevious = $("[data-scene-round-prev]");
    const roundNext = $("[data-scene-round-next]");
    if (roundPrevious) {
      roundPrevious.addEventListener("click", () => {
        const rounds = scene.frames.filter(candidate => candidate.mode === "schedule");
        const position = Math.max(0, rounds.findIndex(candidate => candidate.round === state.round));
        setRound(position - 1, true);
      });
    }
    if (roundNext) {
      roundNext.addEventListener("click", () => {
        const rounds = scene.frames.filter(candidate => candidate.mode === "schedule");
        const position = Math.max(0, rounds.findIndex(candidate => candidate.round === state.round));
        setRound(position + 1, true);
      });
    }

    let pendingPointer = null;
    let pointerFrame = null;
    let drag = null;
    const flushPointer = () => {
      pointerFrame = null;
      if (!pendingPointer || drag) return;
      const nextHover = pointItem(pendingPointer);
      pendingPointer = null;
      if (nextHover === state.hover) return;
      state.hover = nextHover;
      renderEntry();
    };
    canvas.addEventListener("pointerdown", event => {
      if (event.button !== undefined && event.button !== 0) return;
      const point = eventPoint(canvas, event);
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
        const point = eventPoint(canvas, event);
        if (point === null) return;
        const distance = Math.hypot(
          event.clientX - drag.startX,
          event.clientY - drag.startY
        );
        if (distance >= 4) drag.moved = true;
        if (drag.moved) {
          panBy(
            scene,
            point[0] - drag.lastPoint[0],
            point[1] - drag.lastPoint[1]
          );
          drag.lastPoint = point;
          state.hover = null;
          renderEntry();
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
        renderEntry();
      }
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
      renderEntry();
    });
    canvas.addEventListener("wheel", event => {
      const point = eventPoint(canvas, event);
      if (point === null) return;
      event.preventDefault();
      changeZoom(Math.exp(-event.deltaY * 0.0015), point);
    }, {passive: false});
    canvas.addEventListener("keydown", event => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        selectRelative(1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        selectRelative(-1);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        changeZoom(1.25);
      } else if (event.key === "-") {
        event.preventDefault();
        changeZoom(0.8);
      } else if (event.key === "0") {
        event.preventDefault();
        resetView(scene);
        renderEntry();
      } else if (event.key === "Escape") {
        state.hover = null;
        state.selected = null;
        renderEntry();
      }
    });

    observeResize(canvas, () => {
      state.hover = null;
      renderEntry();
    });
    renderEntry();
  }

  document.addEventListener("DOMContentLoaded", initEntry);
  return {
    cameraStatus,
    eventPoint,
    frame,
    initEntry,
    nearestItem,
    observeResize,
    panBy,
    render,
    resetView,
    resizeCanvas,
    visibleObjects,
    zoomAt,
  };
})();
