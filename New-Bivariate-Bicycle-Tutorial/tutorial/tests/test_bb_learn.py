import json
from pathlib import Path

import pytest
import yaml

from qeclib.entry import EntryCatalog
from tests.test_widget_data import run_widget_scenario
from tools.site.build import DIRS, _load_tour, _tour_payload


ROOT = Path(__file__).resolve().parent.parent
LEARN_JS = ROOT / "tools" / "site" / "widgets" / "learn-player.js"
SCENE_JS = ROOT / "tools" / "site" / "widgets" / "scene-explorer.js"
TOUR_YAML = ROOT / "atlas" / "bivariate_bicycle" / "pedagogy" / "tour.yaml"


@pytest.fixture(scope="module")
def bb_learn_payload():
    catalog = EntryCatalog.from_roots(DIRS)
    tour = _load_tour("bivariate_bicycle", catalog=catalog)
    return _tour_payload(tour, {"bivariate_bicycle": {}}, catalog=catalog)


def test_bb_learn_contract_covers_the_approved_causal_spine():
    tour = yaml.safe_load(TOUR_YAML.read_text())

    assert tour["version"] == 2
    assert [chapter["id"] for chapter in tour["chapters"]] == [
        "translate",
        "assemble",
        "detect",
        "quotient",
        "qualify",
    ]
    assert len(tour["steps"]) == 14
    assert {step["interaction"]["kind"] for step in tour["steps"]} == {
        "audit",
        "commutation",
        "rank",
        "representation",
        "syndrome",
        "translation",
    }
    assert all(step.get("task") and step.get("origin") for step in tour["steps"])
    assert tour["lattices"]["toric"]["derive_logicals"] is True
    assert tour["lattices"]["gross"].get("derive_logicals") is not True


def test_bb_learn_review_regressions_keep_feedback_and_evidence_actionable():
    tour = yaml.safe_load(TOUR_YAML.read_text())
    steps = {step["id"]: step for step in tour["steps"]}
    audit_questions = []
    for step in tour["steps"]:
        interaction = step["interaction"]
        audit_questions.extend(interaction.get("questions", []))
        if interaction.get("question"):
            audit_questions.append(interaction["question"])

    assert all(question.get("explanation") for question in audit_questions)
    assert "Change the anchor" in steps["assemble-a-check"]["task"]
    assert "predict the row weight" in steps["assemble-a-check"]["task"]
    assert "cocycle" in steps["classify-a-logical-cycle"]["narrative"]
    assert "coboundary" in steps["classify-a-logical-cycle"]["narrative"]
    assert steps["audit-operation-realization"]["origin"]["refs"] == [
        "sayginel2025automorphisms",
        "wang2026lowoverhead",
    ]
    assert len(steps["reference-capstone"]["interaction"]["questions"]) == 5
    assert any(
        link["href"].endswith("syndrome-circuits-and-decoding.html")
        for link in steps["reference-capstone"]["reference_links"]
    )

    player = LEARN_JS.read_text()
    assert "metadata: {...controls.dataset}" in player
    assert "controls.dataset.baselineSyndrome" in player
    assert 'remote.completed.forEach' in player
    assert 'completed.size === tour.steps.length' in player
    assert "ker(∂₂ᵀ) contains cocycles" in player
    assert "im(∂₁ᵀ) contains coboundaries" in player


def test_bb_learn_payload_derives_formal_feedback_without_hand_authored_answers(
    bb_learn_payload,
):
    toric = bb_learn_payload["lattices"]["toric"]["formal"]
    gross = bb_learn_payload["lattices"]["gross"]["formal"]

    assert (toric["n"], toric["k"], toric["ranks"]) == (
        18,
        2,
        {"X": 8, "Z": 8},
    )
    assert len(toric["logicalPairs"]) == 2
    assert (gross["n"], gross["k"], gross["ranks"]) == (
        144,
        12,
        {"X": 66, "Z": 66},
    )
    assert gross["logicalPairs"] == []
    for formal in (toric, gross):
        assert formal["twoBlockCandidates"]["swappedZChecks"] == formal["zChecks"]
        assert len(formal["twoBlockCandidates"]["unswappedZChecks"]) == len(
            formal["xChecks"]
        )


