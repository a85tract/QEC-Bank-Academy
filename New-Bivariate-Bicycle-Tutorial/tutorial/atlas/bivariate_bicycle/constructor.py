"""Executable bivariate-bicycle CSS codes in a fixed torus convention."""

from __future__ import annotations

import numpy as np

from qeclib.checkmatrix import CheckMatrix


GROSS_A_TERMS = ((3, 0), (0, 1), (0, 2))
GROSS_B_TERMS = ((0, 3), (1, 0), (2, 0))


def _shift(order: int) -> np.ndarray:
    """Return the forward cyclic permutation used for one polynomial variable."""
    if not isinstance(order, int) or order < 1:
        raise ValueError("cyclic orders l and m must be positive integers")
    shift = np.zeros((order, order), dtype=np.uint8)
    for index in range(order):
        shift[index, (index + 1) % order] = 1
    return shift


def _normalise_terms(l: int, m: int, terms) -> tuple[tuple[int, int], ...]:
    """Validate exponent pairs and reduce them in Z_l x Z_m."""
    normalised = []
    for term in terms:
        if (
            not isinstance(term, (list, tuple))
            or len(term) != 2
            or not all(isinstance(exponent, int) for exponent in term)
        ):
            raise ValueError("polynomial terms must be integer exponent pairs")
        normalised.append((term[0] % l, term[1] % m))
    return tuple(normalised)


def _poly(l: int, m: int, terms) -> np.ndarray:
    """Represent a Laurent polynomial on Z_l x Z_m over GF(2)."""
    x_shift = np.kron(_shift(l), np.eye(m, dtype=np.uint8))
    y_shift = np.kron(np.eye(l, dtype=np.uint8), _shift(m))
    matrix = np.zeros((l * m, l * m), dtype=np.uint8)
    for x_power, y_power in _normalise_terms(l, m, terms):
        monomial = (
            np.linalg.matrix_power(x_shift, x_power)
            @ np.linalg.matrix_power(y_shift, y_power)
        ) % 2
        matrix ^= monomial.astype(np.uint8)
    return matrix


def _lattice(l: int, m: int, hx: np.ndarray, hz: np.ndarray) -> dict:
    """Export two interleaved torus layers and exact stabilizer incidences."""
    coords = []
    for layer in range(2):
        offset = 0.55 * layer
        for x_coord in range(l):
            for y_coord in range(m):
                coords.append([2 * x_coord + offset, 2 * y_coord + offset])
    checks = [
        {"type": "X", "support": [int(qubit) for qubit in row.nonzero()[0]]}
        for row in hx
    ]
    checks += [
        {"type": "Z", "support": [int(qubit) for qubit in row.nonzero()[0]]}
        for row in hz
    ]
    check_anchors = []
    for family_offset in (0.15, 0.4):
        for x_coord in range(l):
            for y_coord in range(m):
                check_anchors.append([
                    2 * x_coord + family_offset,
                    2 * y_coord + family_offset,
                ])
    return {
        "coords": coords,
        "checks": checks,
        "layout": {
            "kind": "periodic",
            "origin": [-float(l), -float(m)],
            "basis": [[float(2 * l), 0.0], [0.0, float(2 * m)]],
            "checkAnchors": check_anchors,
            "checkStyles": {"X": "spokes", "Z": "spokes"},
        },
        "initialState": {"filter": "all", "highlight": 0},
        "focusByFilter": {"all": 0, "X": 0, "Z": int(hx.shape[0])},
        "dimAlpha": 0.02,
    }


def build(
    l: int = 12,
    m: int = 6,
    a_terms=GROSS_A_TERMS,
    b_terms=GROSS_B_TERMS,
) -> dict:
    """Build H_X=[A|B], H_Z=[B^T|A^T]; defaults give the gross code."""
    if not isinstance(l, int) or not isinstance(m, int) or l < 1 or m < 1:
        raise ValueError("cyclic orders l and m must be positive integers")
    a_matrix = _poly(l, m, a_terms)
    b_matrix = _poly(l, m, b_terms)
    hx = np.hstack([a_matrix, b_matrix]) % 2
    hz = np.hstack([b_matrix.T, a_matrix.T]) % 2
    checkmatrix = CheckMatrix.from_css(hx, hz)
    checkmatrix.validate()
    return {
        "checkmatrix": checkmatrix,
        "lattice": _lattice(l, m, hx, hz),
    }
