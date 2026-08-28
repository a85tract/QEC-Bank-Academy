# Gross-code parameter and provenance ledger

This page derives every static number attached to the shipped gross instance
and labels what the repository recomputes versus what remains a literature
obligation.

## Inputs and matrix sizes

The instance records

| input | value | role |
|---|---:|---|
| \(l\) | 12 | order of the \(x\) translation |
| \(m\) | 6 | order of the \(y\) translation |
| \(A\) | \(x^3+y+y^2\) | left half of each X check |
| \(B\) | \(y^3+x+x^2\) | right half of each X check |

The torus algebra has binary dimension

\[
N=lm=12\cdot6=72.
\]

Both \(A\) and \(B\) are \(72\times72\). Concatenating two blocks gives
\(H_X,H_Z\in\mathbb F_2^{72\times144}\), hence

\[
n=2N=144.
\]

This is the data-qubit count. It excludes syndrome ancillas, couplers,
routing workspace, spare modules, and decoder hardware.

## Check weight and qubit degree

Each gross polynomial contains three distinct reduced monomials. A monomial
is a permutation matrix, so each contributes exactly one one per row and
column. Therefore:

- every row and column of \(A\) has weight three;
- every row and column of \(B\) has weight three;
- every row of \(H_X=[A|B]\) has weight six;
- every row of \(H_Z=[B^T|A^T]\) has weight six;
- every data qubit belongs to three X checks and three Z checks.

The last statement is sometimes compressed to “degree six.” Keeping the
Pauli split visible matters for a circuit: three X-type and three Z-type
interactions have different ancilla preparations and fault propagation.

`reproduce.py` checks every row and column, rather than inferring the result
from the input term count.

## Rank and encoded dimension

Gaussian elimination over \(\mathbb F_2\) gives

\[
\operatorname{rank}H_X=66,\qquad
\operatorname{rank}H_Z=66.
\]

The CSS stabilizer rank is their sum because pure-X and pure-Z binary
symplectic rows cannot cancel each other. Thus

\[
k=n-\operatorname{rank}H_X-\operatorname{rank}H_Z
 =144-66-66=12.
\]

There is a useful quotient reading. The map

\[
[A|B]:R^2\longrightarrow R,\qquad (u,v)\mapsto Au+Bv
\]

has image equal to the ideal \((A,B)\). Its rank is 66, so its cokernel
\(R/(A,B)\) has dimension

\[
\dim_{\mathbb F_2}R/(A,B)=72-66=6.
\]

For the displayed gross complex, the dual side has the same six-dimensional
defect, leaving twelve logical dimensions in the middle. This is a computed
fact for these periods and polynomials. Three terms in \(A\) and three in
\(B\) do not determine the rank: changing their exponents changes the common
ideal and can change \(k\).

The quotient perspective is the route developed further in
`postema2025existence`. It turns code search into a tension:

- a larger common quotient can increase \(k\);
- the same shared structure may introduce short nontrivial cycles and reduce
  distance;
- locality constraints restrict the permitted monomial offsets.

## Distance: two certificates, not one label

The gross instance records

```yaml
lower: {value: 12}
upper: {value: 12, method: rand-lowweight-v1, seed: 5, iters: 2000}
origin: {kind: bounded, ref: bravyi2024bicycle}
```

The two sides mean different things.

**Lower bound.** `bravyi2024bicycle` supplies the claim that no nontrivial
logical Pauli has weight below 12. The Atlas does not currently replay that
lower-bound certificate. The citation is therefore part of the structured
origin, not decorative bibliography.

**Upper bound.** The repository constructs the centralizer nullspaces,
samples deterministic binary combinations with NumPy seed 5, rejects
stabilizer classes, greedily reduces representatives by same-type
stabilizers, and finds weight 12 within 2,000 iterations. This is a rerunnable
existence witness for a logical of weight at most 12.

Because the cited lower bound and machine upper bound meet,
\(d=12\). The origin is `bounded`, not `verified`: the machine has not
exhaustively excluded weights one through eleven at \(n=144\).

The seed is not tuned data. A seed-zero run with 2,000 iterations reaches only
weight 14, while a longer seed-zero run reaches 12. The stored seed-five
search is a compact deterministic witness. If a future engine finds a smaller
logical, verification reports an improvement or mismatch; the expected
distance must then be diagnosed against the literature rather than adjusted
silently.

## The finite-block overhead comparison

The data-only ratio is

\[
\frac{n}{k}=\frac{144}{12}=12
\]

data qubits per encoded qubit at distance 12. A distance-12 rotated
surface-code patch uses \(d^2=144\) data qubits for one logical qubit. This is
the twelve-fold finite-block comparison emphasized by
`bravyi2024bicycle`.

It is not a full-machine ratio. A BB cycle also needs syndrome ancillas,
degree-six interactions, a seven-CNOT-layer schedule in the original
proposal, measurement/reset, classical detector processing, and BP-OSD.
Architectures may add movement, communication, spare blocks, or surface-code
ancillas for logical operations. Comparisons must put the same resources in
both denominators.

## Static versus circuit distance

The value 12 belongs to the static stabilizer code. A syndrome circuit defines
a spacetime fault code whose minimum undetectable fault set can be smaller.
CNOT ordering controls how an ancilla error spreads across data qubits; the
detector construction controls which histories are distinguishable.

Consequently, none of these follows from the static ledger alone:

- a distance-12 fault circuit;
- a universal threshold;
- a decoder-independent logical error rate;
- a logical-gate error rate.

Those quantities move to the
[syndrome-circuit ledger](syndrome-circuits-and-decoding.md) or the
[operations ledger](logical-operations.md).

## Recomputed summary

For the exact shipped row and qubit order, `reproduce.py` asserts:

- \(N=72\), \(H_X,H_Z\) shapes \(72\times144\);
- rank 66 for both check matrices and stabilizer rank 132;
- `[[144,12]]` CSS parameters;
- weight six for every check;
- three X checks and three Z checks incident on every data qubit;
- quotient codimension six;
- a deterministic weight-12 upper witness.

Only the distance lower bound remains sourced rather than replayed.
