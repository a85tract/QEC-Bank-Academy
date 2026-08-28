# Syndrome circuits and decoding

For a BB memory, “the decoder” is not a function of \(H_X,H_Z\) alone. The
static matrices, extraction circuit, detector graph, noise model, and
inference algorithm form one experiment. This page keeps their interfaces
separate.

## 1. Static syndrome

With a perfect measurement, an X-type data error \(e_X\) produces the Z-check
syndrome \(H_Ze_X\); a Z-type error \(e_Z\) produces \(H_Xe_Z\). A correction
needs the same syndrome and may differ from the actual error by a stabilizer.
Because BB Tanner graphs have many short cycles and the code is degenerate,
the most likely physical error and the most likely logical coset need not be
the same object.

This code-capacity problem is the clean input for the BP-OSD baseline of
`roffe2020decoding` and its generalized-bicycle precursor
`panteleev2021degenerate`.

## 2. A weight-six measurement is a circuit

Measuring one stabilizer with an ancilla requires preparation, a sequence of
entangling gates, measurement, and reset. The order of those entangling gates
matters. An ancilla Pauli introduced early can propagate through later gates
to several data qubits. Such a correlated “hook” may align with a logical
operator more efficiently than independent faults.

`bravyi2024bicycle` gives a seven-CNOT-layer extraction for its two-layer
connectivity. The number seven is a property of that schedule and layout, not
of every weight-six matrix. `shaw2025morphing` instead changes the code during
the cycle, reducing the connectivity degree from six to five and using six
CNOT rounds for a related family. The comparison changes both the hardware
graph and the detector model.

The Atlas constructor exports only static check incidence. It intentionally
does not manufacture a schedule from row support: support does not determine
CNOT order, ancilla assignment, reset placement, or detector definitions.

## 3. From measurement bits to detectors

With noisy repeated extraction, one does not decode raw syndrome bits in
isolation. Detector events compare measurements across time so that a
measurement fault produces a recognizable spacetime pattern. The boundary
rounds, initialization, final data measurement, and which products of
measurement results are deterministic all enter the detector definition.

This leads to three distances that must not be conflated:

| object | minimal event |
|---|---|
| static code distance | nontrivial logical Pauli on data |
| circuit distance | undetected fault set causing a logical failure |
| decoder-found failure weight | smallest failure found under a specific search or decoder |

A static distance of 12 is compatible with a smaller circuit distance under a
bad schedule. Conversely, observing no low-weight decoder failures does not
prove circuit distance.

## 4. What BP-OSD does

Belief propagation passes soft likelihood messages between error variables
and parity constraints. On a tree, those local messages are exact. BB Tanner
graphs are not trees: short cycles feed correlated information back into
itself, and quantum degeneracy means many errors represent the same logical
coset. BP may oscillate, converge to an inconsistent hard decision, or settle
on the wrong coset.

Ordered-statistics decoding uses the BP reliabilities to choose an information
set, then solves the syndrome constraints while testing a controlled set of
reliability-ordered deviations. Its contribution is not another syndrome
formula; it is a global repair stage when local messages fail.

The operational contract must specify at least:

- data, measurement, reset, idle, and two-qubit fault probabilities;
- whether X/Z correlations and leakage are present;
- the exact extraction schedule and detector construction;
- BP update rule, iteration limit, damping, and stopping condition;
- OSD order and candidate-selection rule;
- latency and throughput constraints.

Without these, “decoded with BP-OSD” is incomplete.

## 5. The 0.8% protocol threshold

The card records the literature statement from `bravyi2024bicycle`: finite-size
scaling across the paper's BB memory family gives an estimated circuit-level
threshold of 0.8% under its standard circuit-noise model, depth-seven syndrome
extraction, detector construction, and BP-OSD decoder.

This is not:

- a code-capacity threshold;
- an asymptotic threshold proved for all BB choices;
- a property of BP-OSD independent of schedule;
- a hardware logical error rate;
- evidence that circuit distance equals static distance.

It is also not a one-block pseudo-threshold against a physical baseline.
Changing the scaling family, circuit, noise normalization, or decoder defines
a different threshold experiment and can move or remove the crossing. The
qualification is part of the number's meaning.

## 6. Symmetry-aware alternatives

The literature sweep exposes several ways to use more BB structure:

- `koutsioumpas2025autdec` runs an ensemble over code automorphisms and
  combines candidates. The gain comes from moving a hard syndrome into
  different symmetry frames.
- `sahay2026matching` reduces selected BB problems to toric-like cylinders,
  applies matching, and combines it with BP and over-matching. The reduction's
  symmetry assumptions are part of the decoder.
- `blue2026machine` trains a transformer on circuit-level histories. Its
  training distribution, calibration, and inference latency are part of the
  claim.
- `pakhunov2026convergence` predicts when BP is likely to converge, acting as a
  triage layer rather than a complete correction rule.
- `pakhunov2026peeling` analyzes a greedy peeling/streaming route and reports
  large latency gains for its specified benchmarks. Those gains do not
  transfer without the same channel, implementation, and accuracy target.

The card includes only decoder identifiers already registered in the shared
vocabulary. The deeper page records newer compound pipelines without
pretending each is the same algorithm.

## 7. What remains unexported

The static entry is complete as a code description, but it does not yet ship
a BB `Schedule`:

- no ancilla coordinates;
- no seven-layer gate order;
- no reset or measurement operations;
- no detector definitions;
- no circuit-distance witness.

Adding those requires an engine-supported circuit/schedule representation and
a source-faithful transcription. Until then, the generic lattice explorer
shows exactly what it owns—data coordinates and stabilizer supports—and no
more.

## Provenance

Static syndrome algebra is recomputed from the constructor. BP-OSD behavior
and the seven-layer circuit/threshold estimate are literature claims from
`roffe2020decoding`, `panteleev2021degenerate`, and
`bravyi2024bicycle`. Morphing, automorphism ensembles, matching, learned
decoding, convergence prediction, and peeling are scoped to their respective
registered sources.
