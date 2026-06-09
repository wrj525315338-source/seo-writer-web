# Phase 0 Prompt: Read Materials And Extract Rules

You are running Phase 0 of `$seo-article-writer`.

Read the provided writing guidelines, example articles, and topic requirements. Do not draft an outline or article in this phase.

## Inputs To Use

- Writing guideline text:
- Example article text:
- Topic requirement text:
- Existing `project_state.json`, if available:

## Required Work

1. Extract all hard writing rules from the guidelines:
   - structure rules
   - forbidden words and expressions
   - forbidden punctuation or symbols
   - brand wording rules
   - competitor rules
   - SEO/GEO/AIO rules
   - image requirements for the later Phase 5.5 image planner only
   - checklist items
   - formatting rules
   - language style requirements
   - PR red lines and zero-tolerance items
2. Analyze example articles only for style and structure:
   - title stack
   - H2/H3 hierarchy
   - opening pattern
   - transition style
   - paragraph length
   - approximate article length and section density
   - product insertion pattern
   - FAQ style
   - table/list usage
   - image style patterns for the later Phase 5.5 image planner only
3. Extract the current topic requirements:
   - topic
   - primary keyword
   - secondary keywords
   - search intent
   - target reader
   - article type
   - word count; unless the user gives a stricter range, set the target final article length to 1200-1600 words based on the example article pattern
   - deferred image requirements, if provided
   - special product angle
4. Identify potential risks before outlining.
5. Extract enough checklist source material for the separate Phase 0 checklist file `00_writing_checklist.md`.

## Output

Write `00_material_reading_summary.md` using `templates/material_reading_summary_template.md`.

After the summary is written, Phase 0 must also generate `00_writing_checklist.md` from the writing standards. Stop after Phase 0 outputs are complete.
