# Bivariate bicycle Learn refactor — Lesson Brief

Status: **approved for the experimental local prototype on 2026-08-28**

## Learner and graduation contract

**Evidence.** The entry already contains a complete expert dossier, but its Learn surface is an eight-step narrated lattice tour. It exposes exact constructor-derived supports and a gross/toric instance switch, yet it does not ask the learner to predict, compute a syndrome, compare error cosets, derive a parameter, or audit unfamiliar Reference evidence. The target learner knows vectors, small binary matrices, parity, probability, qubits, Pauli X/Z, and measurement, but not polynomial QEC, chain complexes, qLDPC decoding, or BB hardware claims.

**Design decision.** Graduation means the learner can, on an unfamiliar governed case:

1. turn finite-torus monomials into wrapped translations, reconstruct an X or Z check, and explain exactly why the swapped-transpose CSS pair commutes;
2. predict and compute static syndromes, compare equal-syndrome errors modulo stabilizers, and distinguish a detectable error, a stabilizer-trivial class, and a logical class on the small exact anchor, using cycle/boundary language for Z errors and dual cocycle/coboundary language for X errors;
3. derive `n`, check weight/degree, rank-based `k`, and the applicable distance statement while distinguishing verified, bounded, and literature-supplied obligations;
4. translate a selected formal object among polynomial, matrix, Tanner-incidence, chain-complex, and quotient language, while rejecting false equivalences to hardware geometry or independent toric copies; and
5. use the complete Reference layer critically: qualify decoder/threshold, logical-operation, realization, variant, relation, and Formal IR claims by instance, model, certificate, and honest gap.

## Teaching thesis and causal spine

**Design decision.** Teaching thesis: *BB codes pack logical information by repeating sparse torus translations whose abelian algebra makes commutation automatic, then exploiting the global rank defect left by those local constraints; whether that static advantage becomes a useful memory depends on syndromes, logical cosets, circuits, decoding, connectivity, and evidence scope.* The causal verbs are **translate, assemble, detect, quotient, and qualify**.

The dependency chain is:

1. Begin with the motivating finite-block phenomenon: the gross block uses 144 data qubits for twelve logical qubits at static distance 12, while an equal-distance rotated surface patch uses 144 data qubits for one. State immediately that this is data-only and buys no free ancillas, routing, decoder, or logical operations.
2. On shipped `toric_L3`, use the constructor's `S[i,i+1]=1` convention to map one check-row anchor to the nonzero column contributed by a monomial, with wraparound. Explicitly distinguish this row-incidence move from the opposite-sign action on a column basis vector. Establish two algebraic column blocks without calling the illustrative offset a physical layout.
3. Assemble `A` and `B` into one check, reverse translations under transpose, and compare the swapped and unswapped Z candidates. The learner should discover that abelian commutation plus binary cancellation—not notation alone—makes the CSS pair commute.
4. Use those exact checks operationally: inject a Pauli error, predict the opposite-type syndrome, add a stabilizer, and decide whether the residual class is trivial or logical. Only then introduce primal cycle/boundary language for Z errors and dual cocycle/coboundary language for X errors.
5. Move from local sparsity to global rank. Use the inspectable toric dependency before transferring to gross: three-plus-three terms imply weight six, but ranks 66 and 66—not term count—leave `k=12`.
6. Separate distance certificates and protocol layers. Contrast the exact toric distance with gross's cited lower bound plus replayed weight-12 upper witness, then sort static code, extraction schedule, detectors, decoder, and the protocol-qualified 0.8% family threshold.
7. Finish by translating one selected object across exact and curated representations, then audit unfamiliar Reference records for operations, realizations, variants, relations, and Formal IR certificates without importing claims across regimes.

**Rationale.** This “one wrapped check to a qualified memory claim” spine uses the smallest exact instance for prediction and independent work, while preserving gross as the motivating and transfer case. It delays specialized vocabulary until visible objects exist, and it makes the code's distinctive algebra serve operational QEC rather than becoming an isolated proof.

