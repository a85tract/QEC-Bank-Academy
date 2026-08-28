# T195 Lean Complete v1 sealed result

**Status:** `passed` on 2026-08-21. The implementation was repaired and
exercised in the sole mutable Atlas-only candidate before any new overlay
identity existed. Both required candidate passes produced identical semantic
outputs. The resulting source bytes were then sealed once, and the complete
cold gate plus warm replay passed under the same offline, read-only-base
boundary.

This result accepts a generic finite-object framework and checker. It does not
accept a per-code theorem, family-distance theorem, decoder, threshold,
hardware model, Formal IR compiler, proposal referee, entry backfill, or claim
promotion.

## Accepted identity

The committed manifest is
[`formal/lean/complete-v1-runtime.json`](../../formal/lean/complete-v1-runtime.json).
Its content digest is
`5c1fe7c8033638edc4f104cf8d3c9c996517090194449329baafd322afb52e1f`.
It binds:

- overlay schema `qec-atlas-lean-runtime-overlay-key-v2`;
- overlay key
  `db2b9033f10db00131b9bf97bfc0d39f098692a8e37ecbe5a3743414285ed455`;
- sealed source schema `qec-atlas-lean-overlay-sources-v2` and digest
  `4645f78667e45a50ab84986131f0a5fa912cfc4c66c53008ede08b74ea8004a2`;
- immutable T190 runtime key
  `ebf402dd1780e59233cf7a96c3547d627f4fa31d33c6b582f5fb528677b93baa`
  and `runtime-key.json` digest
  `df90841fa366467834887d2b891b1bdaa26eba176992f166bb6d9753e4ea4035`;
- immutable T190/T194 result digests
  `b19b6db0acef0c5465e9e42abbfd70352b3775d69583d9ea6fdcbee89912cb82`
  and
  `8c9f43f8ae082486dd0319b9cade88c5c75a6c505a290fa307b8e9a25d4b256c`;
  and
- corrected façade semantic id `qec-atlas-qeclean-facade-v1.1` and source
  digest
  `f4e7085eb8e74013ab20a2796e9d0db0791c3ec3b1ac48c971c2db9535a25c2b`.

The sealed root is
`/Users/charlesx/.cache/qec-atlas/lean/overlays/db2b9033f10db00131b9bf97bfc0d39f098692a8e37ecbe5a3743414285ed455/`.
It contains only the accepted Atlas package, Atlas build output and audit
logs, task-local scratch/state, and symbolic links into the frozen T190
`elan` and `qeclean` roots. No dependency tree or hard-linked Atlas source is
present.

## Candidate-first repair history

The persistent non-evidentiary candidate began from the retained T194 Atlas
source. It implemented the prospectively named repairs: both removed
`List.enum` uses became behavior-preserving `List.zipIdx` traversals, the
ambiguous inline `BinaryMatrix` became an explicitly typed local, and
`checkStructural_sound` exposes the checked proposition before applying
`of_decide_eq_true`.

Compilation then exposed additional implementation-only issues. The candidate
replaced a reserved identifier, made SHA-256 chunking structurally total,
moved standard SHA-256 vectors into the compiled self-test where `UInt32`
evaluation is appropriate, repaired Formal IR do-notation bindings, and added
a strict JSON parser because upstream parsing overwrites duplicate object
keys. A whitespace regression in that parser changed a frozen refusal
diagnostic during candidate development; it was fixed before either passing
candidate record was written. No fixture, semantic hash, certificate value,
origin, expected result, pin, or trust policy was changed to obtain a pass.

The passing candidate records have content digests
`3c38a71eb46bd82b6971973970ef047c2c71103ee361da6bdb41d069dfc18d85`
and
`57dd3df539c47a7af13037bb1164a205463a1ec9b0301086e6febf8b2daa3b20`.
The runner compared their complete semantic-output objects before it was
allowed to compute the overlay key.

## What the framework checks

The tracked package under [`formal/lean/complete-v1/`](../../formal/lean/complete-v1/)
provides one data-driven framework for:

- static stabilizer presentations;
- exact CSS/chain lowering with the frozen row interleave;
- subsystem/gauge presentations with protected-logical rank semantics; and
- finite or periodic measurement schedules with snapshot and recurrence
  checks.

