# Phase 4 Prompt: Merge Checklist Chunk Reports

You are running the final merge step of Phase 4 checklist validation for `$seo-article-writer`.

Use the fixed Phase 0 checklist and all Phase 4 chunk reports to create the final `04_checklist_report.md`.

Do not generate a new checklist. Do not add criteria that were not in the fixed checklist. Do not claim the article was revised unless a chunk report explicitly says a concrete revision was made.

## Required Work

1. Consolidate duplicate issues across chunk reports.
2. Preserve checklist item IDs when available.
3. Mark high-risk issues clearly.
4. If any chunk report has unresolved issues or remaining questions, do not mark the checklist as passed.
5. Check the final visible article length against the 1200-1600 word target unless the project brief gives a stricter range.
6. If all chunk reports say no issues and the article length is within range, mark the checklist as passed.

## Output Rules

Write `04_checklist_report.md` using the checklist report template when provided.

At the top of the report, include:

```md
checklist_passed: true
```

or:

```md
checklist_passed: false
```

Then include:

- Passed Items
- Issues Found
- Revised Version Notes
- Remaining Questions

Keep the report concise. Do not include the full article.
