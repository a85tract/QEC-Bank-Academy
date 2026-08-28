"""Recompute every machine-derived statement in the BB pedagogy pages."""

from __future__ import annotations

from pathlib import Path
import sys

import numpy as np

# Direct script execution starts in pedagogy/. Locate the repository explicitly.
for parent in Path(__file__).resolve().parents:
    if (parent / "qeclib").is_dir():
        sys.path.insert(0, str(parent))
        break

from qeclib import gf2
from qeclib.distance import exact_distance, random_upper_bound
from qeclib.entry import load_entry
from qeclib.verify import construction_replay_evidence, verify_entry


ENTRY_DIR = Path(__file__).resolve().parents[1]
GROSS_PARAMS = {
    "l": 12,
    "m": 6,
    "a_terms": ((3, 0), (0, 1), (0, 2)),
    "b_terms": ((0, 3), (1, 0), (2, 0)),
}
TORIC_PARAMS = {
    "l": 3,
    "m": 3,
    "a_terms": ((0, 0), (1, 0)),
    "b_terms": ((0, 0), (0, 1)),
}


def cyclic_shift(order: int) -> np.ndarray:
    """Independent statement of the constructor's forward-shift convention."""
    matrix = np.zeros((order, order), dtype=np.uint8)
    for index in range(order):
        matrix[index, (index + 1) % order] = 1
    return matrix


def block_diagonal_twice(matrix: np.ndarray) -> np.ndarray:
    """Apply the same torus translation to both BB qubit blocks."""
    size = matrix.shape[0]
    result = np.zeros((2 * size, 2 * size), dtype=np.uint8)
    result[:size, :size] = matrix
    result[size:, size:] = matrix
    return result


