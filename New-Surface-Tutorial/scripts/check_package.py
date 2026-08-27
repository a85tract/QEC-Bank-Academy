#!/usr/bin/env python3
"""Validate the standalone Surface package without third-party dependencies."""

from __future__ import annotations

import argparse
import hashlib
import json
import posixpath
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.anchors: set[str] = set()
        self.references: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        for key in ("id", "name"):
            if values.get(key):
                self.anchors.add(values[key] or "")
        for key in ("href", "src"):
            if values.get(key):
                self.references.append((key, values[key] or ""))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def resolve(document: str, value: str) -> tuple[str, str] | None:
    parts = urlsplit(value)
    if parts.scheme or parts.netloc or value.startswith("//"):
        return None
    if parts.path.startswith("/"):
        raise AssertionError(f"{document}: root-absolute URL is not GitHub Pages portable: {value}")
    if not parts.path:
        target = document
    else:
        target = posixpath.normpath(
            posixpath.join(posixpath.dirname(document), unquote(parts.path))
        )
    return target, unquote(parts.fragment)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    manifest = json.loads((root / "package-manifest.json").read_text(encoding="utf-8"))
    assert manifest["schema"] == "qec-atlas-surface-tutorial-package-v1"
    assert manifest["entry"] == "surface"

    for relative, record in manifest["files"].items():
        path = root / relative
        assert path.is_file(), f"manifest file missing: {relative}"
        assert path.stat().st_size == record["bytes"], f"size drift: {relative}"
        assert digest(path) == record["sha256"], f"digest drift: {relative}"

    other_entries = [
        path.relative_to(root).as_posix()
        for path in (root / "entries").rglob("*.html")
        if path != root / "entries" / "surface.html"
        and not path.is_relative_to(root / "entries" / "surface")
    ]
    assert not other_entries, f"other Atlas entries leaked into package: {other_entries}"
    assert not (root / "exports" / "site").exists(), "full exports/site must not be bundled"
    assert not list(root.rglob("__pycache__")), "Python cache directories must not be bundled"
    assert not list(root.rglob("*.pyc")), "compiled Python files must not be bundled"
    assert not (root / "entries" / "surface" / "pedagogy" / "lesson-brief.html").exists()
    assert not (root / "entries" / "surface" / "pedagogy" / "lesson-evidence-notes.html").exists()

    html_files = sorted(root.rglob("*.html"))
    parsed = {}
    for path in html_files:
        page = PageParser()
        page.feed(path.read_text(encoding="utf-8"))
        parsed[path.relative_to(root).as_posix()] = page
    for document, page in parsed.items():
        for attribute, value in page.references:
            target = resolve(document, value)
            if target is None or value.startswith("#") and not value[1:]:
                continue
            target_path, fragment = target
            path = root / target_path
            assert path.is_file(), f"{document}: broken {attribute}={value!r}"
            if fragment and path.suffix == ".html":
                assert fragment in parsed[target_path].anchors, (
                    f"{document}: missing fragment {fragment!r} in {target_path}"
                )

    landing = (root / "entries" / "surface.html").read_text(encoding="utf-8")
    learn = (root / "learn" / "surface.html").read_text(encoding="utf-8")
    tour = (root / "tours" / "surface.html").read_text(encoding="utf-8")
    assert "A Surface code stores one qubit nonlocally" in landing
    assert "const LESSON_DATA=" in learn and '"chapters": [' in learn
    assert "Check factor translation" not in learn, "runtime UI must remain generic JavaScript"
    assert "learn-player.js" in learn and "scene-explorer.js" in learn
    assert "Surface code: see the hypergraph product" in tour
    assert (root / "authoring" / "lesson.yaml").is_file()
    assert (root / "patches" / "qec-atlas-surface-tutorial.diff").is_file()
    print(
        f"package: OK ({len(html_files)} HTML pages, "
        f"{len(manifest['files'])} manifested files, zero broken local links)"
    )


if __name__ == "__main__":
    main()
