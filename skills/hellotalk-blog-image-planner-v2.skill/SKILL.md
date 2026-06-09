---
name: hellotalk-blog-image-planner-v2
description: Plan and generate AI image prompts for HelloTalk blog articles. Use this skill whenever the user has a finished blog article and needs to (1) identify where images should be inserted, (2) generate detailed AI-image-generation prompts for each slot, and (3) decide whether to use HelloTalk UI-based screenshots or pure infographics. Trigger whenever the user mentions blog images, article illustrations, image prompts, Codex/GPT image generation for blog posts, or wants to add visuals to a HelloTalk SEO/GEO article. Also trigger if the user shares a blog post markdown file and asks "where should images go" or "give me image prompts" or "generate visuals for this article."
---

# HelloTalk Blog Image Planner v2

A skill for planning image placement and generating production-ready AI image prompts for HelloTalk blog articles. v2 uses HelloTalk's website/app marketing style: photorealistic generated learners, phone mockups, purple chat/UI overlays, rounded cards, and bright white/lavender brand layouts.

## When to Use This Skill

Trigger this skill when:
- User shares a finished blog article (markdown) and asks for image suggestions
- User says things like "where should I add images", "generate image prompts", "give me prompts for Codex"
- User wants to add visuals to an existing HelloTalk article
- User is preparing a batch of articles and needs consistent image planning

## Core Philosophy

HelloTalk blog images must follow four principles:

1. **Photorealistic, but not generic stock**: Use generated, non-identifiable adult learners in bright real-photo style. Avoid public figures, celebrities, real private people, and generic stock-photo cliches.
2. **HelloTalk brand feel through visual language**: Use HelloTalk's purple website/app visual language, phone mockups, chat bubbles, and rounded UI cards.
3. **Website style + article value**: Combine real-photo lifestyle energy with useful article-specific overlays: phone mockups, purple chat bubbles, rounded cards, short chips, and concise visual takeaways.
4. **No fake features or unsupported claims**: Phone/UI elements may show common HelloTalk-like conversation patterns, but must not invent product features, metrics, testimonials, or unsupported promises.

## The 3-Stage Workflow

### Stage 1: Analyze the Article

Read the full article markdown. Identify:
- Article type (Pillar / Support article / GEO / SEO)
- Target word count vs actual
- HelloTalk mention positions (mark them on a mental map)
- Existing image references (if any)
- Article structure (number of H2 sections)

Output a brief structural summary before recommending images.

### Stage 2: Decide Image Slots

Apply these allocation rules:

**Article length-based limits:**
- 2000-2500 words → maximum 2 images
- 2500-3500 words → maximum 2-3 images
- 3500+ words (Pillar) → maximum 3-4 images

**Position rules:**
- Image 1: ALWAYS at article opening (hero position) → MUST be a `photo-hero-composite` in HelloTalk website style
- Image 2: Mid-article, at a framework/concept explanation point → use `photo-ui-composite` or `photo-learning-scene`
- Image 3 (if used): Late article, before action plan → use the same photorealistic website style with a phone mockup and concise takeaway cards
- ⚠️ NEVER place images within 100 words before/after a HelloTalk mention (avoid visual marketing reinforcement)
- ⚠️ NEVER place images directly before the final CTA paragraph

**Image type allocation guidance:**

| Article type | Recommended mix |
|---|---|
| Pillar (3500+ words) | 1 photo hero composite + 1 photo UI composite + 1 article-specific photo learning scene |
| SEO support (2500-2800 words) | 1 photo hero composite + 1 photo UI composite |
| GEO product-focused | 1 photo hero composite + 2 photo UI composites |
| Pure technical/educational | 1 photo hero composite + 1 photo learning scene with data/card overlays |

### Stage 3: Generate Image Prompts

For each image slot, follow the three-step construction process from `references/prompt-templates.md`:

**Step A — Select a Visual Concept** based on what the section is communicating:
- Magnitude/difficulty ranking → Gradient Scale (escalating wedge, not equal bars)
- Process over time → Journey Path (winding road with waypoints, not circles on a line)
- Two things structurally different → Split Contrast / Bridge Divide
- Stages that build on each other → Layered Architecture (stacked, dependency implied)
- Multiple options on axes → Spatial Positioning (field/map)
- Interconnected parts → Network / Web

**Step B — Apply Language Aesthetic Layer** (if article targets a specific language):
- Japanese: asymmetric, significant negative space, actual Kanji/Hiragana at 8% opacity as background
- Korean: grid-logical layout, Hangul block structure aesthetic, bold geometric contrast
- Spanish: dynamic diagonals, flowing curves, warmer accent emphasis (yellow/pink)
- German: Bauhaus-inspired, strict geometric order, no decorative excess
- Chinese: balanced symmetry, Chinese characters as calligraphic background shapes
- French: elegant proportions, generous margin, refined hierarchy
- Arabic: geometric interlocking pattern texture at 5% opacity, right-to-left flow awareness
- General: neutral editorial, multi-script background samples

**Step C — Apply HelloTalk Brand**: Purple #5856D6 dominant, purple chat bubbles, rounded phone mockup, filled pill badges/cards, soft white/lavender website background, and subtle decorative geometry.

