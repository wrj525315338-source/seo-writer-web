# Phase 5 Prompt: Stabilize Revised Article Before Re-Audit

You are running a stabilization pass after a Phase 5 human-review revision.

This is not a new draft. Your job is to prevent the revised article from creating new checklist problems before the app reruns Phase 4.

Use the current revised `03_full_article.md`, the fixed `00_writing_checklist.md`, the human review comment, `phase5_revision_audit_summary.md` when provided, and material summary.

Do not use old article bodies as source text. If an audit note references an old passage, treat it only as issue location/context. The only article body you may stabilize is the current latest `03_full_article.md`.

## Required Work

Internally check the revised article against:

- the fixed checklist
- the human review comment
- every still-relevant Phase 4 issue
- article language and tone rules
- SEO/GEO/AIO requirements
- brand/product data rules
- forbidden words, punctuation, competitors, and PR red lines
- top metadata block
- visible word count matching the brief's "Target word count" range
- no image prompts, image placeholders, image descriptions, or Phase 6 content

Then make only the smallest necessary edits.

## Stabilization Rules

- Do not rewrite the article broadly.
- Do not change compliant sections.
- Do not add new sections unless a missing required section is the actual issue.
- Do not add new facts, statistics, product claims, examples, or feature descriptions unless they are already supported by the provided materials.
- Prefer deletion, compression, and sentence-level repair over expansion.
- Preserve the approved H1/H2/H3 hierarchy unless the existing hierarchy violates the checklist.
- Preserve the top metadata block before the H1:
  - `**SEO Title:** ...`
  - `**Description:** ...`
  - `**URL:** ...`
- If two requirements conflict, follow the writing guidelines, fixed checklist, brand red lines, and safest compliant wording.

## Output Rules

Write only the stabilized full article Markdown.

Do not include explanations, audit notes, change logs, scores, or checklist reports.
