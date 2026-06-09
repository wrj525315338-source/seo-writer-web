# Phase 0 Prompt: Generate Writing Checklist

You are still running Phase 0 of `$seo-article-writer`.

Use the extracted writing guidelines, example article pattern analysis, topic brief, language/content requirements reference, and Phase 0 material summary to create a fixed checklist for this project. This checklist will be used later by the Phase 4 Auditor Model. Do not draft the article body.

## Required Work

Create a project-specific checklist based on the writing standards and task requirements. The checklist must be concrete enough that another model can apply it mechanically in Phase 4.

Include:

- hard writing rules from the guidelines
- structure and heading rules
- required top metadata block: `SEO Title`, `Description`, and `URL` before the H1
- SEO/GEO/AIO requirements
- direct-answer and FAQ requirements
- keyword usage requirements
- forbidden words, expressions, punctuation, symbols, and competitors
- brand spelling, brand data, product modules, and product placement rules
- PR red lines and zero-tolerance issues
- table/list formatting requirements
- final visible article length: 1200-1600 words unless the user gives a stricter project-specific range
- source/evidence requirements and uncertain-claim handling
- Google Docs / final formatting requirements
- language style requirements from `language_content_requirements.md`
- current-product content requirements from `language_content_requirements.md`, adapted through the active product writing guidelines

## Checklist Format

Write the checklist in Chinese for readability, while preserving exact English terms, product names, keywords, banned expressions, and wording that must be checked verbatim.

The language style keywords are general style requirements. The content specification keywords are only product-context guidance for the current product/article type; if another product's writing guidelines provide different content rules, the checklist must follow that product's writing guidelines.

Use stable item IDs so Phase 4 can cite them:

```md
# Writing Checklist

## 使用说明

- 本 checklist 在 Phase 0 根据写作规范、示例文章模式和本次 brief 固定生成。
- Phase 4 只能调用并逐项审查本 checklist，不得临时新增、删除或重写 checklist 标准。
- 如果正文存在不确定事实，必须标记为 `需要用户确认` 或移除。

## C01 Structure And Search Intent

- [ ] C01-01 ...
- [ ] C01-02 ...

## C02 SEO / GEO / AIO

- [ ] C02-01 ...

## C03 Brand And Product Rules

- [ ] C03-01 ...

## C04 Forbidden / Risk Rules

- [ ] C04-01 ...

## C05 Formatting, Tables, And Final Delivery

- [ ] C05-01 ...
- [ ] C05-02 Final visible article text is 1200-1600 words, counting headings, body, tables, and FAQ, but excluding SEO metadata, prompts, checklist reports, and image planning files.
```

Do not create checklist items that require image placeholders, image descriptions, AI image prompts, image counts, image positions, or markdown image syntax in Phase 1 through Phase 5. Image requirements are handled later by the internal Phase 5.5 image planner.

## Output

Write `00_writing_checklist.md`.

Stop after writing the checklist.
