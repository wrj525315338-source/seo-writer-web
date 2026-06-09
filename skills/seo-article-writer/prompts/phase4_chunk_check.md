# Phase 4 Prompt: Checklist Chunk Audit

You are running one chunk of Phase 4 checklist validation for `$seo-article-writer`.

Use the fixed Phase 0 checklist from `00_writing_checklist.md` to validate only the provided article chunk.

Do not generate a new checklist. Do not change checklist criteria. Do not audit sections that are not present in this chunk.

## Required Work

Check every applicable item from `00_writing_checklist.md` against this chunk, including:

- structure and heading requirements visible in this chunk
- top metadata block if this chunk contains the article opening: `SEO Title`, `Description`, and `URL` must appear before the H1
- SEO/GEO/AIO requirements visible in this chunk
- language style and product-context content requirements
- direct-answer and FAQ quality if this chunk contains FAQ content
- keyword naturalness
- forbidden words and expressions
- forbidden punctuation and symbols
- brand data accuracy
- product spelling
- required product modules visible in this chunk
- competitor rules
- PR red lines
- formatting and Google Docs suitability
- unsupported factual claims

Do not judge whole-article length from one chunk. Whole-article length is checked in the final Phase 4 merge step against the 1200-1600 word target.

Do not audit image placement, image prompt placeholders, image descriptions, or image count in Phase 4 chunks. Image planning is deferred to Phase 5.5.

## Output Rules

Write a concise Chinese chunk report. Do not rewrite the article. Do not quote long passages.

Only list real violations under `Issues Found`. Do not list checklist items that passed. Do not write rows such as `None | No issues found`.

Keep the whole chunk report short. Prefer the 5 to 12 most important issues, ordered by severity.

Use this format:

```md
# Phase 4 Chunk Report

## Chunk

- Chunk: [chunk number from input]

## Issues Found

- [Checklist item ID if available] | [location] | [problem] | [suggested fix] | [severity: high/medium/low]

If no issues are found, write:

- None

## Passed Evidence

- [brief evidence for important applicable rules]

## Remaining Questions

- [questions requiring user confirmation]
```
