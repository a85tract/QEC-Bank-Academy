# Bivariate bicycle Learn refactor — Evidence Notes

This notebook supports the editable Lesson Brief. It is not a second design contract.

## Source and interaction inventory

- Formal inputs and exact lattice/check supports: `atlas/bivariate_bicycle/constructor.py`, `instances.yaml`, and `pedagogy/reproduce.py`.
- Complete Level-1/2 explanation: `intuition.md` and all pages indexed by `pedagogy/derivations.md`.
- Learner-visible Reference: generated parameters, views, Formal IR, decoders, operations, realizations, relations, pedagogy, and references facets.
- Current Learn affordance: `pedagogy/tour.yaml`, rendered by `tools/site/build.py`, `widgets/tour-player.js`, `widgets/scene-explorer.js`, and `tour.css`.
- Review calibration: `docs/reviews/2026-07-30-bivariate-bicycle-owner-gold-review.md` and `docs/reviews/2026-07-30-t28-common-findings.md`.

## Mastery map

| Reference capability or anchor | Learner action | Governed data and computed feedback | Transfer or capstone evidence | Existing affordance, replacement, or honest gap |
|---|---|---|---|---|
| Identity, construction, parameters: `l,m,a_terms,b_terms`, two column blocks, CSS definition | Map a check-row anchor to each selected monomial's nonzero column; distinguish that row incidence from opposite-sign column-vector action; assemble an exact X check and its swapped-transpose Z family | Shipped parameters, constructor `S[i,i+1]=1` convention, exact support/matrix rows, computed `H_X H_Z^T` | Reconstruct a different shipped check and diagnose why the unswapped candidate fails in general | Preserve periodic wrap, instance switch, filter, and exact support readout; label coordinate offsets illustrative |
| Static observation and equivalence | Toggle Pauli errors, predict syndrome, add a stabilizer, compare syndrome and residual class; call Z-side closed/trivial objects cycles/boundaries and X-side dual objects cocycles/coboundaries | Exact shipped check matrices; syndrome parity; generic GF(2) row-space/logical-class computation | New toric error/recovery pair without prescribed path; gross syndrome task without claiming a gross logical basis | Current tour has no error action; replacement is required |
| Parameters, ranks, quotient, logicals, distance | Predict weight and `k`; identify a small row dependency; separate lower and upper distance certificates | Exact toric/gross shapes and ranks; exact toric distance; stored gross bounded origin and replayed weight-12 upper witness | Explain why another term placement need not preserve `k` or `d`; audit a false `verified d=12` claim | Preserve weight-four/weight-six contrast and “incidence is not rank”; gross lower certificate remains unreplayed |
| Representation ladder: polynomial, group algebra, CSS, chain complex, Tanner, quotient, anyon/Koszul, cylinder | Translate one selected exact object and state what each view preserves or cannot prove | Exact mapping for polynomial/matrix/Tanner/chain views; declarative origins for broader curated views | Diagnose “gross is six toric copies” and “matching cylinders prove phase equivalence” | Current dictionary is prose-only; anyon/cylinder mappings remain honest curated gaps |
| Formal IR and certificates | Distinguish exact semantic identity/order from code equivalence; interpret branch, hash, structural validity, exact-distance eligibility | Generated Formal IR projection: gross structural validity; toric structural validity plus small exact-distance enumeration | Enter the Formal IR facet out of sequence and explain why its rows certify different things | Current Learn mentions replay but not the complete generated certificate facet |
| Decoders and threshold | Compute a static syndrome; sort code, circuit, detectors, channel, decoder, scaling observable | Exact static syndrome; curated absence of schedule/detectors; decoder records and protocol-qualified threshold tuple | Reject “0.8% is every BB code's threshold” and state the missing experiment fields | Preserve explicit static/circuit boundary; no circuit lab without schedule data |
| Logical operations | Track physical CNOT Pauli conjugation; test stabilizer preservation under translation; identify missing logical action/routing certificate | Exact translation row-permutation identities; claimed operation rows and applicability | Reject gross H/S or “every automorphism is a gate”; name the necessary logical symplectic calculation | Preserve automorphism/gate boundary; gross `24x24` logical action is unresolved |
| Variants, boundaries, parent relation | Change one axis and name what must be recomputed; place BB inside abelian 2BGA without synonym collapse | Variant ledger and typed relation row with refs | Audit an open, self-dual, morphing, multivariate, or qudit claim for illegal transfer | `two_bga` target remains pending; no new variant matrices in prototype |
| Realizations and resource scope | Compare established versus proposed status while keeping exact block, platform, counts, metric, and exclusions attached | Card realization rows and realization ledger | Explain why the Kunlun `[[18,4,4]]` point is not a gross run or below-threshold family demonstration | Data-only overhead comparison retains same-screen caveat; hardware layouts are not exported |
| Derivations, references, provenance, and honest gaps | Follow a deep link, inspect origin/model scope, return to the same Learn state, and explain one missing certificate | Stable Reference anchors, origin records, derivation pages, navigation state | Capstone uses previously unseen Reference rows and asks for a supported correction to an overclaim | Current tour resets on reload/return; generic resume/history restoration is required. Some deep-prose reference keys lack complete reader metadata and remain reported out of scope |

## Verified current-machine findings

- The current BB tour supports fixed guided steps, gross/toric switching, X/Z filters, exact support selection, pan/zoom, and free exploration, but no prediction or learner answer contract.
- Tour state is in memory and initializes at step zero; reload and return do not restore progress or lab inputs.
- The landing copy promises “logical paths,” but the BB lattice exports no logical operators.
- The lattice's `initialState`, `focusByFilter`, and `dimAlpha` density hints are not represented by the active Scene v2 payload, so the gross all-check view opens densely.
- X/Z gross spokes rely primarily on color in the tour; a visible non-color legend is absent.
- The current narrow layout stacks the visual before the explanatory task, leaving the learner to meet a dense graph before the causal prompt.

## Factual boundaries to preserve

- `toric_L3` is an exact `[[18,2,3]]` convention anchor, not evidence that arbitrary BB codes decompose into toric copies.
- Gross `d=12` is bounded: literature lower bound plus machine-replayed upper witness.
- The constructor owns static check incidence, not ancillas, gate ordering, detectors, or circuit distance.
- Translation preservation of the stabilizer group does not identify an addressable gross logical gate.
- The finite-block comparison is data-only; realization and decoder resources remain separate.
