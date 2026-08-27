#!/usr/bin/env python3
"""Serve the package root using only the Python standard library."""

from __future__ import annotations

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bind", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8879)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    server = ThreadingHTTPServer((args.bind, args.port), handler)
    print(f"Surface tutorial: http://{args.bind}:{args.port}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
