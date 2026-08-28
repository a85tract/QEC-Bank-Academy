# Logical operations and their certificates

A high-rate memory is not yet a computer. The relevant question is not “does
the code have symmetries?” but “which physical process preserves the code,
what logical symplectic action does it induce, and what fault-tolerance and
routing resources certify that action?”

## 1. Transversal CNOT between identical CSS blocks

Take two identical BB blocks, labelled control \(c\) and target \(t\), and
apply physical CNOT from qubit \(i\) of \(c\) to qubit \(i\) of \(t\) for
every \(i\).

Physical CNOT conjugates Paulis as

\[
X_c\mapsto X_cX_t,\quad X_t\mapsto X_t,\qquad
Z_c\mapsto Z_c,\quad Z_t\mapsto Z_cZ_t.
\]

Therefore an X stabilizer on the control block acquires the matching X
stabilizer on the target; an X stabilizer on the target stays fixed. Dually,
a target Z stabilizer acquires the matching control Z stabilizer, while a
control Z stabilizer stays fixed. Every image remains in the two-block
stabilizer group.

The same conjugation applies to corresponding logical Pauli pairs, giving the
parallel logical CNOT action. This is a code-space statement. A hardware
implementation still needs aligned pairs, a fault model for correlated
two-block errors, and a decoder that handles them. `yoder2025tour` embeds this
primitive inside a gross-family modular architecture.

## 2. Translations preserve the code but do not name a gate

Let \(P\) be either torus translation \(x\) or \(y\), and apply \(P\) to both
data blocks. Since \(A,B,A^T,B^T\) all commute with \(P\),

\[
H_X\operatorname{diag}(P,P)=PH_X,\qquad
H_Z\operatorname{diag}(P,P)=PH_Z.
\]

Left multiplication by \(P\) merely permutes check rows. Thus the physical
qubit permutation maps the stabilizer group to itself. `reproduce.py` checks
these exact matrix identities for the gross instance.

This proves code-space preservation, not usefulness. To certify a logical
gate:

1. choose a logical Pauli basis;
2. conjugate every basis element by the physical permutation;
3. reduce each image modulo stabilizers;
4. assemble the induced \(24\times24\) binary symplectic action for the twelve
   logical qubits;
5. determine whether the desired physical routing is fault tolerant.

The action may be trivial, may permute logicals, or may implement a coupled
Clifford. The card does not call translations logical gates because the gross
action has not been certified there.

## 3. Fold-transversal gates require selected symmetry

`eberhardt2024fold` constructs explicit logical bases and fold-transversal
Clifford gates for symmetric BB examples, including `[[98,6,12]]` and
`[[162,8,12]]` blocks. A fold pairs qubits related by a reflection or other
involution so that constant-depth physical Cliffords implement a logical
operation.

The certificate has three parts:

- the physical permutation is an automorphism of the chosen check spaces;
- its induced logical Pauli action is computed;
- the folded interaction pattern is available or routable.

The extra symmetry is a code-selection condition. These examples do not imply
that the original `[[144,12,12]]` gross block has the same fold gate.

`sayginel2025automorphisms` generalizes the workflow: find Tanner-graph
automorphisms, resolve their logical symplectic actions, and compile useful
Cliffords. Again, graph preservation without the logical action is only the
first step.

## 4. Surgery and modular operations

Long-range surgery uses an ancilla code or patch to measure joint logical
Paulis between data blocks. Repeated syndrome extraction makes the parity
measurement fault tolerant; classical feed-forward completes teleportation
or Clifford gadgets.

`cohen2022longrange` develops the general infrastructure for high-rate codes.
`yoder2025tour` supplies a gross-family instruction set, compilation path, and
resource estimates for distance-12 and distance-18 modules. These operations
are not transversal properties of one BB check matrix. Their cost includes:

- an ancilla or communication module;
- repeated extraction rounds;
- boundary/interface checks or long-range couplers;
- a joint detector model and decoder;
- idle and routing exposure of the packed logical qubits.

The card labels the mechanism `surgery` so those resources are not hidden
under “logical Clifford.”

## 5. Self-dual and cup-product subfamilies

`liang2025selfdual` imposes extra self-duality and twisted-torus conditions,
obtaining weight-eight BB blocks with transversal CNOT, H, and S. Those
conditions change the selected family. The operation row explicitly says
“self-dual BB subfamily” and is not a gross claim.

`breuckmann2026cups` uses cohomology and cup-product invariants to certify
constant-depth logical operations on codes with the required structure,
including selected BB examples. The cup product is the gate certificate; a
generic bivariate polynomial pair does not automatically supply it.

`xu2025batched` develops batched error correction, surgery, switching, and
Clifford gadgets for CSS qLDPC architectures and specializes a proposal to
self-dual BB blocks. “Batched” changes the resource schedule and shared
ancilla accounting, not the static stabilizer parameters.

## 6. The non-Clifford boundary

No source in the six-lens sweep supplies a universal transversal gate set for
the original gross block. This is the honest boundary:

- transversal CNOT is available between aligned identical CSS blocks;
- selected symmetric or self-dual blocks gain more Cliffords;
- surgery and automorphisms enlarge the instruction set with extra resources;
- non-Clifford completion still needs magic-state injection/cultivation,
  switching, measurement-based resources, or another certified mechanism.

The packed value \(k=12\) makes addressability especially important. A
collective operation on all twelve logical qubits is not a substitute for a
compiler that selects the desired logical combination while preserving the
others.

## 7. What the card promises

Each operation row names its applicability in the gate or cost:

| row | promise | excluded inference |
|---|---|---|
| identical-block CNOT | aligned pairwise CNOT preserves two BB blocks | zero routing or decoder cost |
| selected fold Cliffords | cited symmetric instances have a fold certificate | every BB instance has H/S |
| automorphism Cliffords | a resolved logical action can implement Cliffords | every graph symmetry is useful |
| modular surgery | cited architecture provides joint operations | surgery is native to the static matrix |
| self-dual H/S/CNOT | extra self-dual subfamily has transversal Cliffords | gross inherits those gates |

This separation lets later work add a gross-specific logical-action
certificate without rewriting family-wide folklore as fact.
