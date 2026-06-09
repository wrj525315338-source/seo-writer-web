# SEO Article Writer Workflow

## Phase 0: Read Materials And Generate Fixed Checklist

Inputs:

- Writing guidelines: docx, pdf, md, txt, or other readable text.
- Example articles: one or more files, used only for structure and style analysis.
- Topic requirements: article topic, keywords, reader, search intent, product placement instructions, special constraints, and any deferred image requirements for Phase 5.5.
- `references/language_content_requirements.md`.

Process:

1. Extract text with `scripts/extract_materials.py` if source files are not plain text.
2. Read the writing guidelines completely.
3. Extract hard rules: structure, forbidden wording, brand rules, competitor rules, SEO/GEO/AIO rules, language style rules, product-context content rules, formatting rules, checklist items, red lines, and deferred image rules for Phase 5.5 only.
4. Analyze example articles only for patterns: title stack, opening, H2/H3 hierarchy, paragraph length, transition style, table usage, FAQ style, product insertion, and approximate article length.
5. Identify the current task: topic, primary keyword, secondary keywords, search intent, target reader, article type, word count, and risks. Unless the user gives a stricter range, the final visible article text must be 1200-1600 words.
6. Write `outputs/<project_slug>/00_material_reading_summary.md`.
7. Generate `outputs/<project_slug>/00_writing_checklist.md` from the extracted writing standards and `language_content_requirements.md`.

Phase 0 is auto-approved after both files are generated.

## Phase 1: Generate The Article Outline

Requirements:

- Use the confirmed Phase 0 summary, active writing guidelines, examples, topic requirements, and fixed checklist.
- Include Title, Meta title, Meta description, URL slug, search intent, target reader, primary keyword, secondary keywords, H1, H2/H3 structure, section purpose, section coverage, natural product placement, FAQ plan, allowed internal/external links, and expressions to avoid.
- Do not include image descriptions, AI image prompts, image planning notes, image positions, image counts, visual types, markdown image syntax, `IMAGE_PLACEHOLDER`, or `[IMAGE_1]` placeholders.
- Write the outline planning notes in Chinese for easy human review. Do not output a full English outline. Keep only required English content such as keywords, SEO terms, headings, title/meta/slug options, product names, exact brand data, and final-article example wording in English.
- Mark every section where the final article should use a table. Include table purpose, required/optional status, suggested columns, and row content plan. If no table is needed, state that explicitly.
- Include a section-level word budget that keeps the final visible article text between 1200 and 1600 words. Use the example articles as the density reference.
- Keep product or tool placement natural. Do not place the brand in the opening unless the guidelines require it.
- Do not draft full body text.

Output:

- `outputs/<project_slug>/01_outline.md`

Stop after Phase 1. The user must preview and approve the outline before Phase 2.

## Phase 2: Draft And Auditor-Polish The First Two H2 Sections

Requirements:

- Draft only the first two H2 sections from the approved outline.
- The Writing Model creates an internal draft first.
- The Auditor Model then revises that draft according to the active writing guidelines, `00_writing_checklist.md`, and `language_content_requirements.md`.
- The polished text becomes the official `02_first_two_sections.md` and the style sample for Phase 3.
- Use natural, helpful, experience-sharing language.
- Prefer short sentences, simple words, direct answers, concrete actions, and high information density.
- Keep product placement scenario-first and avoid feature dumping.
- Keep SEO/AIO readability, but never keyword-stuff.
- Respect the approved section word budget. The first two H2 sections should stay proportionate, normally about 350-550 words total unless the approved outline explicitly allocates a different budget.
- Do not complete the article.

Output:

- `outputs/<project_slug>/02_first_two_sections.md`

Phase 2 is auto-approved after the Auditor Model produces the polished output.

## Phase 3: Complete The Full Article

Requirements:

- Base the full article on the approved outline and polished `02_first_two_sections.md`.
- Start `03_full_article.md` with `SEO Title`, `Description`, and `URL` metadata lines before the H1.
- Preserve the polished Phase 2 style, paragraph rhythm, information density, and product-placement pattern.
- Use clear heading hierarchy and web-friendly paragraph length.
- Integrate keywords naturally.
- Write FAQ answers directly, usually 2 to 4 sentences each.
- Use sourced facts when the guidelines require data; do not invent facts.
- Mark uncertain claims as requiring user confirmation or avoid presenting them as facts.
- Include all tables required by the outline.
- Keep the final visible article text within 1200-1600 words, including headings, tables, and FAQ, and excluding SEO metadata. If the draft is too long, compress repeated examples, generic transitions, and over-explained product details before adding more content.
- Do not include image descriptions, AI image prompts, image insertion suggestions, markdown image syntax, `IMAGE_PLACEHOLDER`, or `[IMAGE_1]` placeholders.
- Apply general language style requirements from `language_content_requirements.md`.
- Apply product-context content requirements only when they match the active product writing guidelines.