def test_bb_learn_widget_recomputes_translation_commutation_and_error_classes(
    bb_learn_payload,
):
    formal = bb_learn_payload["lattices"]["toric"]["formal"]
    result = run_widget_scenario(
        LEARN_JS,
        scenario=f"""
const formal = {json.dumps(formal)};
const logicalSupport = formal.logicalPairs[0].x.xSupport.length
  ? formal.logicalPairs[0].x.xSupport
  : formal.logicalPairs[0].x.zSupport;
emit({{
  wrapped: AtlasLearnPlayer.translationDestination([2, 2], [1, 0], 3, 3),
  reversed: AtlasLearnPlayer.translationDestination([0, 0], [1, 0], 3, 3, true),
  swappedViolations: AtlasLearnPlayer.commutationViolations(
    formal.xChecks,
    formal.twoBlockCandidates.swappedZChecks
  ).count,
  unswappedViolations: AtlasLearnPlayer.commutationViolations(
    formal.xChecks,
    formal.twoBlockCandidates.unswappedZChecks
  ).count,
  single: AtlasLearnPlayer.classifyError("X", [0], formal).kind,
  stabilizer: AtlasLearnPlayer.classifyError("X", formal.xChecks[0], formal).kind,
  logical: AtlasLearnPlayer.classifyError("X", logicalSupport, formal),
}});
""",
    )

    assert result["wrapped"] == [0, 2]
    assert result["reversed"] == [2, 0]
    assert result["swappedViolations"] == 0
    assert result["unswappedViolations"] == 18
    assert result["single"] == "detectable"
    assert result["stabilizer"] == "stabilizer"
    assert result["logical"]["kind"] == "logical"
    assert result["logical"]["logical"] == ["X̅1"]


def test_scene_widget_uses_non_color_pauli_encoding():
    result = run_widget_scenario(
        SCENE_JS,
        scenario=r"""
const canvas = new FakeCanvas(760, 560, {left: 0, top: 0, width: 760, height: 560});
const scene = {
  schema: "qec-atlas-scene-v2",
  dimension: 2,
  origin: {kind: "verified", method: "fixture"},
  coordinateSystem: {kind: "cartesian", origin: [0, 0]},
  camera: {fit: "contain", padding: 0.08, minZoom: 0.5, maxZoom: 8},
  layers: [{id: "checks", label: "Checks", kind: "checks", defaultVisible: true}],
  nodes: [],
  frames: [{
    id: "lattice",
    mode: "lattice",
    objects: [
      {id: "x", kind: "segment", points: [[0, 0], [1, 0]], style: "X", layer: "checks", item: 0},
      {id: "z", kind: "segment", points: [[0, 1], [1, 1]], style: "Z", layer: "checks", item: 1},
    ],
  }],
};
SceneExplorer.render(canvas, scene, {mode: "lattice", filter: "all"});
emit(canvas.context.strokes.map(stroke => ({color: stroke.strokeStyle, dash: stroke.lineDash})));
""",
    )

    assert result == [
        {"color": "#c73737", "dash": []},
        {"color": "#2563a8", "dash": [14, 10]},
    ]


def test_bb_learn_site_projection_and_reference_continuity(repository_site_path):
    site = repository_site_path
    landing = (site / "entries" / "bivariate_bicycle.html").read_text()
    learn = (site / "tours" / "bivariate_bicycle.html").read_text()
    parameters = (
        site / "entries" / "bivariate_bicycle" / "parameters.html"
    ).read_text()
    formal = (
        site / "entries" / "bivariate_bicycle" / "formal-verification.html"
    ).read_text()
    relations = (
        site / "entries" / "bivariate_bicycle" / "relations.html"
    ).read_text()
    wanted = (site / "wanted.html").read_text()
    surface_tour = (site / "tours" / "surface.html").read_text()

    assert "Make one check move before reading the dossier" in landing
    assert "Visual instance: toric_L3" in landing
    assert "data-learn-start" in landing and "data-learn-resume" in landing
    assert "learn-continuity.js" in landing
    assert learn.count("data-learn-step=") == 14
    assert learn.count("class='learn-route-anchor'") == 14
    assert "Prediction lab" in learn
    assert "learn-player.js" in learn and "learn-continuity.js" in learn
    assert "tour-player.js" not in learn
    assert "data-learn-return" in parameters and "learn-continuity.js" in parameters
    assert "Structural validity" in formal
    assert "No exact-distance certificate is present in this row." in formal
    assert "Small exact-distance enumeration" in formal
    assert "Exact static distance is certified for this row." in formal
    assert "Full certificate ID" in formal
    assert "../../wanted.html#pending-relation-two-bga" in relations
    assert "id='pending-relation-two-bga'" in wanted
    assert "learn-player.js" not in surface_tour
    assert "learn-continuity.js" not in surface_tour
    assert not (
        site
        / "entries"
        / "bivariate_bicycle"
        / "pedagogy"
        / "lesson-brief.html"
    ).exists()
    assert "bivariate_bicycle" not in LEARN_JS.read_text()
    assert 'grid-template-areas: "panel" "stage" "map"' in (
        ROOT / "tools" / "site" / "tour.css"
    ).read_text()
