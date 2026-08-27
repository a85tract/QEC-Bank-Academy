# Surface Learn refactor — approved Lesson Brief

Status: approved for the owner-authorized local prototype on 2026-08-27.

## Learner and graduation contract

**Design decision.** Assume an early undergraduate who can manipulate binary vectors and matrices, understands parity, qubits, Pauli X/Z, and measurement, but has not yet learned stabilizer equivalence, syndromes, homology, fault-tolerant extraction, or lattice surgery.

The learner graduates when they can, on an unfamiliar small planar Surface-code instance:

1. predict which opposite-Pauli checks change after a chosen error string and explain why only its endpoints remain visible;
2. propose a recovery from syndrome alone and classify the residual as detectable, stabilizer-equivalent, or logical rather than demanding recovery equal the hidden error;
3. construct crossing logical X/Z representatives, use stabilizer equivalence to move them, and explain why the shortest boundary-to-boundary representative gives code distance;
4. connect the visible patch to its CSS check matrices and the hypergraph product of two open repetition chains without treating drawing coordinates as hardware geometry;
5. inspect one named L3 syndrome-extraction schedule and its two governed hook-error fixtures while keeping static code distance distinct from circuit or spacetime fault distance; and
6. audit decoder thresholds, logical-operation claims, realizations, representations, and evidence status in Reference without importing one regime's number or claim into another.

## Teaching thesis and causal verbs

**Design decision.** A Surface code becomes intelligible when the learner follows one error string from hidden local actions to visible endpoints, then closes the loop from recovery equivalence to logical failure, distance, construction, measurement, and operations.

The recurring causal verbs are **toggle → anticommute → expose endpoints → pair → cancel → deform → cross → classify → measure → qualify**. Standard terms—stabilizer, syndrome, logical representative, normalizer, CSS checks, hypergraph product, hook error, lattice surgery—arrive only after their visible referents exist.

## Dependency chain

**Design decision.** The route follows these conceptual transitions:

1. A single hidden X error changes exactly the Z checks whose supports overlap it oddly.
2. Adjacent X errors cancel the intermediate syndrome, so a string is observed through its endpoints rather than its microscopic path.
3. A recovery is successful when error plus recovery is a stabilizer, not only when both paths are identical; a zero-syndrome residual can still be logical.
4. Equivalent strings may deform, while boundary-to-boundary strings cannot be shrunk away; a crossing X/Z pair exposes the encoded qubit and the minimum representative exposes distance.
5. The same incidence becomes the CSS matrices of `HGP(rep_L, rep_L)`: open-chain endpoints become boundaries, and periodic factors yield the toric sibling.
6. Stabilizers are not abstract oracle results: ancillas and ordered CNOT layers extract them, and ordering can propagate one ancilla fault into correlated data errors.
7. Surgery and other operations consume repeated logical measurements and Pauli-frame updates; their costs and fault-tolerance claims are model-scoped.
8. The learner uses the complete Reference dossier to compare decoder regimes, realizations, representations, claims, and honest gaps.

## Chosen spine and alternatives

**Evidence.** The governed L3 constructor supplies the smallest complete patch with one encoded qubit and distance three. Its qubit 4 lies in two Z-check supports; an X at q4 therefore gives a compact two-defect first puzzle. Extending along a row creates a zero-syndrome boundary-to-boundary logical representative. L4 supplies a changed case. The frozen `circuit_memory_l3.yaml` supplies exact supports, four CNOT layers, and two validated hook fixtures. The existing HGP tour supplies valuable open/periodic and factor-index exploration.

**Design decision.** Use the L3 “error-string detective” as the spine. It begins with a prediction and retains the same governed patch through syndrome, recovery, equivalence, logical class, and distance before changing representation.

**Rejected alternatives.** Beginning with HGP matrices is exact but makes the motivating phenomenon depend on unfamiliar machinery. Beginning with thresholds is concrete but encourages bare-number comparison before the learner can state the error model. Beginning with hardware layout risks conflating illustrative incidence with a device coupling graph. All three remain later destinations.

## Bottlenecks to overturn

**Design decision.** The route must explicitly overturn:

- “the syndrome reveals the entire error”; it reveals parity constraints and often only string endpoints;
- “a decoder must guess the actual error”; only the residual logical class matters;
- “zero syndrome means no error”; stabilizers and logicals both have zero syndrome;
- “distance is the number of qubits in the picture” or a Euclidean length; it is minimum Pauli weight in a nontrivial logical class; and
- “a threshold is a property of the code alone”; every threshold belongs to a noise, measurement, circuit, decoder, and normalization regime.

## Indispensable learner-controlled evidence

**Design decision.** One shared generic lab must let the learner toggle X or Z support, commit a syndrome prediction, and receive syndrome computed from constructor checks. It must let the learner choose recovery support and classify the residual with GF(2) row-space tests. A distance task must compare declared, build-validated logical families on L3 and transfer to L4. The existing HGP tour's check inspection and open/periodic switch must remain reachable and be reused inside Learn. The circuit task must step the exact frozen CNOT layers and activate only the named, loader-validated fault fixtures. A surgery task may use a clearly labeled symbolic seam only if its symmetric-difference result and product-code parameters are computed and its missing full detector model is stated. Checkpoints and a capstone must require regime/provenance audit rather than passive reading.

## Reference coverage, preservation, and gaps

**Evidence.** The mastery map and exact anchors are recorded in `lesson-evidence-notes.md`.

**Design decision.** Learn bridges to identity/parameters, decoders, operations, realizations, relations, representations R1–R5, citations, intuition, and all Level-2 derivations. Reference stays complete and expert-facing. The existing landing Scene, HGP guided tour, factor check notes, open/periodic comparison, and Level-2 documents remain reachable.

**Honest gaps.** The entry has no governed R3 dynamic code representation or R4 detector model; the L3 circuit is a named memory schedule, not a circuit-distance proof. R5 sources are curated cross-model evidence, not exact synchronized object mappings. The symbolic surgery seam is not a full fault-tolerant spacetime implementation. L5 distance remains bounded in the entry. Operation costs, thresholds, and realization claims remain claimed or curated in their recorded regimes.

## Risks requiring review

1. The dense expert Reference must not leak onto the sparse landing.
2. Persisted hidden challenge answers must never appear in the URL.
3. Coordinate drawings must always be labeled combinatorial/illustrative, not physical hardware placement.
4. Narrow-screen and keyboard alternatives must preserve every central action.
5. Independent student and expert review must verify that the route teaches rather than merely exposes controls.
