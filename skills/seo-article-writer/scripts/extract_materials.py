#!/usr/bin/env python3
"""Extract readable text from common SEO brief source files into markdown."""

from __future__ import annotations

import argparse
import html
import sys
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET
from zipfile import ZipFile


SUPPORTED_EXTENSIONS = {".docx", ".xlsx", ".xlsm", ".md", ".txt", ".pdf"}


def read_text_file(path: Path) -> str:
    for encoding in ("utf-8-sig", "utf-8", "gb18030", "latin-1"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    return path.read_text(errors="replace")


def extract_docx(path: Path) -> str:
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    with ZipFile(path) as archive:
        document_xml = archive.read("word/document.xml")
    root = ET.fromstring(document_xml)
    paragraphs: list[str] = []
    for paragraph in root.findall(".//w:p", ns):
        text = "".join(node.text or "" for node in paragraph.findall(".//w:t", ns)).strip()
        if text:
            paragraphs.append(text)
    return "\n".join(paragraphs)


def extract_xlsx(path: Path) -> str:
    try:
        import openpyxl
    except ImportError as exc:
        raise RuntimeError("openpyxl is required to extract xlsx files") from exc

    workbook = openpyxl.load_workbook(path, data_only=True)
    chunks: list[str] = []
    for worksheet in workbook.worksheets:
        chunks.append(f"## Sheet: {worksheet.title}")
        for row in worksheet.iter_rows(values_only=True):
            values = [str(value).strip() for value in row if value is not None and str(value).strip()]
            if values:
                chunks.append(" | ".join(values))
    return "\n".join(chunks)


def extract_pdf(path: Path) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        try:
            from PyPDF2 import PdfReader  # type: ignore
        except ImportError as exc:
            raise RuntimeError("pypdf or PyPDF2 is required to extract pdf files") from exc

    reader = PdfReader(str(path))
    pages: list[str] = []
    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        pages.append(f"## Page {index}\n{text.strip()}")
    return "\n\n".join(pages)


def extract_file(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".md", ".txt"}:
        return read_text_file(path)
    if suffix == ".docx":
        return extract_docx(path)
    if suffix in {".xlsx", ".xlsm"}:
        return extract_xlsx(path)
    if suffix == ".pdf":
        return extract_pdf(path)
    raise ValueError(f"Unsupported file type: {path}")


def iter_sources(paths: Iterable[Path]) -> Iterable[Path]:
    for path in paths:
        if path.is_dir():
            for child in sorted(path.rglob("*")):
                if child.is_file() and child.suffix.lower() in SUPPORTED_EXTENSIONS:
                    yield child
        elif path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            yield path


def build_markdown(paths: list[Path]) -> str:
    sections: list[str] = ["# Extracted Materials"]
    for path in iter_sources(paths):
        try:
            text = extract_file(path)
        except Exception as exc:  # keep extraction usable when one file fails
            text = f"[Extraction error: {exc}]"
        safe_path = html.escape(str(path))
        sections.append(f"\n\n# Source: {safe_path}\n\n{text.strip()}")
    return "\n".join(sections).strip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract SEO source materials into markdown.")
    parser.add_argument("sources", nargs="+", type=Path, help="Files or directories to extract.")
    parser.add_argument("-o", "--output", type=Path, required=True, help="Output markdown path.")
    args = parser.parse_args()

    markdown = build_markdown(args.sources)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(markdown, encoding="utf-8")
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
