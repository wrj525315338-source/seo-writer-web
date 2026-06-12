# Phase 1b Prompt: Cross-Link Plan Refinement

You are running Phase 1b of a cluster writing project. Your job is to refine the cross-link plan based on the approved article outlines.

## Inputs

- Article outlines (one per article in the cluster)
- Initial cross-link plan (from the cluster brief)
- Writing guidelines summary

## Required Work

1. Read each article's approved outline. Focus on the "链接建议" (link suggestions) section of each outline.

2. For each cross-link rule in the initial plan:
   - Verify the source article's outline has a suitable section for placing the link
   - Determine the precise placement: which H2 section, after which paragraph or sentence
   - Verify the anchor text is natural and uses keyword variants (not identical across all links)
   - If the placement is not viable, suggest an alternative location

3. Check link balance:
   - Each article should have 3-5 internal links
   - Each support article must have at least 1 link to the pillar
   - The pillar should link to each support article at least once
   - Avoid overloading any single section with too many links

4. Check anchor text diversity:
   - No two links should use identical anchor text
   - Anchor text should be descriptive phrases, not "click here"
   - Use keyword variations and natural phrases

5. Output the refined cross-link plan as a markdown table with these columns:
   - Source Article (slug)
   - Target Article (slug)
   - Anchor Text (exact text to use)
   - Placement (which H2, after which paragraph/sentence)
   - Direction (unidirectional or bidirectional)

## Output Format

Write the refined cross-link plan as `00_cross_link_plan.md` in the cluster outputs directory.

```markdown
# Refined Cross-Link Plan

## Link Summary

| Article | Outgoing Links | Incoming Links | Back to Pillar |
|---------|---------------|----------------|----------------|
| /slug-1 | 3             | 2              | N/A (is pillar)|
| /slug-2 | 3             | 3              | ✓              |

## Detailed Link Plan

| Source | Target | Anchor Text | Placement | Direction |
|--------|--------|-------------|-----------|-----------|
| /pillar-slug | /support-a-slug | descriptive anchor | H2-2, after paragraph 2 | unidirectional |
| /support-a-slug | /pillar-slug | descriptive anchor | H2-1, opening paragraph | unidirectional |
...

## Anchor Text Diversity Check

- [ ] No duplicate anchor texts across the entire plan
- [ ] All anchor texts are descriptive phrases
- [ ] Keyword variations are used naturally

## Placement Quality Check

- [ ] No section has more than 2 internal links
- [ ] Links are contextually relevant to their surrounding content
- [ ] Links add value to the reader's journey
```

Stop after writing the refined cross-link plan.
