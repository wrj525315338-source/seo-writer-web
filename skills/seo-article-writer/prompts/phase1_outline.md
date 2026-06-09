# Phase 1 Prompt: Generate Chinese Review Outline

You are running Phase 1 of `$seo-article-writer`.

Use the approved Phase 0 material summary, writing guidelines, example article pattern analysis, topic requirements, and the provided outline template. Do not draft the article body.

## Absolute Language Rule

The outline is a planning document for the human user. It must be written in Chinese.

Do not output a full English outline, even when the final article language is English.

硬性要求：`01_outline.md` 必须是中文审阅版大纲。除关键词、标题候选、slug、Meta、产品名、功能名、术语和最终正文中必须保留的英文原文外，其余说明全部使用中文。

Only keep these necessary items in English:

- exact keywords
- SEO/GEO/AIO terms
- product names and feature names
- H1/H2/H3 candidate headings that will appear in the final article
- Title / Meta title / Meta description / URL slug options
- example phrases that may appear in the final article
- exact forbidden words, competitor names, brand data, and required wording

All explanations, section purposes, coverage notes, placement notes, table plans, FAQ answer angles, risk notes, and review instructions must be in Chinese.

## Required Output Sections

- 输出语言规则
- SEO 元信息
- 搜索意图
- 目标读者
- 关键词
- H1
- H2/H3 大纲结构
- 每个章节的写作目的
- 每个章节需要覆盖的内容
- 自然产品/工具植入位置
- 表格使用计划
- FAQ 计划
- 允许的内部/外部链接建议
- 需要避免的表达和风险

## Length Planning Rule

- 最终可见正文必须控制在 1200-1600 words，除非用户在本项目中给出更严格的范围。
- 计数范围包括 H1/H2/H3、正文段落、表格文字和 FAQ；不包括 SEO Title、Meta description、URL slug、prompt、checklist report、图片规划文件。
- 大纲必须给出“全文目标字数”和每个 H2/FAQ 的字数预算。预算合计必须落在 1200-1600 words。
- 参照示例文章的紧凑度：优先信息密度和具体动作，避免把一个点扩写成多个泛泛段落。
- 如果需要表格，表格应服务于压缩信息，而不是额外拉长文章。

## Writing Constraints

- Follow `templates/outline_template.md` closely.
- If the final article language is not Chinese, clearly state in Chinese that the Chinese notes are planning guidance only and the final article body should be written in the requested article language.
- Make the opening plan answer the search intent quickly.
- Keep product placement natural and delayed if the writing guidelines require it.
- Use direct-answer/AIO-friendly sentence plans for key sections.
- If secondary keywords are missing from the brief, generate a focused secondary keyword set during this outline phase based on the primary keyword, search intent, examples, and writing guidelines.
- Mark every place where the article should use a table. For each table, specify the intended section, table purpose, suggested column names, what content belongs in each row, and whether the table is required or optional.
- If no table is needed, explicitly write `表格计划：不建议使用表格` and briefly explain why.
- Do not include image descriptions, AI image prompts, image planning notes, image counts, image positions, visual types, markdown image syntax, `IMAGE_PLACEHOLDER`, or `[IMAGE_1]` style placeholders.
- Do not copy example wording.
- Enforce all forbidden words, symbols, competitor rules, brand data rules, and PR red lines.

## Output Rules

Write only the content of `01_outline.md`.

Do not include a preface such as "已生成大纲文件".

Do not wrap the output in a Markdown code block.

Stop after writing the outline. The user will review the Chinese outline before Phase 2.
