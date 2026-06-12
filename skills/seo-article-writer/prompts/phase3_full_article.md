# Phase 3 Prompt: Complete Full Article

You are running Phase 3 of `$seo-article-writer`.

Only continue if:

- `outline_confirmed` is true, and
- Phase 2 has produced the polished `02_first_two_sections.md`.

## Inputs To Use

- Approved `01_outline.md`
- Polished `02_first_two_sections.md`
- `00_material_reading_summary.md`
- Language and content requirements reference
- Active writing guidelines
- User review notes, if any

## Required Work

Complete `03_full_article.md`.

The full article must:

- start with exactly these three metadata lines before the H1:
  - `**SEO Title:** [final SEO title]`
  - `**Description:** [final meta description]`
  - `**URL:** [final URL slug or URL]`
- leave one blank line after the URL line, then write the H1
- treat the Chinese outline notes as planning guidance only and write the article body in the project-requested article language
- follow the approved outline
- keep the final visible article text within the word count range specified in the article brief's "Target word count" field; if not specified, default to 1200-1600 words
- count visible article text including headings, body paragraphs, tables, and FAQ; exclude SEO metadata, prompts, checklist reports, and image planning files
- follow the section-level word budget from the approved outline; if the outline lacks a budget, create a compact word allocation matching the brief's target range before writing
- if the draft starts running long, compress repeated examples, generic learning advice, long transitions, and over-explained product details instead of adding more sections
- keep the approved tone, paragraph rhythm, style density, and product-placement pattern from the polished `02_first_two_sections.md`
- use clear H1/H2/H3 hierarchy
- keep paragraphs web-friendly
- integrate primary and secondary keywords naturally
- include all required tables marked in the approved outline, using simple Markdown table formatting
- include FAQ answers that directly answer the questions
- include required product/tool modules naturally
- use accurate brand data only from the guidelines
- cite or qualify facts when required
- mark uncertain claims as requiring user confirmation or avoid stating them as facts
- do not include image descriptions, AI image prompts, image insertion suggestions, markdown image syntax, `IMAGE_PLACEHOLDER`, or `[IMAGE_1]` placeholders
- avoid all forbidden words, forbidden punctuation, banned competitors, and PR red lines
- apply the general language style requirements from `language_content_requirements.md`
- apply content specification requirements only when they match the current product writing guidelines; do not force product-specific content rules onto unrelated products

## Output

Write `03_full_article.md`.

After the article is complete, proceed to Phase 4 checklist validation unless the user asks to pause.
