# Surface Learn evidence notes

These notes support the approved Lesson Brief. They are an audit notebook, not a second design contract and not learner-facing content.

## Governed anchors

- `atlas/surface/constructor.py` builds `HGP(rep_L, rep_L)`, validates the CSS `CheckMatrix`, and exports the illustrative incidence coordinates and exact check supports.
- `atlas/surface/instances.yaml` records L3 `[[13,1,3]]` and L4 `[[25,1,4]]` as verified; L5 `d=5` is recorded as a bounded equality rather than exact verified enumeration.
- `atlas/surface/circuit_memory_l3.yaml` names one L3 logical-X memory schedule. Its matrix fingerprint, data/check maps, four CNOT layers, and two hook fixtures are strictly reconciled by `qeclib.circuits.load_ancilla_memory_schedule`.
- `atlas/surface/pedagogy/tour.yaml` preserves the existing constructor-derived HGP factor tour, exact check notes, and open/periodic Surface–toric comparison.
- `atlas/surface/intuition.md` and the Level-2 documents cover decoding, distance, HGP construction, lattice surgery, thresholds, and derivations.
- `atlas/surface/card.yaml` is the governed inventory for decoders, operations, realizations, relations, representation rungs, references, and explicit gaps.

## Validated logical families used by the lesson

The lesson declaration supplies candidates that are not present in the generic Scene export. The site builder must validate every candidate against the constructed CSS matrix before emitting it.

- L3 X representatives: rows `{0,1,2}`, `{3,4,5}`, `{6,7,8}`.
- L3 Z representatives: columns `{0,3,6}`, `{1,4,7}`, `{2,5,8}`.
- L4 X representatives: the four rows of the first `L²` block.
- L4 Z representatives: the four columns of the first `L²` block.

Validation requirements: zero opposite-check syndrome, exclusion from the same-Pauli stabilizer row space, pairwise same-family equivalence modulo stabilizers, and odd X/Z overlap for the selected crossing representatives.

## Compact mastery map

| Reference capability or anchor | Learner action | Governed data and computed feedback | Transfer/capstone evidence | Preserved affordance or gap |
|---|---|---|---|---|
| Identity, checks, syndrome, decoders | Toggle an error, predict changed checks, then recover from syndrome | L3/L4 constructor supports; odd-overlap syndrome; GF(2) residual class | Changed X/Z cases and hidden-error recovery | Existing Scene retained; decoder execution itself is out of scope |
| Encoded qubit, logical equivalence, parameters, distance | Select/deform crossing logical representatives and distinguish stabilizer from logical residuals | validated CSS row spaces, declared logical families, verified L3/L4 claims | construct an unfamiliar L4 representative and justify its weight | full proof stays in `distance-proof.md`; L5 remains bounded |
| Construction, topology, relations | Inspect factor-indexed checks and switch open/periodic factors | existing HGP tour payload from Surface and toric constructors | explain which incidence disappears at an open endpoint | existing seven-step HGP tour retained intact |
| Measurement machinery and fault scope | Step four exact CNOT layers and activate a named hook fixture | strictly loaded circuit artifact and recomputed propagation fixture | diagnose why a correlated pair is not a static-distance result | no R4 detector model or circuit-distance proof |
| Operations and lattice surgery | Select seam checks and compute their GF(2) product; state repeated-round assumptions | curated symbolic seam with verified XOR; HGP-derived merged dimensions | audit an operation claim and missing detector evidence | full spacetime surgery remains an honest gap |
| Decoder regimes and performance | match threshold statements to noise/measurement/circuit/decoder assumptions | governed decoder records and claimed/curated origins | capstone rejects cross-regime numerical comparison | no live decoder benchmark in the prototype |
| Realizations and platforms | distinguish demonstrated hardware results from universal code properties | governed realization descriptions and references | capstone identifies preparation/fault-tolerance limitation | hardware coupling map is not inferred from Scene coordinates |
| Representation ladder R1–R5 | translate selected support into a matrix row; compare what construction and circuit views add | R1/R2 exact data; named circuit artifact; Reference rungs | audit an unfamiliar representation claim | R3/R4 empty; R5 curated, not synchronized |
| Provenance, limitations, citations | inspect origin badges and follow exact Reference anchors | card/instance origins and registered references | independent evidence audit in capstone | citations are provenance, never missing explanation |

## Navigation and state audit targets

Persist chapter, step, completed steps, checkpoint attempts, learner-chosen error and recovery supports, selected logical representatives, construction mode, circuit layer/fixture, surgery check selection, capstone notes, and camera state. Recompute syndrome and logical classification after restoration. Store hidden errors only in session state, never in the hash. Test Back/Forward, reload, deep link, Reference excursion and explicit return, invalid version/state fallback, Reset lab, Start over, keyboard operation, and a narrow viewport.

## Non-goals

This prototype does not alter formal claims, add decoders, invent a hardware layout, establish circuit-level distance, claim an exact R5 dictionary, replace the expert Reference, or present symbolic seam arithmetic as a complete fault-tolerant surgery protocol.