Then deliver the complete prompt package:
1. **Image slug**: short filename
2. **Insertion marker**: exact line in the article
3. **Image type**: `photo-hero-composite` | `photo-ui-composite` | `photo-learning-scene` | `ui-screenshot-modified`
4. **Visual concept chosen**: one line stating which concept and why
5. **Language aesthetic**: which culture aesthetic applied (or "neutral")
6. **Codex/GPT prompt**: complete production-ready prompt
7. **Alt text**: SEO-optimized

## Image Type Decision Tree

When deciding which type to recommend for a slot, follow this tree:

```
Is this the opening image?
├─ YES → Use photo-hero-composite (photoreal learner + brand icon + phone mockup)
└─ NO → Continue
   Is the section explaining product mechanics or conversation practice?
   ├─ YES → Use photo-ui-composite (photoreal learner + phone mockup + purple chat/UI overlay, no brand name/icon)
   └─ NO → Continue
      Is the section explaining a framework, timeline, or comparison?
      ├─ YES → Use photo-learning-scene with compact cards/chips over the photo, no brand name/icon
      └─ NO → Skip the image unless the user explicitly requested a higher image count
```

## Quality Checklist (run for every plan before delivering)

Before outputting the final plan, verify:

```
□ Total images ≤ article-length-based limit
□ Image 1 at hero position is a photorealistic HelloTalk brand composite
□ No image within 100 words of HelloTalk mentions
□ No image immediately before final CTA
□ Every image uses a generated, non-identifiable adult learner in real-photo style
□ Phone/UI elements avoid unsupported product features or claims
□ All alt text contains target keywords naturally
□ Each prompt includes style, dimensions, color palette
□ No image depicts a real public figure, celebrity, influencer, or identifiable private person
□ No image fakes non-existent features
□ No image contains "HelloTalk" text, logo, or wordmark (brand identity conveyed through purple #5856D6 styling only)
□ [v2] Card backgrounds are filled/tinted, not outline-only
□ [v2] Key data values use pill badges or visual containers, not plain colored text
□ [v2] Background has subtle decorative geometry layer
□ [v2] No grid layout leaves an orphaned single card in the bottom row
□ [v2] No section of the image exceeds 15% blank unused space
```

## Reference Files

For detailed guidance, read these files when needed:

- `references/prompt-templates.md` — Production-ready prompt templates for each image type, including Codex-optimized prompts with style anchors
- `references/ui-screenshot-guide.md` — How to use the bundled UI screenshots; rules for content modification; safety/compliance boundaries
- `references/style-guide.md` — HelloTalk brand visual identity: colors, typography, illustration style, and v2 visual richness layer
- `assets/ui-screenshots/` — Library of real HelloTalk UI screenshots to reference for `ui-screenshot-modified` type images

## Output Format

For each image slot, output in this structure:

```markdown
### 📍 Image Slot #N

**Insertion Location**: After the line "..." in section "H2: ..."

**Slug**: `image-filename`

**Type**: `photo-hero-composite` | `photo-ui-composite` | `photo-learning-scene` | `ui-screenshot-modified`

**[If UI screenshot]** Source UI: `assets/ui-screenshots/chat-interface.png`

**Codex/GPT Prompt**:
```
[Complete production-ready prompt here, multi-line OK]
```

**Alt Text**: `[SEO-optimized alt text]`

**Why here**: [1-2 sentence rationale]
```

## Communication Style

When working with the user:
- Show the structural analysis first, then recommendations
- If the user already has draft images, point out which ones violate the rules (most common: flat infographic style when the current requirement is photorealistic website/app style, missing phone mockup/brand-purple UI treatment, or image too close to HelloTalk mention)
- For each image plan, briefly explain the rationale (this helps the user learn the pattern)
- Be specific in prompts — vague prompts like "language learning scene" produce vague output

## Common Patterns by Article Type

**N-series support articles (N2-N6 in current D2 cluster)**:
- 2 images total
- Hero: photoreal generated learner using phone, phone mockup, purple chat overlays
- Mid: photoreal phone/UI composite showing the relevant practice mode through common chat/voice/card elements

**Pillar articles (N1-style)**:
- 3-4 images total
- Hero: comprehensive photoreal brand composite
- 2 mid: section-specific photo UI composites with concise cards/chips
- 1 optional: real UI screenshot modification if a suitable asset exists

**Avoid these common mistakes**:
- ❌ Decorative AI scene art without HelloTalk app context
- ❌ Generic stock-photo-style "young professional with headphones"
- ❌ Voice/chat/exchange themed scene art near HelloTalk mentions
- ❌ Using more than 3 images in a 2500-word article
- ❌ Prompts missing the phone mockup, brand-purple UI treatment, or real-photo learner
- ❌ [v2] Plain outline boxes with no background fill
- ❌ [v2] Key data as plain colored text without a visual container
- ❌ [v2] Entirely white/blank backgrounds with no decorative geometry layer
- ❌ Images containing "HelloTalk" text, logo, or wordmark (brand identity must be conveyed through purple #5856D6 styling, chat bubbles, and UI elements only)