Its structural checker recomputes dimensions, branch validity, canonical
RREF/pivots, `k`, the presentation-level CSS predicate, and schedule facts.
The shared logical checker distinguishes static from dressed witnesses. The
distance-upper checker binds a valid logical witness, and the bounded
small-exact checker regenerates the frozen candidate order and checks every
classification. The focused `[[4,2,2]]`-like regression exercises the
weight-two upper witness and all lower-weight classifications; the subsystem
header rule requires a dressed witness and rejects an undressed one.

The canonical checker preserved the frozen positive semantic hashes:

| branch fixture | semantic hash |
|---|---|
| CSS/chain | `79a033fc24fac87425116aae38048e3e45e5ddbb47e4a7da672254a0897d522e` |
| measurement schedule | `0b2548090dfe3fe61be780ced9dc05f69de6880cb2724078b619c9b87e5001ac` |
| static stabilizer | `5cc11a0a578aacbae38850f79bdb8f49175d19d53cd6fe9869b78417940fe28f` |
| subsystem/gauge | `50eed5f870aee3df4fb60f4556a0c3271a4c1801f485868ddda6926ad65f31d9` |

Each row has origin `{kind: verified, method:
t195-sealed-canonical-checker-and-roundtrip}`. Every positive input also
round-tripped to its exact original bytes.

## Refusal and trust boundary

The sealed cold gate and warm replay both refused anticommuting stabilizers,
nonorthogonal CSS checks, a wrong schedule snapshot, an invalid subsystem
gauge rank, noncanonical bytes, and a false semantic hash at the frozen
diagnostics. Mutations for a BOM, invalid UTF-8, malformed JSON, a duplicate
key, an unsupported schema, an additional field, and unsorted claims also
failed at their stable diagnostic classes. These claims have origin
`{kind: verified, method: t195-sealed-cold-and-warm-refusal-replay}`.

The trust audit printed the declarations and their axiom dependencies. The
accepted dependency sets are subsets of `propext`, `Classical.choice`, and
`Quot.sound`: the façade uses all permitted members; structural and
small-exact soundness use `propext`; Formal IR checking uses all permitted
members; and SHA-256 uses `propext` plus `Quot.sound`. Source scanning found no
`sorry`, `sorryAx`, `Lean.ofReduceBool`, `native_decide`, or `admit`. These
claims have origin `{kind: verified, method:
t195-sealed-print-axioms-and-source-token-audit}`.

## Offline and storage accounting

Every Lean, Lake, checker, and trust-audit child ran through the macOS sandbox
that denies network operations and writes beneath the resolved T190 base,
retained T194 overlay, and repository. Commands containing an acquisition,
fetch, clone, update, install, or cache action are refused before execution.
Runtime endpoint contacts are `{value: 0, origin: {kind: verified, method:
macos-sandbox-deny-network-plus-command-refusal}}`.

| object | allocated bytes | origin |
|---|---:|---|
| reused immutable T190 base | 10,427,691,008 | `{kind: verified, method: du-sk-times-1024}` |
| retained immutable T194 overlay | 9,105,408 | `{kind: verified, method: du-sk-times-1024}` |
| mutable T195 candidate | 150,806,528 | `{kind: verified, method: du-sk-times-1024}` |
| sealed T195 gate payload before final manifest allocation | 144,498,688 | `{kind: verified, method: du-sk-times-1024}` |
| final sealed T195 root including its manifest | 144,506,880 | `{kind: verified, method: du-sk-times-1024-post-manifest-read-only-audit}` |

The runner-computed sealed cold-gate record digest is
`0915dbe2f065f7f275770b6cf634709487f6eb73cb75efb73c68dff9e057c153`;
the corresponding warm-record digest is
`7f32db83c981535057591417e3b7ffcf5887d13d76975ea52b2097bb434ceeef`.
Their command stdout/stderr artifacts remain in the sealed root. The immutable
base audit matched before and after every gate, including the exact QECLean
head and every locked package head.

## Handoff

T195 satisfies the successful-Lean-lane precondition for T193. T193 still
waits independently for T191's compiler and T192's proposal/referee surface;
it owns all-instance backfill, integration, and calibration. The broad Lean
Wanted item remains `partial`: Complete v1 covers generic finite structural
and bounded witness certificates, but not Knill--Laflamme, family theorems,
decoder correctness, thresholds, hardware, dynamic logical transport, or
per-instance admission.
