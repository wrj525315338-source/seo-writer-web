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
IMAGE_RE = re.compile(r"!\[[^\]]*\]\([^)]*\)")
BOLD_RE = re.compile(r"\*\*(.+?)\*\*")
ITALIC_RE = re.compile(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)")
CODE_SPAN_RE = re.compile(r"`([^`]+)`")
LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]+\)")


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


def strip_inline_markdown(text: str) -> str:
    """Remove inline markdown syntax that is not converted to formatting."""
    text = IMAGE_RE.sub("", text)
    text = LINK_RE.sub(r"\1", text)
    text = CODE_SPAN_RE.sub(r"\1", text)
    return text


def add_runs_with_inline_format(paragraph, text: str) -> None:
    """Parse inline markdown and add formatted runs to a paragraph."""
    text = IMAGE_RE.sub("", text)
    text = LINK_RE.sub(r"\1", text)

    parts = re.split(r"(\*\*.*?\*\*|`[^`]+`|\*[^*]+\*)", text)
    for part in parts:
        if not part:
            continue
        bold_match = BOLD_RE.match(part)
        if bold_match:
            run = paragraph.add_run(bold_match.group(1))
            run.bold = True
            continue
        code_match = CODE_SPAN_RE.match(part)
        if code_match:
            run = paragraph.add_run(code_match.group(1))
            run.font.name = "Courier New"
            run.font.size = Pt(10)
            continue
        italic_match = ITALIC_RE.match(part)
        if italic_match:
            run = paragraph.add_run(italic_match.group(1))
            run.italic = True
            continue
        paragraph.add_run(part)


def add_paragraph(document: Document, line: str) -> None:
    metadata = METADATA_RE.match(line)
    if metadata:
        paragraph = document.add_paragraph()
        label = paragraph.add_run(f"{metadata.group(1)}: ")
        label.bold = True
        add_runs_with_inline_format(paragraph, metadata.group(2).strip())
        paragraph.paragraph_format.space_after = Pt(4)
        return

    heading = HEADING_RE.match(line)
    if heading:
        level = len(heading.group(1))
        heading_text = strip_inline_markdown(heading.group(2))
        document.add_heading(heading_text, level=level)
        return

    if line.startswith("- ") or line.startswith("* "):
        bullet_text = line[2:].strip()
        if BOLD_RE.search(bullet_text) or CODE_SPAN_RE.search(bullet_text) or IMAGE_RE.search(bullet_text):
            paragraph = document.add_paragraph(style="List Bullet")
            add_runs_with_inline_format(paragraph, bullet_text)
            paragraph.paragraph_format.space_after = Pt(4)
        else:
            document.add_paragraph(bullet_text, style="List Bullet")
        return

    ordered = ORDERED_RE.match(line)
    if ordered:
        num_text = ordered.group(1).strip()
        if BOLD_RE.search(num_text) or CODE_SPAN_RE.search(num_text):
            paragraph = document.add_paragraph(style="List Number")
            add_runs_with_inline_format(paragraph, num_text)
            paragraph.paragraph_format.space_after = Pt(4)
        else:
            document.add_paragraph(num_text, style="List Number")
        return

    if BOLD_RE.search(line) or CODE_SPAN_RE.search(line) or IMAGE_RE.search(line) or LINK_RE.search(line):
        paragraph = document.add_paragraph()
        add_runs_with_inline_format(paragraph, line)
        paragraph.paragraph_format.space_after = Pt(8)
    else:
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
