#!/usr/bin/env python3
"""Extract one GitHub-Pages-ready Surface tutorial from a full Atlas site build."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import posixpath
import re
import shutil
from datetime import date
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit


PACKAGE_SCHEMA = "qec-atlas-surface-tutorial-package-v1"
ATTRIBUTE = re.compile(
    r"(?P<prefix>\b(?:href|src)\s*=\s*)(?P<quote>['\"])(?P<value>.*?)(?P=quote)",
    re.IGNORECASE,
)
AUTHORING_FILES = (
    "circuit-artifact.md",
    "lesson-brief.md",
    "lesson-evidence-notes.md",
    "lesson.yaml",
)
RUNTIME_FILES = (
    "style.css",
    "learn.css",
    "tour.css",
    "learn/surface.html",
    "tours/surface.html",
    "entries/surface.html",
    "widgets/learn-entry.js",
    "widgets/learn-player.js",
    "widgets/scene-explorer.js",
    "widgets/tour-player.js",
    "renderer/mathjax-config.js",
    "wanted.html",
)
HIDDEN_GENERATED_NOTES = {
    "entries/surface/pedagogy/lesson-brief.html",
    "entries/surface/pedagogy/lesson-evidence-notes.html",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def copy_relative(source: Path, destination: Path, relative: str) -> None:
    source_path = source / relative
    if not source_path.is_file():
        raise FileNotFoundError(f"required built-site file is missing: {source_path}")
    target = destination / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_path, target)


def local_target(document: str, value: str) -> tuple[str, object] | None:
    parts = urlsplit(value)
    if parts.scheme or parts.netloc or value.startswith("//") or value.startswith("#"):
        return None
    if not parts.path:
        return document, parts
    raw_path = unquote(parts.path)
    if raw_path.startswith("/"):
        target = posixpath.normpath(raw_path.lstrip("/"))
    else:
        target = posixpath.normpath(posixpath.join(posixpath.dirname(document), raw_path))
    return target, parts


def append_suffix(path: str, parts: object) -> str:
    query = f"?{parts.query}" if parts.query else ""
    fragment = f"#{parts.fragment}" if parts.fragment else ""
    return f"{path}{query}{fragment}"


def rewrite_html_links(root: Path) -> dict[str, list[str]]:
    omitted: dict[str, list[str]] = {}
    for html_path in sorted(root.rglob("*.html")):
        document = html_path.relative_to(root).as_posix()
        text = html_path.read_text(encoding="utf-8")

        def replace(match: re.Match[str]) -> str:
            value = match.group("value")
            resolved = local_target(document, value)
            if resolved is None:
                return match.group(0)
            target, parts = resolved
            target_path = root / target
            attribute = match.group("prefix").strip().lower()
            if target_path.is_file():
                if parts.path.startswith("/"):
                    portable = posixpath.relpath(target, posixpath.dirname(document) or ".")
                    value_out = append_suffix(portable, parts)
                else:
                    value_out = value
            elif attribute.startswith("src"):
                raise ValueError(f"{document}: missing runtime asset {value!r}")
            else:
                display_target = append_suffix(target, parts)
                omitted.setdefault(document, []).append(display_target)
                scope = posixpath.relpath("scope.html", posixpath.dirname(document) or ".")
                value_out = f"{scope}?target={quote(display_target, safe='')}"
            return (
                f"{match.group('prefix')}{match.group('quote')}"
                f"{value_out}{match.group('quote')}"
            )

        rewritten = ATTRIBUTE.sub(replace, text)
        html_path.write_text(rewritten, encoding="utf-8")
    return omitted


def write_shell_pages(root: Path) -> None:
    index = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0; url=entries/surface.html">
<title>Surface code tutorial</title><link rel="stylesheet" href="style.css"></head>
<body><main><h1>Surface code tutorial</h1>
<p><a href="entries/surface.html">Open the Surface landing page →</a></p></main></body></html>
"""
    scope = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Outside this standalone package</title><link rel="stylesheet" href="style.css"></head>
