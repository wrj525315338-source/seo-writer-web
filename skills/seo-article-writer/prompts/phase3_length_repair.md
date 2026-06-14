# Phase 3 Prompt: Word Count Repair

You are repairing an article that is below its target word count.

## Input

The input contains:
- Current word count and target range
- The full article text that needs to be expanded

## Task

Expand the article to reach the minimum word count target. Follow these rules:

1. **Do NOT add filler or padding.** Every new sentence must add genuine value.
2. **Expand existing sections** with more specific examples, deeper explanations, or additional actionable tips.
3. **Add a new H2/H3 section only if** the outline logically requires it and it serves the reader.
4. **Preserve all existing content** that is already good. Do not rewrite sections that are working.
5. **Maintain the same tone, style, and voice** as the existing article.
6. **Keep all SEO metadata, internal links, and product mentions** intact.
7. **Do not exceed the maximum word count** from the target range.

## Priority for expansion

1. Add more specific examples or scenarios to existing sections
2. Expand FAQ answers (2-4 sentences → 4-6 sentences)
3. Add a "Common Mistakes" section if not present
4. Add a "Safety Tips" section if not present
5. Expand the conclusion with a more compelling call to action

## Output

Write the complete expanded article to the output file. Include all original content plus expansions.
