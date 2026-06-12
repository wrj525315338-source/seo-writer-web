# Phase 0 Prompt: Cluster Brief — Read Materials And Generate Shared Checklist

You are running Phase 0 of a **cluster writing project** that will produce multiple related articles.

Read the provided cluster brief, writing guidelines, example articles, and the cross-link plan. Do not draft outlines or articles in this phase.

## Inputs To Use

- Cluster brief text:
- Writing guideline text:
- Example article text:
- Cross-link plan text:
- Existing `cluster_state.json`, if available:

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
3. Extract the cluster-level requirements:
   - cluster name and brand
   - number of articles and their roles (pillar / support)
   - keywords for each article
   - cross-link rules and requirements
   - collision warnings with existing articles
   - special requirements (banned competitors, required modules, brand data)
4. Identify potential risks before outlining.
5. Extract enough checklist source material for the shared checklist file.

## Cluster-Specific Requirements

This is a cluster project with multiple related articles. Your outputs must account for:

- **Shared checklist**: The checklist will be used across ALL articles in the cluster. Word count ranges vary by article type (guide: 2500-3500, app_list: 2000-2500, how_to: 2000-2800). Do NOT hardcode a single word count range.
- **Cross-link requirements**: Each article must contain 3-5 internal links to other articles in the cluster, with at least 1 back-link to the pillar article.
- **Article type differences**: Different article types have different structural requirements (e.g., app_list articles need a comparison table at the top).

## Output

Write `00_shared_material_summary.md` using the material reading summary template, adapted for cluster mode. Include:
- Cluster overview (articles, roles, keywords)
- Extracted writing rules (shared across all articles)
- Brand requirements
- Cross-link requirements
- Collision warnings and risks

After the summary is written, also generate `00_shared_writing_checklist.md` from the writing standards. The checklist must include:

- All standard checklist items (C01-C05) adapted for variable word counts
- A new C06 section for cross-link requirements:
  - C06-01: Each article contains 3-5 internal links
  - C06-02: Each article has at least 1 link to the pillar article
  - C06-03: Anchor text matches the cross-link plan
  - C06-04: Links are naturally integrated into the content
  - C06-05: No "click here" style anchor text

Stop after Phase 0 outputs are complete.
