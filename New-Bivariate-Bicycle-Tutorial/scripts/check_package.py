#!/usr/bin/env python3
"""Validate the standalone tutorial without QEC Atlas dependencies."""

from __future__ import annotations

import html
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


PACKAGE = Path(__file__).resolve().parent.parent
PUBLIC = (PACKAGE / "public").resolve()
ENTRY_ID = "bivariate_bicycle"


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: set[str] = set()
        self.references: list[tuple[str, str, str]] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"])
        for attribute in ("href", "src"):
            value = values.get(attribute)
            if value:
                self.references.append((tag, attribute, html.unescape(value)))


def parse_page(path: Path) -> PageParser:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def resolve_reference(source: Path, value: str):
    parts = urlsplit(value)
    if parts.scheme in {"http", "https", "mailto", "data"} or parts.netloc:
        return None
    if parts.scheme:
        raise ValueError(f"unsafe or unsupported URL scheme: {value}")

    raw_path = unquote(parts.path)
    if not raw_path:
        target = source
    elif raw_path.startswith("/"):
        target = PUBLIC / raw_path.lstrip("/")
    else:
        target = source.parent / raw_path
    target = target.resolve()
    try:
        target.relative_to(PUBLIC)
    except ValueError as error:
        raise ValueError(f"reference escapes public/: {value}") from error
    if raw_path.endswith("/") or target.is_dir():
        target = target / "index.html"
    return target, unquote(parts.fragment)


def require_scope() -> list[str]:
    errors: list[str] = []
    required = [
        PUBLIC / "index.html",
        PUBLIC / "wanted.html",
        PUBLIC / "entries" / f"{ENTRY_ID}.html",
        PUBLIC / "entries" / ENTRY_ID / "intuition.html",
        PUBLIC / "entries" / ENTRY_ID / "parameters.html",
        PUBLIC / "entries" / ENTRY_ID / "formal-verification.html",
        PUBLIC / "entries" / ENTRY_ID / "decoders.html",
        PUBLIC / "entries" / ENTRY_ID / "operations.html",
        PUBLIC / "entries" / ENTRY_ID / "realizations.html",
        PUBLIC / "entries" / ENTRY_ID / "relations.html",
        PUBLIC / "entries" / ENTRY_ID / "references.html",
        PUBLIC / "entries" / ENTRY_ID / "pedagogy.html",
        PUBLIC / "tours" / f"{ENTRY_ID}.html",
        PUBLIC / "widgets" / "scene-explorer.js",
        PUBLIC / "widgets" / "learn-continuity.js",
        PUBLIC / "widgets" / "learn-player.js",
    ]
    for path in required:
        if not path.is_file():
            errors.append(f"missing required file: {path.relative_to(PACKAGE)}")

    entries = PUBLIC / "entries"
    unexpected_entry_files = sorted(
        path for path in entries.glob("*.html") if path.name != f"{ENTRY_ID}.html"
    )
    unexpected_entry_dirs = sorted(
        path for path in entries.iterdir() if path.is_dir() and path.name != ENTRY_ID
    )
    tours = PUBLIC / "tours"
    unexpected_tours = sorted(
        path for path in tours.glob("*.html") if path.name != f"{ENTRY_ID}.html"
    )
    for path in unexpected_entry_files + unexpected_entry_dirs + unexpected_tours:
        errors.append(f"out-of-scope Atlas content: {path.relative_to(PACKAGE)}")

    if any(path.is_symlink() for path in PUBLIC.rglob("*")):
        errors.append("public/ must not contain symbolic links")

    player = PUBLIC / "widgets" / "learn-player.js"
    if player.is_file() and ENTRY_ID in player.read_text(encoding="utf-8"):
        errors.append("generic learn-player.js contains an entry-specific identifier")
    return errors


def check_links() -> tuple[list[str], int]:
    errors: list[str] = []
    page_cache: dict[Path, PageParser] = {}
    internal_count = 0
    for source in sorted(PUBLIC.rglob("*.html")):
        parser = page_cache.setdefault(source, parse_page(source))
        for _tag, _attribute, value in parser.references:
            try:
                resolved = resolve_reference(source, value)
            except ValueError as error:
                errors.append(f"{source.relative_to(PUBLIC)}: {error}")
                continue
            if resolved is None:
                continue
            internal_count += 1
            target, fragment = resolved
            if not target.is_file():
                errors.append(
                    f"{source.relative_to(PUBLIC)}: missing target {value!r}"
                )
                continue
            if fragment and target.suffix.lower() == ".html":
                target_parser = page_cache.setdefault(target, parse_page(target))
                if fragment not in target_parser.ids:
                    errors.append(
                        f"{source.relative_to(PUBLIC)}: missing fragment "
                        f"{target.relative_to(PUBLIC)}#{fragment}"
                    )
    return errors, internal_count


def main() -> int:
    errors = require_scope()
    link_errors, internal_count = check_links()
    errors.extend(link_errors)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    html_pages = sum(1 for _ in PUBLIC.rglob("*.html"))
    total_bytes = sum(path.stat().st_size for path in PUBLIC.rglob("*") if path.is_file())
    print(
        f"standalone-package: OK ({html_pages} HTML pages, "
        f"{internal_count} internal references, {total_bytes} bytes)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