def main() -> None:
    entry = load_entry(ENTRY_DIR)
    failures = verify_entry(entry)
    assert not failures, "\n".join(failures)

    gross = entry.build(**GROSS_PARAMS)
    checkmatrix = gross["checkmatrix"]
    hx, hz = checkmatrix.to_css()
    torus_size = GROSS_PARAMS["l"] * GROSS_PARAMS["m"]
    a_matrix = hx[:, :torus_size]
    b_matrix = hx[:, torus_size:]

    # Independent cyclic-shift reconstruction of both gross polynomials.
    x_shift = np.kron(
        cyclic_shift(GROSS_PARAMS["l"]),
        np.eye(GROSS_PARAMS["m"], dtype=np.uint8),
    )
    y_shift = np.kron(
        np.eye(GROSS_PARAMS["l"], dtype=np.uint8),
        cyclic_shift(GROSS_PARAMS["m"]),
    )
    identity = np.eye(torus_size, dtype=np.uint8)
    assert np.array_equal(np.linalg.matrix_power(x_shift, 12), identity)
    assert np.array_equal(np.linalg.matrix_power(y_shift, 6), identity)
    assert np.array_equal((x_shift @ y_shift) % 2, (y_shift @ x_shift) % 2)

    expected_a = (
        np.linalg.matrix_power(x_shift, 3)
        ^ y_shift
        ^ np.linalg.matrix_power(y_shift, 2)
    )
    expected_b = (
        np.linalg.matrix_power(y_shift, 3)
        ^ x_shift
        ^ np.linalg.matrix_power(x_shift, 2)
    )
    assert np.array_equal(a_matrix, expected_a)
    assert np.array_equal(b_matrix, expected_b)
    assert np.array_equal(hz, np.hstack([b_matrix.T, a_matrix.T]))

    # Exact CSS dimensions, sparsity, and commutation.
    assert hx.shape == hz.shape == (72, 144)
    assert not np.any((hx @ hz.T) % 2)
    assert gf2.rank(hx) == gf2.rank(hz) == 66
    assert gf2.rank(checkmatrix.stab) == 132
    assert checkmatrix.n == 144
    assert checkmatrix.k == 12
    assert checkmatrix.is_css()
    assert torus_size - gf2.rank(hx) == 6
    assert set(int(weight) for weight in a_matrix.sum(axis=1)) == {3}
    assert set(int(weight) for weight in a_matrix.sum(axis=0)) == {3}
    assert set(int(weight) for weight in b_matrix.sum(axis=1)) == {3}
    assert set(int(weight) for weight in b_matrix.sum(axis=0)) == {3}
    assert set(int(weight) for weight in hx.sum(axis=1)) == {6}
    assert set(int(weight) for weight in hz.sum(axis=1)) == {6}
    assert set(int(weight) for weight in hx.sum(axis=0)) == {3}
    assert set(int(weight) for weight in hz.sum(axis=0)) == {3}

    # Convention anchors quoted in the tour and algebra page.
    assert np.flatnonzero(hx[0]).tolist() == [1, 2, 18, 75, 78, 84]
    assert np.flatnonzero(hz[0]).tolist() == [3, 60, 66, 76, 77, 126]

    # Translation of both data blocks only permutes check rows.
    for translation in (x_shift, y_shift):
        physical = block_diagonal_twice(translation)
        assert np.array_equal((hx @ physical) % 2, (translation @ hx) % 2)
        assert np.array_equal((hz @ physical) % 2, (translation @ hz) % 2)

    # The exported geometry is exactly the constructor's check incidence.
    lattice = gross["lattice"]
    assert len(lattice["coords"]) == 144
    assert len(lattice["checks"]) == 144
    expected_checks = [
        {"type": "X", "support": [int(qubit) for qubit in row.nonzero()[0]]}
        for row in hx
    ]
    expected_checks += [
        {"type": "Z", "support": [int(qubit) for qubit in row.nonzero()[0]]}
        for row in hz
    ]
    assert lattice["checks"] == expected_checks
    assert lattice["initialState"] == {"filter": "all", "highlight": 0}
    assert lattice["focusByFilter"] == {"all": 0, "X": 0, "Z": hx.shape[0]}
    assert lattice["dimAlpha"] == 0.02

    # Literature lower bound plus a deterministic machine upper witness.
    upper = random_upper_bound(checkmatrix, iters=2000, seed=5)
    assert upper == {
        "value": 12,
        "method": "rand-lowweight-v1",
        "iters": 2000,
        "seed": 5,
    }

    # Small exact anchor: A=1+x, B=1+y is the L=3 toric presentation.
    toric = entry.build(**TORIC_PARAMS)
    toric_checkmatrix = toric["checkmatrix"]
    toric_hx, toric_hz = toric_checkmatrix.to_css()
    assert toric_hx.shape == toric_hz.shape == (9, 18)
    assert gf2.rank(toric_hx) == gf2.rank(toric_hz) == 8
    assert toric_checkmatrix.n == 18
    assert toric_checkmatrix.k == 2
    assert exact_distance(toric_checkmatrix) == (3, "exact-css-enum")

    # Structured entry boundary and exact bivariate-polynomial replay.
    replay = construction_replay_evidence(entry)
    assert replay["operation"] == {"id": "bivariate_bicycle", "version": 1}
    assert replay["matcher"] == "exact-checkmatrix-v1"
    assert [row["label"] for row in replay["instances"]] == [
        "gross",
        "toric_L3",
    ]
    assert entry.card["tier"] == "T3"
    assert [instance["label"] for instance in entry.instances] == [
        "gross",
        "toric_L3",
    ]
    gross_distance = entry.instances[0]["claims"][2]
    assert gross_distance["origin"] == {
        "kind": "bounded",
        "ref": "bravyi2024bicycle",
    }
    assert gross_distance["upper"] == {
        "value": 12,
        "method": "rand-lowweight-v1",
        "seed": 5,
        "iters": 2000,
    }

    print(
        "bivariate-bicycle pedagogy reproduction: OK "
        "(gross ranks/sparsity/bounded d, translations, toric [[18,2,3]])"
    )


if __name__ == "__main__":
    main()
