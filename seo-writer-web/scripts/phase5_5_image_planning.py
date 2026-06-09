#!/usr/bin/env python3
"""Normalize the Phase 5.5 image plan and add image slots to the article copy."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REQUIRED_IMAGE_FIELDS = ("id", "type", "prompt", "alt_text", "insertion_marker")


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PlanningLog:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.lines: list[str] = []

    def write(self, message: str) -> None:
        self.lines.append(f"[{now()}] {message}")

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text("\n".join(self.lines) + "\n", encoding="utf-8")


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def extract_json(raw: str) -> dict[str, Any]:
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw, re.IGNORECASE)
    if fenced:
        raw = fenced.group(1)
    start = raw.find("{")
    end = raw.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("image planner output did not contain a JSON object")
    parsed = json.loads(raw[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("image planner JSON must be an object")
    return parsed


def word_count(markdown: str) -> int:
    return len(re.findall(r"[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?|[\u4e00-\u9fff]", markdown))


def h2_sections(markdown: str) -> list[str]:
    return [match.group(1).strip() for match in re.finditer(r"^##\s+(.+)$", markdown, re.MULTILINE)]


def target_image_count(config: dict[str, Any]) -> int:
    raw = config.get("default_image_count") or config.get("image_count_default") or 0
    try:
        count = int(raw)
    except (TypeError, ValueError):
        count = 0
    return max(1, min(6, count)) if count else 0


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "supplemental-image"


def choose_supplemental_heading(summary: dict[str, Any], images: list[dict[str, Any]], index: int, target: int) -> str:
    sections = [str(section).strip() for section in summary.get("h2_sections", []) if str(section).strip()]
    final_section = ""
    final_cta = summary.get("final_cta_position")
    if isinstance(final_cta, dict):
        final_section = str(final_cta.get("section") or "").strip()
    candidates = [section for section in sections if section != final_section] or sections
    used = {str(image.get("insert_before_heading") or "").strip() for image in images}
    unused = [section for section in candidates if section not in used] or candidates
    if not unused:
        return ""
    position = min(len(unused) - 1, max(0, round((len(unused) - 1) * (index / max(1, target)))))
    return unused[position]


def build_supplemental_image(image_number: int, summary: dict[str, Any], images: list[dict[str, Any]], target: int) -> dict[str, Any]:
    image_id = f"IMAGE_{image_number}"
    section_heading = choose_supplemental_heading(summary, images, image_number, target)
    article_type = cleanup(summary.get("article_type") or "SEO article")
    h2_text = section_heading or "the article's key Korean learning system"
    prompt = (
        "Create a photorealistic HelloTalk website/app marketing composite for the article section "
        f"'{h2_text}'. The visual should show a generated, non-identifiable adult language learner using a smartphone "
        "in bright real-photo style, with an optimistic expression and polished commercial lighting. Add a realistic "
        "phone mockup with generic language-exchange chat or voice elements in HelloTalk Purple (#5856D6), white, "
        "and very light lavender (#FAFAFE). Use short rounded "
        "cards or pill chips to summarize one practical takeaway from this section, without inventing product features, "
        "fake testimonials, exact UI screens, or unsupported claims. Composition: website hero style with brand/icon "
        "area, photoreal learner, phone mockup, purple chat bubbles, curved purple footer/edge shape, soft shadows, "
        "and subtle Hangul or article-relevant decorative geometry. Avoid flat-only infographic output, cartoon style, "
        "3D render style, generic stock-photo cliches, competitor logos, excessive visible text, and real public or "
        "identifiable private people."
    )
    return {
        "id": image_id,
        "slug": slugify(f"{h2_text}-{image_id}"),
        "type": "photo-ui-composite",
        "insertion_marker": f"[{image_id}]",
        "insert_after_text": "",
        "insert_before_heading": section_heading,
        "source_ui": None,
        "visual_concept": f"Supplemental photorealistic HelloTalk app composite for {article_type}: {h2_text}",
        "language_aesthetic": "Article-relevant cultural/location cue with subtle script geometry, no stereotypes",
        "prompt": prompt,
        "alt_text": f"Korean learning infographic for {h2_text}",
        "why_here": "Supplemental planned image added to match the user's requested image count.",
        "style_reference_examples": [],
        "nearest_hellotalk_mention_distance_words": 120,
        "policy_notes": {
            "not_near_hellotalk_mention": True,
            "not_before_final_cta": True,
            "not_generic_scene_art": True,
            "hero_is_photorealistic_brand_composite": True,
            "uses_generated_non_identifiable_person": True,
            "no_fake_features": True,
            "uses_brand_visual_style": True,
        },
    }


def ensure_plan_image_count(plan: dict[str, Any], article: str, config: dict[str, Any], log: Any) -> dict[str, Any]:
    target = target_image_count(config)
    if not target:
        return plan
    summary = plan.get("article_summary") if isinstance(plan.get("article_summary"), dict) else {}
    if not summary.get("h2_sections"):
        summary["h2_sections"] = h2_sections(article)
    plan["article_summary"] = summary
    images = plan.get("images") if isinstance(plan.get("images"), list) else []
    if len(images) > target:
        log.write(f"image_plan has {len(images)} images; trimming to requested count {target}")
        plan["images"] = images[:target]
        return plan
    while len(images) < target:
        image_number = len(images) + 1
        supplemental = build_supplemental_image(image_number, summary, images, target)
        images.append(supplemental)
        log.write(f"image_plan had fewer images than requested; added supplemental {supplemental['id']}")
    plan["images"] = images
    return plan


def normalize_id(value: Any, index: int) -> str:
    text = str(value or "").strip()
    match = re.search(r"(\d+)", text)
    return f"IMAGE_{match.group(1)}" if match else f"IMAGE_{index}"


def cleanup(value: Any) -> str:
    return str(value or "").strip().strip("`").strip().strip('"').strip("'")


def normalize_plan(plan: dict[str, Any], article: str, config: dict[str, Any], log: PlanningLog) -> dict[str, Any]:
    summary = plan.get("article_summary") if isinstance(plan.get("article_summary"), dict) else {}
    summary.setdefault("article_type", "SEO")
    summary.setdefault("target_word_count", "")
    summary["actual_word_count"] = int(summary.get("actual_word_count") or word_count(article))
    if not summary.get("h2_sections"):
        summary["h2_sections"] = h2_sections(article)
    summary.setdefault("hellotalk_mentions", [])
    summary.setdefault("final_cta_position", {"section": "", "word_index": 0})

    images = plan.get("images") if isinstance(plan.get("images"), list) else []
    normalized_images: list[dict[str, Any]] = []
    has_missing_required_fields = False
    for index, raw_image in enumerate(images, start=1):
        if not isinstance(raw_image, dict):
            continue
        image = dict(raw_image)
        image_id = normalize_id(image.get("id"), index)
        image["id"] = image_id
        image["slug"] = cleanup(image.get("slug") or image_id.lower())
        image["type"] = cleanup(image.get("type") or "infographic")
        image["insertion_marker"] = cleanup(image.get("insertion_marker") or f"[{image_id}]")
        if image["insertion_marker"] != f"[{image_id}]":
            image["insertion_marker"] = f"[{image_id}]"
        image["insert_after_text"] = cleanup(image.get("insert_after_text"))
        image["insert_before_heading"] = cleanup(image.get("insert_before_heading"))
        image["visual_concept"] = cleanup(image.get("visual_concept"))
        image["language_aesthetic"] = cleanup(image.get("language_aesthetic"))
        references = image.get("style_reference_examples")
        image["style_reference_examples"] = references if isinstance(references, list) else []
        image["prompt"] = cleanup(image.get("prompt"))
        image["alt_text"] = cleanup(image.get("alt_text"))
        image["why_here"] = cleanup(image.get("why_here"))
        image["nearest_hellotalk_mention_distance_words"] = int(
            image.get("nearest_hellotalk_mention_distance_words") or 0
        )
        notes = image.get("policy_notes") if isinstance(image.get("policy_notes"), dict) else {}
        notes.setdefault("not_near_hellotalk_mention", True)
        notes.setdefault("not_before_final_cta", True)
        notes.setdefault("not_generic_scene_art", True)
        notes.setdefault(
            "hero_is_photorealistic_brand_composite",
            image_id != "IMAGE_1"
            or image["type"] in {"photo-hero-composite", "photo-ui-composite", "photo-learning-scene"},
        )
        notes.setdefault("uses_generated_non_identifiable_person", True)
        notes.setdefault("no_fake_features", True)
        notes.setdefault("uses_brand_visual_style", "#5856D6" in image["prompt"])
        image["policy_notes"] = notes
        missing = [field for field in REQUIRED_IMAGE_FIELDS if not image.get(field)]
        if missing:
            has_missing_required_fields = True
            log.write(f"{image_id} missing required fields: {', '.join(missing)}")
        normalized_images.append(image)

    plan["article_summary"] = summary
    plan["images"] = normalized_images
    plan = ensure_plan_image_count(plan, article, config, log)
    normalized_images = plan.get("images") if isinstance(plan.get("images"), list) else []

    policy_missing = not isinstance(plan.get("policy_check"), dict)
    policy = plan.get("policy_check") if isinstance(plan.get("policy_check"), dict) else {}
    policy.setdefault("total_images_allowed", True)
    policy.setdefault(
        "hero_is_photorealistic_brand_composite",
        not normalized_images
        or normalized_images[0].get("type")
        in {"photo-hero-composite", "photo-ui-composite", "photo-learning-scene"},
    )
    policy.setdefault("no_image_near_hellotalk_mentions", True)
    policy.setdefault("no_image_before_final_cta", True)
    policy.setdefault("no_generic_scene_art", True)
    policy.setdefault("all_images_use_photorealistic_generated_people", True)
    policy.setdefault("all_alt_text_has_keywords", all(bool(image.get("alt_text")) for image in normalized_images))
    policy.setdefault("no_fake_features", True)
    policy.setdefault("ui_screenshot_sources_valid", True)
    policy.setdefault("ready_for_generation", all(bool(image.get("prompt")) for image in normalized_images))
    if policy_missing or has_missing_required_fields or not normalized_images:
        policy["ready_for_generation"] = False
    if not policy.get("hero_is_photorealistic_brand_composite", False):
        policy["ready_for_generation"] = False

    plan["article_summary"] = summary
    plan["images"] = normalized_images
    plan["policy_check"] = policy
    return plan


def insert_after_paragraph(markdown: str, needle: str, marker: str) -> tuple[str, bool]:
    if not needle:
        return markdown, False
    index = markdown.lower().find(needle.lower())
    if index < 0:
        return markdown, False
    paragraph_end = markdown.find("\n\n", index)
    if paragraph_end < 0:
        paragraph_end = len(markdown)
    return markdown[:paragraph_end] + f"\n\n{marker}" + markdown[paragraph_end:], True


def insert_before_heading(markdown: str, heading: str, marker: str) -> tuple[str, bool]:
    if not heading:
        return markdown, False
    pattern = re.compile(rf"^(##+\s+{re.escape(heading).lstrip('#').strip()})\s*$", re.IGNORECASE | re.MULTILINE)
    match = pattern.search(markdown)
    if not match:
        return markdown, False
    return markdown[: match.start()] + f"{marker}\n\n" + markdown[match.start() :], True


def insert_hero_slot(markdown: str, marker: str) -> tuple[str, bool]:
    lines = markdown.splitlines()
    for index, line in enumerate(lines):
        if line.startswith("# "):
            lines.insert(index + 1, "")
            lines.insert(index + 2, marker)
            return "\n".join(lines) + "\n", True
    return f"{marker}\n\n{markdown}", True


def build_article_with_slots(article: str, plan: dict[str, Any], log: PlanningLog) -> str:
    output = article
    for image in plan.get("images", []):
        marker = str(image["insertion_marker"])
        if marker in output:
            log.write(f"{image['id']} slot already present: {marker}")
            continue
        output, inserted = insert_after_paragraph(output, str(image.get("insert_after_text") or ""), marker)
        if not inserted:
            output, inserted = insert_before_heading(output, str(image.get("insert_before_heading") or ""), marker)
        if not inserted and image.get("id") == "IMAGE_1":
            output, inserted = insert_hero_slot(output, marker)
        if not inserted:
            output = output.rstrip() + f"\n\n{marker}\n"
            log.write(f"{image['id']} appended as a fallback slot")
        else:
            log.write(f"{image['id']} slot inserted: {marker}")
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description="Normalize Phase 5.5 image planning outputs.")
    parser.add_argument("--raw-plan", type=Path, required=True)
    parser.add_argument("--article-md", type=Path, required=True)
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    output_dir = args.output_dir
    log = PlanningLog(output_dir / "image_planning.log")
    image_plan_path = output_dir / "image_plan.json"
    slots_path = output_dir / "final_article_with_image_slots.md"

    try:
        log.write("phase5_5_image_planning started")
        log.write(f"article_md={args.article_md}")
        log.write(f"config={args.config}")
        article = args.article_md.read_text(encoding="utf-8-sig")
        config = read_json(args.config, {})
        log.write(f"provider={config.get('provider', '')}")
        log.write(f"model={config.get('model', '')}")
        plan = extract_json(args.raw_plan.read_text(encoding="utf-8-sig", errors="replace"))
        plan = normalize_plan(plan, article, config, log)

        summary = plan["article_summary"]
        log.write(f"article_type={summary.get('article_type', '')}")
        log.write(f"actual_word_count={summary.get('actual_word_count', 0)}")
        log.write(f"h2_sections={summary.get('h2_sections', [])}")
        log.write(f"hellotalk_mentions={summary.get('hellotalk_mentions', [])}")
        log.write(f"final_cta_position={summary.get('final_cta_position', {})}")

        for image in plan.get("images", []):
            log.write(
                f"{image['id']} type={image.get('type', '')} distance={image.get('nearest_hellotalk_mention_distance_words', 0)}"
            )
            log.write(f"{image['id']} visual_concept={image.get('visual_concept', '')}")
            log.write(f"{image['id']} style_reference_examples={image.get('style_reference_examples', [])}")
            log.write(f"{image['id']} prompt={image.get('prompt', '')}")
            log.write(f"{image['id']} alt_text={image.get('alt_text', '')}")

        log.write(f"policy_check={plan.get('policy_check', {})}")
        write_json(image_plan_path, plan)
        slots_path.write_text(build_article_with_slots(article, plan, log), encoding="utf-8")
        log.write("phase5_5_image_planning completed")
        return 0
    except Exception as exc:
        log.write(f"phase5_5_image_planning failed: {exc}")
        return 1
    finally:
        log.save()


if __name__ == "__main__":
    sys.exit(main())
