# Surface tutorial — minimal runnable site

This package contains the complete generated Surface entry from the local QEC Atlas tutorial prototype:

- Surface landing and continuous Learn route;
- all Surface Reference facets and Level-2 derivations;
- the retained advanced Surface/HGP tour;
- the exact circuit artifact used by the tutorial;
- directly linked shared foundations and the Wanted board; and
- only the CSS, JavaScript, and renderer configuration needed by those pages.

The full generated Atlas site is intentionally not included. The `hgp` and `toric` relation targets are represented by explicit package-boundary pages rather than broken links or recursively bundled entries.

## Run locally

From this directory:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open <http://127.0.0.1:8000/>.

Do not open the HTML through `file://`; serving it over HTTP preserves browser history and local tutorial state consistently.

## Publish on GitHub Pages

Commit the contents of this directory at the repository root. In GitHub, enable Pages for the branch containing these files and select `/ (root)` as the publishing folder. All package links and assets are relative, so the site works under a repository subpath.

## Scope and provenance

- Prototype source base: QEC Atlas `b8f8f180fccfe3783a76d627bda9a6d544564adf`.
- Package pages are static build output; no Python environment is required to view them.
- Mathematical typesetting uses the same external MathJax CDN as the generated Atlas site. Without network access, the site remains navigable and interactive, but TeX appears untypeset.
- Literature links remain external and require network access.
