# Bivariate bicycle code — Level-2 map

This index separates the algebraic definition, the finite-block arithmetic,
and the circuit/architecture claims that are often compressed into the label
“low-overhead BB memory.”

1. [From torus polynomials to a CSS chain complex](polynomial-chain-complex.md):
   the cyclic-shift convention, transpose as inverse translation, the swapped
   CSS pair, exact commutation, and the small toric anchor.
2. [Gross-code parameter and provenance ledger](gross-parameter-ledger.md):
   the exact matrix shapes, row/column weights, ranks, quotient dimension,
   bounded distance, and the boundary between data-only and full-system
   overhead.
3. [Syndrome circuits and decoding](syndrome-circuits-and-decoding.md):
   why static distance, circuit distance, detector construction, BP-OSD, and
   protocol-qualified thresholds are five different objects.
4. [Logical operations and their certificates](logical-operations.md):
   transversal CNOT, translation automorphisms, fold/automorphism gates,
   surgery, self-dual variants, and the missing universal-gate claim.
5. [Realization ledger](realization-ledger.md): what the Kunlun experiment
   demonstrated and how it differs from neutral-atom, layered, morphing,
   photonic, distributed, and modular proposals.
6. [Representation dictionary](representation-dictionary.md): the polynomial,
   group-algebra, homological, Tanner, quotient, anyon, and toric-cylinder
   views, with the invariant and caveat for each translation.
7. [Variant and boundary map](variant-boundary-map.md): ancestry, multivariate
   and coprime subclasses, pruning, planar tiles, self-duality, qudits, and
   why a shared bulk tile does not determine open-boundary parameters.

## Reproduction contract

Run from the repository root:

```bash
source .venv/bin/activate
python atlas/bivariate_bicycle/pedagogy/reproduce.py
make verify-entry E=atlas/bivariate_bicycle
```

`reproduce.py` loads the shipped constructor and asserts the gross
polynomials, torus relations, matrix shapes, commutation, ranks, quotient
dimension, row and column weights, exact first-check supports, translation
automorphisms, lattice/check correspondence, seeded distance upper witness,
and the exact `[[18,2,3]]` toric anchor. The ordinary verifier independently
checks both `instances.yaml` records.

The `construction:` block pins `bivariate_polynomial@1` for both polynomial
factors and `bivariate_bicycle@1` for the CSS block assembly. Instance
parameters bind the two cyclic orders and both exponent lists. Replay must
reconstruct the exact ordinary-constructor matrix—including row, qubit, and
two-block ordering—for both `gross` and `toric_L3`.

## Provenance split

- **Recomputed facts:** the two shipped CSS matrices; `n`, `k`, CSS status,
  check and qubit degrees, gross ranks and quotient codimension, torus
  periodicity and commutation, translation preservation of the stabilizer
  spaces, lattice incidences, the gross weight-12 upper witness, and the
  toric anchor's exact distance.
- **Bounded facts:** the gross distance. Its lower bound is cited to
  `bravyi2024bicycle`; its upper bound is rerun by
  `rand-lowweight-v1(seed=5,iters=2000)`.
- **Literature claims:** the gross lower-bound certificate, syndrome-circuit
  depth and threshold estimate, decoder performance, asymptotic limitation,
  logical-gate protocols, topological/anyon interpretation, and every
  hardware experiment or architecture proposal.