Output:

- `outputs/<project_slug>/03_full_article.md`

Phase 3 is auto-approved after the full article is generated.

## Phase 4: Checklist Validation

Requirements:

- Validate the full article against every item in fixed `00_writing_checklist.md`.
- Confirm the top metadata block includes `SEO Title`, `Description`, and `URL` before the H1.
- Check hard rules, language style, product-context content rules, forbidden words, forbidden punctuation, brand data, product spelling, competitor rules, red lines, keyword naturalness, FAQ quality, table usage, and formatting.
- Check the final visible article length. Flag it if it is below 1200 words or above 1600 words.
- Do not audit image requirements in Phase 4; images are handled by Phase 5.5 after final article approval.
- Do not generate a new checklist.
- Do not change checklist criteria during Phase 4.
- For long articles, split the article into smaller audit chunks, check each chunk against the same fixed checklist, then merge chunk reports into `04_checklist_report.md`.
- If issues are found, revise `03_full_article.md` first, then write `04_checklist_report.md`.
- If an issue requires user confirmation, list it under Remaining Questions.

Output:

- `outputs/<project_slug>/04_checklist_report.md`

Phase 4 is auto-approved after checklist validation succeeds. If the Auditor Model fails, retry choices are handled by the web app; it must not automatically fall back to the Writing Model.

## Phase 5: Generate Final Article Delivery

Requirements:

- Generate a simple Word document from the final revised article.
- Keep `SEO Title`, `Description`, and `URL` at the very top of the final article file.
- Use H1/H2/H3 styles, normal paragraphs, simple tables, and no unnecessary page headers, footers, watermarks, or complex layout.
- Do not generate image prompts, image placeholders, `image_prompts.md`, `images.json`, or `image_plan.json` in Phase 5.
- If the user gives human review comments after preview, revise `03_full_article.md` surgically according to both the human comment and the Phase 4 checklist/auditor reports. Do not broadly rewrite compliant sections.
- After the surgical revision, run a stabilization pass against the fixed checklist before returning to Phase 4. The stabilization pass should make only the smallest necessary edits and should avoid introducing new facts, claims, examples, sections, or product details.
- Keep the article within 1200-1600 words, then return to Phase 4 for a fresh checklist validation.
- After the user confirms Phase 5, regenerate the Word file once more from the latest `03_full_article.md`.

Outputs:

- `outputs/<project_slug>/final_article_for_google_docs.docx`

Stop after Phase 5. The user must preview and approve the final article file.

## Internal Phase 5.5: Image Planning

Requirements:

- Run only after Phase 5 final article confirmation.
- Read the final `03_full_article.md`.
- Use `hellotalk-blog-image-planner-v2` to analyze the complete article and produce `image_plan.json`.
- Generate `final_article_with_image_slots.md` by inserting only `[IMAGE_1]`, `[IMAGE_2]`, etc. into a copy of the article.
- Generate `image_planning.log`.
- Do not overwrite `03_full_article.md`.

Outputs:

- `outputs/<project_slug>/image_plan.json`
- `outputs/<project_slug>/final_article_with_image_slots.md`
- `outputs/<project_slug>/image_planning.log`

## Internal Phase 6: Image Generation And Word Output

Requirements:

- Read only `final_article_with_image_slots.md`, `image_plan.json`, image generation config, and the output directory.
- Do not read `image_prompts.md`, `images.json`, Phase 1 image notes, or Phase 4 image notes.
- If `image_plan.json` is missing or `policy_check.ready_for_generation` is not true, do not generate fallback prompts.
- Generate images through an image provider adapter.
- Run image compliance checks.
- Insert only compliant images into Word unless `allow_non_compliant_images=true`.

Outputs:

- `outputs/<project_slug>/images/IMAGE_1.png`
- `outputs/<project_slug>/image_metadata.json`
- `outputs/<project_slug>/image_compliance_report.json`
- `outputs/<project_slug>/phase6.log`
- `outputs/<project_slug>/final_article_with_images.docx`
