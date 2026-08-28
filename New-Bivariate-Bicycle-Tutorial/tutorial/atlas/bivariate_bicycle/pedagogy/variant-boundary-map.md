# Variant and boundary map

“Bivariate bicycle” is a construction principle, while names such as gross,
double-gross, BB5, or BB6 often refer to finite instances or check-weight
classes. This page organizes genuine variant axes and prevents parameter
claims from leaking across them.

## Ancestry and parent relation

`mackay2004sparse` introduced sparse quantum bicycle codes built from
circulant structure. `panteleev2021degenerate` developed generalized bicycle
codes, finite-length searches, and BP-OSD. Modern BB codes replace a single
cyclic direction by the two-dimensional abelian group
\(\mathbb Z_l\times\mathbb Z_m\).

The exact parent is abelian two-block group-algebra code:
`wang2023abelian` and `lin2023twoblock`. “Generalized bicycle,” “2BGA,”
“lifted product,” and “bivariate bicycle” overlap historically and
algebraically, but they are not interchangeable type names.

## Variant axes

| axis | ordinary shipped BB | variant | what must be recomputed |
|---|---|---|---|
| number of variables | \(x,y\) | multivariate (`voss2025multivariate`) | matrix size, locality dimension, rank, distance |
| polynomial restrictions | unconstrained sparse search | coprime subclass (`wang2026coprime`) | attainable rate, distance, layout |
| boundary | periodic torus | pruned/open or tile boundary (`eberhardt2024pruning`, `liang2025planar`, `steffan2025tile`) | checks, qubits, rank, logical strings, distance |
| duality | ordinary swapped-transpose CSS | self-dual twisted torus (`liang2025selfdual`) | check weight, Clifford action, finite parameters |
| alphabet | qubits over \(\mathbb F_2\) | prime-dimensional qudits (`liang2026qudit`) | commutation form, \(n,k,d\) units, decoder |
| CSS condition | exact \(H_X,H_Z\) split | perturbed non-CSS candidates (`cruzbenito2026evolutionary`) | full symplectic checks and Pauli distance |
| extraction | static code throughout | morphing (`shaw2025morphing`) | instantaneous stabilizers, detectors, circuit distance |

## Multivariate is a broader ansatz

Adding a third independent cyclic variable produces a multivariate bicycle
code. It remains an abelian group-algebra relative, but it is no longer
bivariate. The extra direction can change locality dimension and hardware
embedding even if the number of polynomial terms stays fixed.

Consequently, a multivariate candidate with the same check weight is not a BB
instance with a longer parameter list. The constructor and controlled
relation should identify its larger algebra.

## Coprime restrictions trade search freedom for predictability

`wang2026coprime` constrains generator factors so rate can be selected before
the full finite search and co-designs a cold-atom layout. This is a subclass:
every coprime BB candidate satisfies the broader bivariate form, but ordinary
BB polynomials need not satisfy the coprime factorization.

The restriction can improve design predictability while excluding otherwise
useful finite blocks. Rate formulas from the subclass must not be assigned to
the gross code without checking its factors and periods.

## Open boundaries change the algebra

A periodic BB code identifies opposite torus edges. Removing qubits/checks or
terminating a repeated tile breaks those identifications. Three separate
questions appear:

1. Which bulk checks survive unchanged?
2. Which boundary checks must be shortened, added, or removed so the CSS
   commutation condition remains valid?
3. Which cycles become boundaries or open strings, changing \(k\) and \(d\)?

`eberhardt2024pruning` guarantees its procedure for the cyclic-HGP subcase
and demonstrates examples beyond it; that is not a theorem for arbitrary BB
polynomials. `liang2025planar` and `steffan2025tile` build planar/open codes
related to BB bulk patterns, but a shared tile does not determine a shared
logical space.

The safe workflow is to construct the finite open matrices, recompute rank,
validate commutation, and find new logical representatives. Copying periodic
\(k,d\) across the cut is invalid.

`wang2026bbs` further shows why polynomial roots at zero or infinity require
special boundary generators and distinguishes rectangular, diagonal, and
tilted prescriptions. “Open BB” is therefore not one boundary condition.

## Self-duality is extra structure

Ordinary BB already has an X/Z-related swapped-transpose form, but that does
not automatically give a physical self-duality implementing H or S.
`liang2025selfdual` imposes additional constraints on a twisted torus and
reports weight-eight examples with transversal Clifford gates.

Two implications must stay separate:

- CSS transpose symmetry helps prove commutation;
- physical self-duality plus a resolved logical action can certify
  transversal H/S.

The first is generic to the shipped construction. The second belongs only to
the cited subfamily.

## Qudits change the unit of comparison

`liang2026qudit` extends twisted-torus ideas to prime-dimensional qudits. A
qudit stabilizer uses a symplectic form over \(\mathbb F_p\), not binary XOR.
Its \(k\) counts logical \(p\)-level systems, and its hardware error channel
has different Pauli types and normalization.

Comparing \(kd^2/n\) across qubit and qudit examples without stating \(p\)
mixes resource units. A future qudit Atlas entry should use an engine type that
actually validates \(\mathbb F_p\) commutation rather than forcing the data
through the binary constructor.

## Search-generated perturbations

`cruzbenito2026evolutionary` combines program mutation, GF(2) rank, distance
certification, graph deduplication, and local-Clifford checks. Some candidates
leave the strict CSS BB ansatz. Once X and Z are mixed within stabilizer rows,
the defining object is a full symplectic check matrix and the CSS polynomial
commutation proof no longer applies.

Similarity of a Tanner graph or ancestry in a BB search is not enough to keep
the strict family label.

## Asymptotic boundary

`postema2025existence` proves asymptotic badness for the studied BB subclass.
That result and the strong gross finite point coexist:

- finite search can find a valuable high-rate, moderate-distance memory;
- fixed construction constraints need not yield nonzero asymptotic rate and
  relative distance simultaneously.

The correct product claim is therefore “strong finite constants under a
specific connectivity model,” not “asymptotically good qLDPC from a
two-dimensional local torus.”

## Negative-result checklist

Before transferring a claim between variants, ask:

- Are the coefficient field and number of variables unchanged?
- Are the periods and boundary conditions identical?
- Are the stabilizers static or morphed during extraction?
- Is self-duality actually proved for this block?
- Was rank recomputed after pruning?
- Does the cited decoder use the same detector model?

If any answer is no, the new object needs its own executable instance and
provenance ledger.
