#!/usr/bin/env python3
"""Convert a simple markdown SEO article into a Google Docs-friendly docx."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from docx import Document
from docx.shared import Pt


HEADING_RE = re.compile(r"^(#{1,3})\s+(.+?)\s*$")
ORDERED_RE = re.compile(r"^\d+\.\s+(.+)")
METADATA_RE = re.compile(r"^(?:\*\*)?(SEO Title|Description|URL):(?:\*\*)?\s+(.+?)\s*$", re.IGNORECASE)


def split_table_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def is_table_divider(line: str) -> bool:
    cells = split_table_row(line)
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell or "") for cell in cells)


def add_table(document: Document, rows: list[list[str]]) -> None:
    if not rows:
        return
    table = document.add_table(rows=len(rows), cols=max(len(row) for row in rows))
    table.style = "Table Grid"
    for row_index, row in enumerate(rows):
        for col_index, value in enumerate(row):
            table.cell(row_index, col_index).text = value


def add_paragraph(document: Document, line: str) -> None:
    metadata = METADATA_RE.match(line)
    if metadata:
        paragraph = document.add_paragraph()
        label = paragraph.add_run(f"{metadata.group(1)}: ")
        label.bold = True
        paragraph.add_run(metadata.group(2).strip())
        paragraph.paragraph_format.space_after = Pt(4)
        return

    heading = HEADING_RE.match(line)
    if heading:
        level = len(heading.group(1))
        document.add_heading(heading.group(2), level=level)
        return

    if line.startswith("- ") or line.startswith("* "):
        document.add_paragraph(line[2:].strip(), style="List Bullet")
        return

    ordered = ORDERED_RE.match(line)
    if ordered:
        document.add_paragraph(ordered.group(1).strip(), style="List Number")
        return

    paragraph = document.add_paragraph(line)
    paragraph.paragraph_format.space_after = Pt(8)


def convert_markdown(markdown: str) -> Document:
    document = Document()
    styles = document.styles
    styles["Normal"].font.name = "Arial"
    styles["Normal"].font.size = Pt(11)

    table_rows: list[list[str]] = []
    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            if table_rows:
                add_table(document, table_rows)
                table_rows = []
            continue

        if "|" in line and line.strip().startswith("|") and line.strip().endswith("|"):
            if not is_table_divider(line):
                table_rows.append(split_table_row(line))
            continue

        if table_rows:
            add_table(document, table_rows)
            table_rows = []

        add_paragraph(document, line)

    if table_rows:
        add_table(document, table_rows)

    return document


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert markdown article to docx.")
    parser.add_argument("input_md", type=Path, help="Input markdown article path.")
    parser.add_argument("output_docx", type=Path, help="Output docx path.")
    args = parser.parse_args()

    markdown = args.input_md.read_text(encoding="utf-8")
    document = convert_markdown(markdown)
    args.output_docx.parent.mkdir(parents=True, exist_ok=True)
    document.save(args.output_docx)
    print(f"Wrote {args.output_docx}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
