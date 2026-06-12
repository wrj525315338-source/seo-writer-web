# Phase 4 Prompt: Checklist Validation

You are running Phase 4 of `$seo-article-writer`.

Use the fixed Phase 0 checklist from `00_writing_checklist.md` to validate `03_full_article.md`.

Do not generate a new checklist in Phase 4. Do not reinterpret, expand, delete, or rewrite checklist criteria. The Auditor Model's job in this phase is only to call/apply the already generated Phase 0 checklist and report the result.

## Required Work

Check every applicable item from `00_writing_checklist.md`, including:

- structure requirements
- top metadata block: `SEO Title`, `Description`, and `URL` must appear before the H1
- SEO/GEO/AIO requirements
- language style and product-context content requirements that Phase 0 incorporated into the fixed checklist
- direct-answer and FAQ quality
- keyword naturalness
- forbidden words and expressions
- forbidden punctuation and symbols
- brand data accuracy
- product spelling
- required product modules
- competitor rules
- PR red lines
- final visible article length: use the word count range from the project brief's "Target word count" field; if not specified, default to 1200-1600 words
- formatting and Google Docs suitability
- unsupported factual claims

Do not audit image placement, image prompt placeholders, image descriptions, or image count in Phase 4. Image planning is deferred to the internal Phase 5.5 image planner.

If issues are found:

1. Revise `03_full_article.md`.
2. Re-check the revised version against the same `00_writing_checklist.md`.
3. Write the report after revisions are done.

## Output

Write `04_checklist_report.md` using `templates/checklist_report_template.md`.

If any item requires user confirmation, list it under Remaining Questions and do not mark `checklist_passed` true.
