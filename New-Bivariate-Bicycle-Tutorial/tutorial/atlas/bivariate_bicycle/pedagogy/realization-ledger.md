# Realization ledger

This ledger distinguishes a literal BB hardware run from simulated layouts and
full-stack architecture proposals. “Realization” answers what physical system
actually executed; “proposal” answers whether the design is concrete enough
to simulate or cost.

## Capability table

| source | platform / block | status | established | did not establish |
|---|---|---|---|---|
| `wang2026lowoverhead` | Kunlun, `[[18,4,4]]`, 32 long-range-coupled transmons | demonstrated | all nonlocal weight-six checks and repeated syndrome cycles; reported logical error per logical qubit per cycle \(8.91\%\pm0.17\%\) | gross `[[144,12,12]]`, increasing-distance suppression, below-threshold scaling, or a fault-tolerant logical gate |
| `poole2025rydberg` | optimized Rydberg neutral-atom layout | proposed | gate/layout optimization for BB connectivity | laboratory logical memory |
| `berthusen2025local` | layered/local two-dimensional implementation | proposed | quantified motion/communication and altered check cadence | unchanged detector model or free localization |
| `shaw2025morphing` | degree-five morphing family | proposed | six CNOT rounds, lower connectivity, surface-code input/output route | a universal reschedule of every BB block |
| `wang2026coprime` | coprime subclass on cold atoms | proposed | rate-aware subclass and atom-movement co-design | hardware experiment |
| `yoder2025tour` | modular gross-family computer | proposed | instruction set, compiler, and end-to-end resource estimates | executed module or logical gate |
| `chen2025fusion` | emitter-generated photonic fusion resources | proposed | mapping of CSS qLDPC checks and small-BB loss/noise studies | photonic BB experiment |
| `chandra2026distributed` | networked gross block over several processors | proposed | Bell-link partition and simulated BP-OSD sensitivity to nonlocal noise | distributed hardware run |

## The Kunlun result

The fetched six-lens sweep identifies `wang2026lowoverhead` as the only literal
BB experiment as of 2026-07-26. Its block and hardware count must remain
attached to the result:

- code: `[[18,4,4]]`, not gross;
- device: 32 transmons with long-range couplings;
- operation: all nonlocal weight-six checks and repeated syndrome extraction;
- reported metric: logical error per logical qubit per cycle
  \(8.91\%\pm0.17\%\);
- interpretation: feasibility of a low-overhead, nonlocal-check experiment.

The run does not provide a family crossing. A below-threshold scaling
demonstration would require at least two or more distances under comparable
circuits, noise, and decoding, with logical error decreasing as distance
grows. One fixed `[[18,4,4]]` point cannot supply that inference.

The 32-device count also must not be compared directly with the gross
data-only \(n=144\). The former is a device implementation including its
chosen ancilla resources; the latter is a static data-qubit parameter.

## Why the proposals differ

The proposals attack different bottlenecks:

- **Rydberg layout:** exploit reconfigurable or long-range atom interactions
  to realize the Tanner graph quickly.
- **Layered locality:** pay motion, communication, or slower measurement of
  costly checks to fit a local substrate.
- **Morphing:** change the code during extraction so the instantaneous graph
  has lower degree.
- **Coprime subclass:** constrain the polynomial search so rate and cold-atom
  layout are co-designed.
- **Modular architecture:** turn blocks into an instruction set with ancillas,
  communication, compilation, and resource accounting.
- **Photonic fusion:** translate parity checks into emitter-generated resource
  states and a loss-aware fusion network.
- **Distributed modules:** split one gross block and expose the logical
  penalty from noisy nonlocal Bell links.

These are not interchangeable implementations of an identical detector
model. Movement can add idle faults; morphing changes which stabilizer code is
active; a photonic loss channel differs from a transmon depolarizing model; a
networked partition introduces link noise. Each needs its own circuit and
decoder claim.

## Negative results from the sweep

As of the sweep date, no fetched experiment had:

- run the `[[144,12,12]]` gross memory;
- demonstrated increasing-distance logical suppression within a BB family;
- implemented a fault-tolerant BB logical gate;
- validated the full `yoder2025tour` modular instruction set in hardware.

These absences are part of the entry's knowledge state. They prevent a
proposal from being rendered as a demonstration and identify concrete targets
for future updates.

## Update rule

A future realization row should state:

1. the exact BB instance and whether it is ordinary, self-dual, coprime,
   pruned, or morphing;
2. data, ancilla, communication, and total device counts separately;
3. extraction schedule and number of repeated rounds;
4. decoder and noise/normalization convention;
5. whether the result is detection, correction, scaling, state preparation,
   or a logical operation.

Without those five fields, “BB demonstrated” is too coarse to compare.
