# From torus polynomials to a CSS chain complex

This page fixes the convention used by `constructor.py` and pays the
commutation argument in full. The purpose is not just to remember the formula
\(H_X=[A|B]\), \(H_Z=[B^T|A^T]\), but to see why that particular formula is
the natural one.

## 1. The regular torus representation

Let \(e_{i,j}\) be the standard basis vector at
\((i,j)\in\mathbb Z_l\times\mathbb Z_m\). The constructor's cyclic matrix
\(S_l\) has a one in row \(i\), column \(i+1\), with indices modulo \(l\).
With the flattened index \(im+j\), define

\[
x=S_l\otimes I_m,\qquad y=I_l\otimes S_m.
\]

The first operator changes only the \(i\) coordinate; the second changes only
the \(j\) coordinate. Therefore

\[
x^l=I,\qquad y^m=I,\qquad xy=yx.
\]

These matrices give the regular representation of

\[
R=\mathbb F_2[x,y]/(x^l-1,y^m-1).
\]

In characteristic two, \(x^l-1=x^l+1\), so the plus-sign convention used in
some papers describes the same quotient.

Every monomial \(x^a y^b\) is a permutation matrix. Its transpose is its
inverse:

\[
(x^a y^b)^T=x^{-a}y^{-b},
\]

with negative exponents reduced modulo \(l,m\). This is why transposition has
a geometric meaning: it reverses a torus translation.

## 2. Sparse polynomials give LDPC incidence

For a binary polynomial

\[
A=\sum_{(a,b)\in T_A} x^a y^b,
\]

each row contains one entry contributed by each distinct monomial. If the
reduced exponent pairs in \(T_A\) are distinct, every row and every column has
weight \(|T_A|\). Repeated terms cancel over \(\mathbb F_2\); the constructor
therefore reduces exponent pairs modulo the two cyclic orders before applying
XOR.

The gross inputs are

\[
A=x^3+y+y^2,\qquad B=y^3+x+x^2
\]

on \(l=12,m=6\). Both matrices have row and column weight three. No geometric
plaquette was separately specified: the check graph is the incidence graph
of these translations.

## 3. Why the swapped transpose is forced

Place two qubits at each torus site. The first \(lm\) columns form the left
data block and the second \(lm\) columns the right block. Define

\[
H_X=[A\mid B].
\]

A CSS Z-check matrix must obey \(H_XH_Z^T=0\). Choose

\[
H_Z=[B^T\mid A^T].
\]

Then

\[
\begin{aligned}
H_XH_Z^T
&=[A\mid B]
  \begin{bmatrix}B\\A\end{bmatrix}\\
&=AB+BA\\
&=AB+AB\\
&=0.
\end{aligned}
\]

The third line uses \(AB=BA\), which follows from the abelian torus algebra.
The last line uses characteristic two.

Both the transpose and the swap have jobs. Transpose reverses the Z-side
incidence so that it is the dual map. The swap routes the overlap through
\(AB+BA\). If the candidate were instead
\([A^T|B^T]\), its product with \(H_X\) would be \(A^2+B^2\), which is not
constrained to vanish.

## 4. The three-term complex

The same calculation is the boundary-of-a-boundary identity in

\[
R
\xrightarrow{\;\partial_2=[B;A]\;}
R^2
\xrightarrow{\;\partial_1=[A|B]\;}
R.
\]

Here

\[
\partial_1\partial_2=AB+BA=0.
\]

In the binary CSS convention, \(\partial_1=H_X\) and
\(\partial_2^T=H_Z\). An X-type Pauli that commutes with every Z check is a
cycle; multiplying by an X stabilizer adds a boundary. The nontrivial
X-logical classes are therefore a quotient of cycles by boundaries. The
Z-logical classes are the dual quotient.

This is the exact place where the homological language earns its keep:
“commutes with the checks” and “is a stabilizer” are different subspaces, and
logical information is the gap between them. The general binary dictionary is
in [CSS chain complexes](../../../foundations/css-chain-complexes/).

## 5. The toric anchor

Set \(l=m=L\) and choose

\[
A=1+x,\qquad B=1+y.
\]

Each polynomial has two terms, so each check has weight four. The resulting
complex is the periodic square-lattice toric complex in the BB column
convention: two qubits per unit cell, one X check and one Z check per cell.

For the shipped \(L=3\) instance, the constructor produces two \(9\times18\)
check matrices. Both have rank eight, leaving

\[
k=18-8-8=2.
\]

The Atlas exact CSS enumerator finds distance three. This `[[18,2,3]]` anchor
tests the shift orientation, swapped transpose, ranks, and exact-distance path
on a small instance.

It does not prove that an arbitrary BB block is locally Clifford equivalent
to independent toric codes. `sahay2026matching` uses a symmetry reduction to
obtain toric-like cylinders for decoding, while `chen2025anyon` finds
topological frustration in more general BB data. Those statements concern
different equivalences.

## 6. What the executable artifact certifies

`pedagogy/reproduce.py` independently reconstructs \(x,y,A,B\), then checks:

- the two periods and \(xy=yx\);
- the exact gross polynomials;
- \(H_Z=[B^T|A^T]\);
- \(H_XH_Z^T=0\);
- the two small toric ranks and exact distance.

The card's construction-replay tree now binds the two exponent lists into
versioned `bivariate_polynomial@1` factors and assembles them with
`bivariate_bicycle@1`. The verifier compares the complete output arrays, not
only ranks or row spaces, so this page's block and translation conventions are
part of the machine witness rather than an equivalence-only assertion.

## Provenance

The polynomial and syndrome-circuit presentation follows
`bravyi2024bicycle`; the group-algebra placement follows
`wang2023abelian` and `lin2023twoblock`. Every displayed matrix identity for
the shipped instances is rerun locally. The general topological caveat is
literature-sourced to `chen2025anyon` and `sahay2026matching`.