<body><main><p class="eyebrow">Standalone package boundary</p>
<h1>This Atlas page is not bundled</h1>
<p>This repository intentionally contains the complete Surface entry, its Learn route,
its advanced construction tour, and directly invoked shared foundations—not the other Atlas entries.</p>
<p>Requested target: <code id="requested-target">unknown</code></p>
<p><a href="entries/surface.html">Return to Surface →</a></p></main>
<script>const value=new URLSearchParams(location.search).get("target");
if(value)document.getElementById("requested-target").textContent=value;</script></body></html>
"""
    not_found = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Page not found</title><link rel="stylesheet" href="style.css"></head>
<body><main><h1>Page not found</h1>
<p>This standalone repository only publishes the Surface tutorial slice.</p>
<p><a href="entries/surface.html">Open Surface →</a></p></main></body></html>
"""
    (root / "index.html").write_text(index, encoding="utf-8")
    (root / "scope.html").write_text(scope, encoding="utf-8")
    (root / "404.html").write_text(not_found, encoding="utf-8")
    (root / ".nojekyll").write_text("\n", encoding="utf-8")


def write_manifest(
    root: Path,
    *,
    baseline: str,
    generated_on: str,
    patch_path: Path,
    omitted: dict[str, list[str]],
) -> None:
    files = {}
    for path in sorted(item for item in root.rglob("*") if item.is_file()):
        relative = path.relative_to(root).as_posix()
        if relative == "package-manifest.json":
            continue
        files[relative] = {"sha256": sha256(path), "bytes": path.stat().st_size}
    manifest = {
        "schema": PACKAGE_SCHEMA,
        "entry": "surface",
        "atlas_baseline": baseline,
        "generated_on": generated_on,
        "source_patch": {
            "path": patch_path.relative_to(root).as_posix(),
            "sha256": sha256(patch_path),
        },
        "scope": {
            "surface_entry": "complete public Surface landing and Reference subtree",
            "learn": "complete version-1 Surface Learn route",
            "advanced_tour": "Surface HGP tour",
            "shared_foundations": "all currently generated foundation pages",
            "other_entries": "omitted; local links are routed to scope.html",
        },
        "rewritten_out_of_scope_links": omitted,
        "files": files,
    }
    (root / "package-manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", required=True, type=Path, help="full exports/site directory")
    parser.add_argument("--atlas-root", required=True, type=Path)
    parser.add_argument("--patch", required=True, type=Path)
    parser.add_argument("--dest", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--generated-on", default=date.today().isoformat())
    args = parser.parse_args()

    source_site = args.site.resolve()
    atlas_root = args.atlas_root.resolve()
    destination = args.dest.resolve()
    destination.mkdir(parents=True, exist_ok=True)

    for relative in RUNTIME_FILES:
        copy_relative(source_site, destination, relative)
    for path in sorted((source_site / "entries" / "surface").rglob("*.html")):
        relative = path.relative_to(source_site).as_posix()
        if relative not in HIDDEN_GENERATED_NOTES:
            copy_relative(source_site, destination, relative)
    for path in sorted((source_site / "foundations").rglob("*.html")):
        copy_relative(source_site, destination, path.relative_to(source_site).as_posix())

    authoring_source = atlas_root / "atlas" / "surface" / "pedagogy"
    for filename in AUTHORING_FILES:
        target = destination / "authoring" / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(authoring_source / filename, target)
    patch_target = destination / "patches" / "qec-atlas-surface-tutorial.diff"
    patch_target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(args.patch.resolve(), patch_target)

    write_shell_pages(destination)
    omitted = rewrite_html_links(destination)
    write_manifest(
        destination,
        baseline=args.baseline,
        generated_on=args.generated_on,
        patch_path=patch_target,
        omitted=omitted,
    )
    print(
        f"surface package: {len(list(destination.rglob('*.html')))} HTML pages, "
        f"{len(list(destination.rglob('*')))} paths -> {destination}"
    )


if __name__ == "__main__":
    main()
