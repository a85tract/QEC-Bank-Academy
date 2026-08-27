# Named L3 syndrome-extraction circuit artifact

This page is the Reference destination for the exact circuit used by the Learn route. It describes one frozen artifact, [`circuit_memory_l3.yaml`](../circuit_memory_l3.yaml), rather than claiming that the Surface entry has a general R3 dynamic-code representation or an R4 detector model.

## What the artifact adds

The constructor's CSS matrix says which data qubits belong to each stabilizer. A measurement circuit must add an ancilla for every check and order the data–ancilla interactions so that no physical qubit participates in two CNOTs at once. The artifact records those ancillas, their coordinates, the ordered CNOT layers, and two named fault fixtures. The site build accepts it only after the strict loader reconciles every row and support with the L3 constructor and recomputes each fixture's propagated data support.

The ancillas are measurement machinery; they are not additional data qubits in the static `[[n,k,d]]` code. Likewise, the circuit coordinates identify this artifact's qubits and checks. They do not turn the Atlas Scene drawing into a hardware coupling graph.

## CNOT direction is part of the mechanism

For an X check, prepare its ancilla in the X basis and use it as the CNOT control; the data qubit is the target. An X component on that control propagates forward to any later data target it touches.

For a Z check, use the data qubit as the CNOT control and the ancilla as the target. A Z component on that target propagates backward to any later data control it touches.

This is why the Learn route renders directed arrows rather than an undirected check–data connection. It also explains why the two loader-validated fixtures use opposite Pauli types even though both begin with one ancilla fault.

## How to audit a named hook fixture

Start at the fixture's `after-cnot-layer-*` location. Ignore every earlier layer: those gates occurred before the fault was inserted. Then scan only later layers, retain the CNOTs involving the named check ancilla, and apply the direction rule above. The accumulated data support at the end must equal the fixture's `propagated_data` field. Learn asks for that support before revealing the recomputed trace.

The row identity, local X/Z-family label, ancilla identity, insertion point, and later interactions must travel together. A label such as `Z0` is only the first Z-family row; the artifact's global matrix row and ancilla id remove any ambiguity.

## What this does not establish

The artifact verifies support reconciliation, collision-free layer ordering, and the two named propagation fixtures. It does not provide repeated-round detector events, a noise process, a decoder graph, logical observables through spacetime, or a circuit-distance calculation. Consequently it is not a threshold result and not a proof that the schedule is fully fault tolerant. Those remain honest R4 and fault-distance gaps for this entry.

Use the artifact to answer a narrow causal question—which later gates spread this named ancilla fault? For a performance or fault-tolerance claim, continue to the decoder ledger and attach the circuit, noise, measurement, decoder, and normalization regime.