**Rejected alternatives.** Opening with `AB+BA=0` gives a crisp commutation puzzle but makes the first encounter too symbolic and postpones why anyone wants the code. Opening with the twelve-logical rank deficit foregrounds the headline benefit, but quotient language arrives before the learner has a concrete cycle or boundary. Both remain useful moves inside the selected spine.

## Bottlenecks the route must overturn

**Evidence and design decision.** The route must explicitly overturn five misconceptions:

- `x` and `y` are scalar placeholders rather than permutation actions on a finite torus;
- the two column blocks or their `0.55` drawing offset are two literal planar hardware layers;
- transpose or sparsity alone guarantees commutation, rank, or distance;
- the toric anchor or toric-cylinder decoder makes every BB block a stack of toric codes; and
- static `[[n,k,d]]`, a seven-layer circuit, BP-OSD, a threshold, a hardware demonstration, and an addressable logical gate are interchangeable properties of “the BB code.”

## Indispensable interaction evidence

**Design decision.** The implementation may group these actions into a small number of stateful labs, but the learner-controlled evidence is binding:

- select a shipped instance, check-row anchor, and A/B monomial; predict the wrapped nonzero column; inspect the exact matrix/support counterpart; distinguish row incidence from column-vector action; reverse the row move under transpose;
- choose swapped or unswapped block order and inspect selected overlap parity plus the computed full CSS commutator;
- toggle X or Z errors, compute the governed syndrome, add a selected stabilizer, compare observations and residual logical class, distinguish primal cycle/boundary from dual cocycle/coboundary terminology, and repeat on a changed support with less guidance;
- predict weight, rank-based `k`, and distance provenance for toric versus gross, receiving feedback from constructor matrices, GF(2) ranks, exact enumeration, and the stored bounded witness rather than hand-authored answers;
- keep one selection synchronized across polynomial, matrix-row, Tanner, and chain-complex views; clearly label quotient/anyon/cylinder explanations that are curated rather than exact object mappings; and
- complete an evidence audit that rejects an overbroad threshold, gate, boundary, or realization claim and explains which missing certificate prevents it.

The existing gross/toric switch, X/Z filtering, exact support readout, periodic wrap view, weight-four/weight-six contrast, free exploration, origins/references, pan/zoom, and the static-circuit and automorphism-gate boundaries must survive or gain a stronger replacement. Keyboard selection, non-color encoding, meaningful resume/reset, and Learn-to-Reference return continuity are required behavior, not optional polish.

## Reference coverage and honest gaps

**Evidence.** The mastery map in `lesson-evidence-notes.md` covers every populated Reference surface: identity/construction, parameters, representations, Formal IR, decoders, operations, realizations, relations, derivations, references, variants, and provenance.

**Design decision.** Learn will not simulate data the entry does not own. It will visibly stop at the following boundaries: no exported ancillas, CNOT order, detectors, or circuit-distance witness; no gross logical basis or resolved translation action; no replayed gross lower-distance certificate; no exact anyon, cylinder, coupling-layer, or hardware-layout mapping; and a pending `two_bga` relation target. These are graduation material as honest gaps, not omissions to conceal.

## Open questions for approval

1. Approve the data-only `144 for twelve versus 144 for one` comparison as the motivating phenomenon, with the resource caveat on the same screen, or prefer automatic commutation as the front door?
2. Approve restricting quantitative exploration to the two shipped instances; arbitrary polynomial inputs would be computed examples, but they risk looking like governed Atlas claims.
3. Approve deriving and exporting a generic logical/stabilizer basis for `toric_L3` so the syndrome lab can test logical class, while explicitly leaving the gross logical action unresolved?
4. Treat bibliography metadata/reference-key gaps already present in deep prose as out of scope for this prototype and report them, rather than widening the experiment into a citation repair?
