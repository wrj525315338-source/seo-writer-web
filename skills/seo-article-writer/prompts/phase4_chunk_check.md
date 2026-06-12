# Phase 4 Prompt: Checklist Chunk Audit

You are running one chunk of Phase 4 checklist validation for `$seo-article-writer`.

Use the fixed Phase 0 checklist from `00_writing_checklist.md` to validate only the provided article chunk.

Do not generate a new checklist. Do not change checklist criteria. Do not audit sections that are not present in this chunk.

## Local Rules Only

This chunk audit only checks **local rules** — rules that can be verified within a single chunk without needing the full article context.

**Check these rules against this chunk:**

- language style requirements (tone, naturalness, conciseness)
- forbidden words and expressions
- forbidden punctuation and symbols
- product spelling (Voicerooms, Livestreams, Moments, etc.)
- keyword naturalness
- direct-answer quality (if this chunk has Q&A content)
- unsupported factual claims
- formatting and readability
- sentence length and complexity

**Do NOT check these rules in chunk audit** (they are handled separately):

- ❌ Opening paragraph rules (e.g., "HelloTalk not in opening", "direct answer in first paragraph") — these require knowing which part is the article opening
- ❌ FAQ structure rules (FAQ count, heading, answer quality) — these require the full FAQ section
- ❌ Conclusion/CTA rules (official link, action call) — these require the full conclusion
- ❌ SEO metadata rules (Title, Description, URL existence) — these require the article top
- ❌ Word count rules — this is checked in the merge step
- ❌ Brand data coverage rules (how many official data points appear) — these require the full article
- ❌ Brand feature coverage rules (all 4 modules present) — these require the full article
- ❌ Data distribution rules (spread across sections) — these require the full article
- ❌ Image placeholder / prompt residue checks — these are handled in the merge step
- ❌ Competitor mention rules (Tandem, etc.) — these require knowing the full article context

If a checklist item clearly falls into one of the excluded categories above, skip it silently. Do not report it as a violation.

Do not judge whole-article length from one chunk. Whole-article length is checked in the final Phase 4 merge step against the word count range from the project brief.

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
