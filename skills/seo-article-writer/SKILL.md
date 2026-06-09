---
name: seo-article-writer
description: "Staged SEO/GEO/AIO article-writing workflow for producing Google Docs-ready Word articles from writing guidelines, example articles, topic/keyword requirements, and human review feedback. Use when the user asks to build or run an SEO article process, especially with docx, pdf, md, txt, xlsx, example articles, brand rules, checklist requirements, or phase-by-phase review."
---

# SEO Article Writer

## Core Rule

Treat the user-provided writing guidelines as the highest-priority task source. All article structure, tone, brand wording, forbidden words, competitor rules, SEO/GEO/AIO requirements, and checklist items must follow the guidelines before following the topic brief, examples, or review feedback. Image rules are deferred to the separate HelloTalk image planner after final article approval.

If review feedback conflicts with the guidelines, do not apply it directly. Explain the conflict and propose a compliant alternative:

```md
这个修改暂时不能直接执行，因为它会和写作规范中的以下要求冲突：

- 冲突规范：
- 用户修改意见：
- 风险说明：

可以改成下面这个更符合规范的版本：

[替代写法]
```

## Quick Start

1. Create one output folder per article task under `outputs/<project_slug>/`.
2. Copy `templates/project_state_template.json` to `outputs/<project_slug>/project_state.json` and fill source paths.
3. Extract readable material with `scripts/extract_materials.py` when inputs include docx, xlsx, pdf, md, or txt.
4. Run exactly one phase at a time using the matching prompt in `prompts/`.
5. Generate a fixed writing checklist during Phase 0 from the writing standards. Phase 4 must only apply that checklist.
6. Stop after Phase 1 until the user explicitly approves the outline.
7. In Phase 2, let the Writing Model draft the first two H2 sections, then let the Auditor Model polish them into the final `02_first_two_sections.md`; auto-approve Phase 2 after success.
8. Run checklist validation before final delivery. Do not generate the final docx until checklist issues are fixed or explicitly marked as requiring user confirmation.
9. Keep the final visible article text within 1200-1600 words, following the length and density pattern of the provided example articles. Count the visible article body including headings, tables, and FAQ, but exclude SEO metadata, image planning files, prompts, and checklist reports.

## Source Placement

Prefer this project layout when the user has not specified paths:

```text
inputs/<project_slug>/writing_guidelines/
inputs/<project_slug>/examples/
inputs/<project_slug>/topic_requirements/
outputs/<project_slug>/
```

Existing files may also be used directly. For this workspace, common source types include:

- `writing_guidelines.docx`: writing guidelines and brand rules.
- `examples/*.docx`: style and structure examples only.
- `*.xlsx`: topic, keyword, and prompt requirements.

Never copy example article wording into a new article. Extract patterns only: heading hierarchy, opening style, transition style, paragraph length, product placement timing, FAQ style, and table usage.

## Phase Gates

Follow the phase order strictly:

| Phase | Output | Must Stop? | Gate |
| --- | --- | --- | --- |
| 0. Read materials and generate fixed checklist | `00_material_reading_summary.md`, `00_writing_checklist.md` | No | Auto-approve and continue |
| 1. Outline | `01_outline.md` | Yes | User approves outline |
| 2. First two H2 sections | `02_first_two_sections.md` | No | Writing draft plus Auditor polish, then auto-approve |
| 3. Full article | `03_full_article.md` | No | Continue to checklist |
| 4. Checklist report | `04_checklist_report.md` | No | Apply fixed checklist, then auto-approve |
| 5. Final delivery | `final_article_for_google_docs.docx` | Done | Final article file generated |

Hard gates:

- If `outline_confirmed` is false in `project_state.json`, do not draft body text.
- If Phase 2 has not produced the polished `02_first_two_sections.md`, do not complete the full article.
- If `checklist_passed` is false, do not generate the final docx.
- If the user asks to skip gates, remind them that this workflow is designed for human review. If they explicitly force continuation, keep Phase 4 checklist validation mandatory.
- Phase 4 must use the fixed `00_writing_checklist.md` from Phase 0. It must not generate a new checklist or alter checklist criteria during the audit.

