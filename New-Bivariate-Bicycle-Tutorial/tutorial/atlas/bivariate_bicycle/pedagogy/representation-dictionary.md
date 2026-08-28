# Representation dictionary

BB codes are unusually easy to misname because the same matrices sit inside
several broader constructions. This dictionary records what each view makes
transparent, which data it preserves, and which inference it does not license.

## View map

| view | basic object | best question | preserved invariant | caveat |
|---|---|---|---|---|
| bivariate polynomial | \(A(x,y),B(x,y)\) in a finite quotient ring | How do four parameters build the checks? | exact matrix in the chosen shift convention | a compact polynomial does not certify distance or circuit layout |
| group algebra | two elements of \(\mathbb F_2[\mathbb Z_l\times\mathbb Z_m]\) | Why do the blocks commute, and what is the parent family? | regular-action algebra and two-block structure | nonabelian 2BGA codes need not be bivariate |
| lifted-product / chain complex | \(R\to R^2\to R\) | Where do logical quotients live? | boundary maps and middle homology | “lifted product,” HGP, and BB are not synonyms |
| Tanner graph | check-variable incidence | Which couplers and degrees are required? | row/column support | incidence omits CNOT order, ancillas, detectors, and fault propagation |
| quotient module / roots | \(R/(A,B)\) and common factors | Why does rank drop, and what happens at a boundary? | image ideal and quotient dimension | common roots alone do not give distance |
| anyon / Koszul | excitation modules and mobility relations | What topological sectors and constraints exist? | ideal/complex data translated into excitations | finite degeneracy need not be a trivial toric stack |
| toric cylinders | symmetry-reduced decoding problems | When can matching replace a generic qLDPC decoder? | selected syndrome/logical sectors under the reduction | operational decoder equivalence is not global local-Clifford equivalence |

## Polynomial to group algebra

The monomial \(x^a y^b\) labels the group element
\((a,b)\in\mathbb Z_l\times\mathbb Z_m\). Acting by the regular
representation turns group multiplication into matrix multiplication. Since
the group is abelian, the regular matrices for \(A\) and \(B\) commute.

This translation explains the relation row:

\[
\text{BB}\subset\text{abelian 2BGA}\subset\text{two-block codes}.
\]

`wang2023abelian` develops the abelian/nonabelian two-block setting, while
`lin2023twoblock` places 2BGA codes inside lifted products. The containments
are not equalities:

- a 2BGA code may use another group;
- a nonabelian construction can make left and right actions commute without
  a two-variable abelian polynomial ring;
- a general lifted product can have larger base matrices than the two-block
  BB complex.

## Group algebra to chain complex

The maps \([B;A]\) and \([A|B]\) are \(R\)-linear. Their composition vanishes,
so they define a length-two complex. Forgetting \(R\)-linearity gives the
binary CSS matrices; retaining it exposes translations and quotient modules.

The two descriptions preserve the exact code when the same bases and regular
representation are fixed. Changing bases can preserve a code space while
changing row/qubit order; that distinction matters for the Atlas replay
contract, which requires exact matrices rather than equivalence.

## Chain complex to quotient module

The image of \([A|B]\) is the ideal \((A,B)\). The quotient \(R/(A,B)\)
therefore measures one rank defect. Factorization and common-root methods can
predict when this quotient is nonzero and how its dimension changes with
periods or boundaries. `postema2025existence` uses this structure to
characterize existence and asymptotic limitations; `wang2026bbs` extends the
root/boundary analysis.

Rank is still not distance. A quotient class can have a low-weight
representative, or every representative may be spread across the torus.
Distance asks for the lightest nontrivial class after all stabilizer
reductions.

## Polynomial to Tanner and circuit views

Every nonzero entry of \(A\) or \(B\) is an edge between one check and one data
qubit. The gross three-plus-three terms give weight-six checks and three X
plus three Z incidences per data qubit. `bravyi2024bicycle` shows how this
graph splits into two planar degree-three coupling layers.

The graph is necessary but insufficient for a fault circuit. A Tanner edge
says two systems interact; it does not specify:

- which ancilla owns a check;
- when the interaction occurs;
- control/target orientation;
- reset and measurement timing;
- which measurement products are detectors.

`shaw2025morphing` changes the instantaneous code and graph, illustrating why
connectivity reduction cannot be described as a mere redrawing of the same
static matrix.

## Quotients to anyons

`chen2025anyon` interprets polynomial/Koszul data as excitation types,
mobility constraints, and topological frustration. This picture asks which
defects can move under local operators and how global torus constraints create
logical sectors.

The caution is essential: the existence of \(k/2\) quotient dimensions does
not mean the Hamiltonian is simply \(k/2\) decoupled toric codes. Logical
degeneracy, local-Clifford phase equivalence, and decoder decomposition are
different equivalence relations.

## Anyons to toric-cylinder decoding

`sahay2026matching` exploits symmetries to expose toric-like cylinders and
apply MWPM, then combines the result with BP and over-matching. The preserved
object is the selected decoding problem: syndromes and logical ambiguity
under the reduction.

This does not contradict topological frustration. A decoder may map parts of
an inference problem to familiar cylinders without producing a finite-depth
local unitary that decomposes the entire BB Hamiltonian into toric copies.

## Choosing the right view

Use:

- polynomials to construct;
- group algebra to classify the parent relation;
- the chain complex to reason about logical quotients;
- quotient modules/roots to predict rank and boundary effects;
- Tanner graphs to design couplers;
- explicit circuits/detectors to discuss thresholds;
- anyons to classify excitations;
- cylinders to justify a matching decoder.

Calling all of them “the BB representation” erases the question each
translation was built to answer.
