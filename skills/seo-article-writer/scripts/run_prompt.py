#!/usr/bin/env python3
"""Run a phase prompt with local material files through the configured provider."""

from __future__ import annotations

import argparse
import traceback
import sys
from pathlib import Path

from model_provider import chat


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a SEO article phase prompt.")
    parser.add_argument("--prompt", type=Path, required=True, help="Prompt markdown file.")
    parser.add_argument("--input", action="append", type=Path, default=[], help="Input material file. Repeatable.")
    parser.add_argument("--output", type=Path, required=True, help="Output markdown path.")
    parser.add_argument("--temperature", type=float, default=float(__import__("os").environ.get("TEMPERATURE", "0.2")))
    args = parser.parse_args()

    prompt = read(args.prompt)
    material_blocks = []
    for path in args.input:
        material_blocks.append(f"# Input: {path}\n\n{read(path)}")

    user_content = prompt + "\n\n" + "\n\n".join(material_blocks)
    try:
        result = chat(
            [
                {
                    "role": "system",
                    "content": "Follow the SEO Article Writer skill exactly. Obey phase gates and writing guidelines.",
                },
                {"role": "user", "content": user_content},
            ],
            temperature=args.temperature,
        )
    except Exception as exc:
        if __import__("os").environ.get("DEBUG_MODEL_TRACEBACK") == "1":
            traceback.print_exc(file=sys.stderr)
        else:
            print(str(exc), file=sys.stderr)
        return 1
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(result, encoding="utf-8")
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