## Writing Standards To Enforce

Extract the active standards from the provided guideline files for every project. Always combine them with `references/language_content_requirements.md`:

- Treat the language style keywords as general workflow rules.
- Treat the content specification keywords as current-product guidance only.
- For a different product, adapt content rules from that product's own writing guidelines instead of copying the current-product list mechanically.
- Optimize for Google AIO by using direct answer sentences, definitions, numbered steps, FAQ answers, and sourced data where available.
- Start by answering the reader's question. Do not open with template phrases like "In this article..."
- Start the final article file with `SEO Title`, `Description`, and `URL` metadata lines before the H1.
- Introduce the product only when the article context and active guidelines support it; do not force product placement into the opening.
- Use a natural, experience-sharing voice. Avoid academic, ad-like, speech-like, template, exaggerated, over-promising, or unsupported absolute wording.
- Keep the final article concise. Target 1200-1600 words; if the outline, user request, or model draft expands beyond that, compress repeated examples, generic advice, long transitions, and over-explained product details before adding new sections.
- Mention required product data naturally and accurately only when those data appear in the active guidelines.
- Cover required feature modules only when the guidelines require them, and place functions inside practical scenarios instead of listing features.
- Preserve exact product spelling and brand wording from the active guidelines.
- Enforce competitor rules, including any zero-tolerance banned competitor.
- Enforce public-relations red lines, prohibited terms, banned punctuation, and forbidden symbols exactly as extracted.

## Model And API Support

Do not hard-code API keys. If an automated model call is needed outside the Codex conversation, use environment variables or a local config handled by `scripts/model_provider.py`:

- `MODEL_PROVIDER`: `openai`, `anthropic`, `deepseek`, `qwen`, `doubao`, `xiaomi`, or `custom`.
- `MODEL_NAME`: required model name for the selected provider.
- `BASE_URL`: optional OpenAI-compatible endpoint.
- API keys use one canonical variable per provider: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `QWEN_API_KEY`, `DOUBAO_API_KEY`, `XIAOMI_API_KEY`, or `CUSTOM_API_KEY`.

Prefer any existing project model wrapper if one exists. Use the bundled provider helper only when the project has no model layer.

## Resource Map

- `workflow.md`: detailed Phase 0 to Phase 5 process.
- `prompts/phase0_read_materials.md`: material reading and rule extraction prompt.
- `prompts/phase0_generate_checklist.md`: fixed writing checklist generation prompt.
- `prompts/phase1_outline.md`: outline generation prompt.
- `prompts/phase2_first_two_sections.md`: first two H2 draft prompt.
- `prompts/phase2_auditor_polish.md`: Auditor Model polish prompt for Phase 2.
- `prompts/phase3_full_article.md`: full article prompt.
- `prompts/phase4_checklist.md`: checklist validation and revision prompt.
- `prompts/phase4_chunk_check.md`: lightweight per-chunk checklist audit prompt for long articles.
- `prompts/phase4_merge_checklist.md`: final report merge prompt for Phase 4 chunk reports.
- `prompts/phase5_final_delivery.md`: final article delivery prompt.
- `prompts/phase5_5_image_planning.md`: internal image planning prompt that uses the HelloTalk image planner skill after Phase 5 approval.
- `prompts/phase5_revise_article.md`: final article revision prompt after human review.
- `prompts/phase5_stabilize_revision.md`: stabilization pass after Phase 5 revision before rerunning Phase 4.
- `references/language_content_requirements.md`: general language style keywords and current-product content guidance.
- `templates/`: output templates for each phase.
- `scripts/extract_materials.py`: extract text from docx, xlsx, pdf, md, and txt into markdown.
- `scripts/generate_docx.py`: convert the final markdown article to a simple Google Docs-friendly docx.
- `scripts/model_provider.py`: optional environment-based model provider abstraction.
- `scripts/run_prompt.py`: optional command-line runner for prompt files and extracted materials.

## Phase Replies

After each phase, reply with the output file and the required next approval. Use the wording in `workflow.md` unless the user requested a different language or format.
