# Phase 5 Prompt: Revise Final Article After Human Review

You are revising the final article during Phase 5 of `$seo-article-writer`.

Use the human review comment, current latest `03_full_article.md`, fixed `00_writing_checklist.md`, `phase5_revision_audit_summary.md` when provided, and material summary.

Do not use old article bodies as source text. If an audit note references an old passage, treat it only as issue location/context. The only article body you may revise is the current latest `03_full_article.md`.

## Required Work

Revise the final article directly according to the human review comment.

This must be a surgical revision, not a broad rewrite. Treat the current article as the source of truth and only change the smallest set of sentences, paragraphs, headings, or table cells needed to resolve the human comment and the still-relevant Phase 4 issues.

The revised article must:

- address the human review comment and every still-relevant issue from the Phase 4 auditor feedback
- follow the fixed `00_writing_checklist.md`
- treat `phase5_revision_audit_summary.md` as the Phase 4 issue list when it is provided
- preserve or repair the top metadata block before the H1:
  - `**SEO Title:** ...`
  - `**Description:** ...`
  - `**URL:** ...`
- keep the revised visible article text within the word count range from the project brief's "Target word count" field; if not specified, default to 1200-1600 words
- if the current article is too long, reduce length by cutting repeated explanations, generic examples, long transitions, and over-detailed product descriptions while preserving the approved outline and required facts
- preserve the approved article language
- keep the approved outline and heading hierarchy unless the review comment explicitly asks for a compliant structural change
- follow all active writing guidelines and the fixed checklist
- preserve SEO/GEO/AIO requirements
- preserve accurate product data and forbidden-word rules
- keep the tone natural, direct, and experience-based
- avoid unsupported claims, exaggerated promises, hard-selling, and fabricated features
- remove image descriptions, AI image prompts, markdown image syntax, `IMAGE_PLACEHOLDER`, and `[IMAGE_1]` placeholders if any old draft contains them
- avoid introducing new facts, unsupported claims, new product details, new examples, or new sections unless the revision request or checklist explicitly requires them
- prefer shortening, simplifying, and repairing existing text over adding new text

If the human review comment conflicts with the writing guidelines, checklist, or Phase 4 auditor feedback, make the safest compliant revision and avoid the conflicting part.

Before outputting, internally check that your revision did not create new checklist violations.

After this revision, the app will rerun Phase 4. Do not claim the checklist has passed.

## Output Rules

Write only the revised full article Markdown.

Do not include explanations, review notes, scores, or a checklist report.
