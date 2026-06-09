# Image Prompt Templates v2

Production-ready prompts for Codex / GPT-4o / DALL-E.

**Core philosophy change from v1**: Do NOT pick a layout template first. Instead, follow the three-step construction process below — Visual Concept → Language Aesthetic → Brand Application. This ensures each image has its own structural logic rather than all looking like variations of the same card grid.

---

## Current Default: Photorealistic HelloTalk Website/App Composite

This requirement overrides older flat-infographic examples in this file. Use older examples only for information architecture (comparison, timeline, cards, ranking), not for final rendering style.

Every new image prompt should specify:

- Photorealistic generated, non-identifiable adult language learner as the main human subject; natural expression, real-photo lighting, no celebrity, no public figure, no private person's likeness.
- Do not copy logos or wordmarks from reference images.
- Website hero composition similar to the provided reference: left-side headline/short chips, right-side learner holding or looking at a phone, a phone mockup with purple chat/voice UI elements, and soft white/lavender background.
- Purple `#5856D6` is the dominant brand color. Use purple chat bubbles, pill badges, rounded cards, curved purple footer/edge shapes, and subtle decorative geometry.
- Keep all visible text short and generic. Do not copy reference-image text, testimonials, unsupported claims, or exact UI copy. Do not invent product features.
- Do NOT include "HelloTalk" text, logo, or wordmark in the image. Use purple brand styling to convey brand identity without showing the brand name or icon.
- The image may include common conversation elements (chat bubbles, voice message chips, language exchange cards), but should not claim pixel-perfect UI unless a real screenshot is provided.

### Photorealistic Brand Composite Anchor (append to every prompt)

```
PHOTOREALISTIC WEBSITE STYLE: Create a bright real-photo marketing composite, not a flat-only infographic. Main subject is a generated, non-identifiable adult language learner in natural lifestyle photography, holding or looking at a smartphone with an optimistic expression. Do not depict a celebrity, public figure, influencer, or any real private person. Use soft daylight or bright studio lighting, shallow-but-readable depth of field, clean skin tones, and polished commercial photography.

BRAND REQUIREMENTS: Use Purple (#5856D6) as the dominant accent in chat bubbles, buttons, bottom wave/edge shape, pill badges, and rounded cards. Background should be white or very light lavender (#FAFAFE) with subtle purple decorative geometry. Do NOT include "HelloTalk" text, logo, or wordmark in the image.

COMPOSITION: Follow website/app marketing style: left-side headline area with short text chips, center/right photoreal learner, and a realistic phone mockup showing common language-exchange chat/voice elements in purple and white. Keep any UI generic and truthful; do not invent unsupported features, metrics, testimonials, or exact UI screens. Use rounded cards, filled pill badges, soft shadows, and compact article-specific takeaway chips.

AVOID: flat-only infographic output, cartoon characters, 3D render style, generic stock-photo cliches, unrelated logos, competitor UI, dark/moody palettes, excessive text, fake reviews, fake user data, unsupported product claims, and any text or logo that reads "HelloTalk".
```

---

## The Three-Step Prompt Construction Process

### Step 1: Select a Visual Concept (based on what the section is communicating)

The visual concept is the structural metaphor that makes this image immediately readable. Pick from the library below based on the section's core insight — not based on layout preference.

| Core insight type | Visual Concept | What it looks like |
|---|---|---|
| Things are ordered by magnitude/difficulty | **Gradient Scale** | A visual spectrum from easy to hard — could be a slope, stacked weight bars, or a depth/altitude metaphor |
| A process unfolds over time | **Journey Path** | A winding or flowing path with waypoints — not a straight line with circles |
| Two things are structurally different | **Split Contrast** | Left/right or top/bottom structural division with clear visual language for each side |
| A method has discrete stages | **Layered Architecture** | Stacked or nested blocks that imply build-up and dependency |
| Multiple options exist on axes | **Spatial Positioning** | A field or map where items are placed by their relationship to two axes |
| A gap or barrier exists | **Bridge / Divide** | Two zones separated by space — the gap itself is the subject |
| Something is surprisingly compact or large | **Scale Reveal** | A size comparison that reframes the reader's mental model |
| A system has interconnected parts | **Network / Web** | Nodes and connections — not a list, but a relational map |

**Rule**: The selected concept dictates the layout geometry. Do not force the concept into a card grid if the concept is a journey or a spectrum.

---

### Step 2: Apply a Language Aesthetic Layer (if the article targets a specific language/culture)

When the article is specifically about learning a target language, the image's visual language should echo that culture's design sensibility. This is a decorative and typographic layer on top of the visual concept — it does not override the concept.

**Japanese (日本語)**
- Composition: asymmetric, significant negative space, one focal object rather than grids
- Typography: high contrast between thin and bold weight — like brush + print
- Decorative elements: actual Kanji/Hiragana as large-scale graphic elements (e.g., 日, 語, 話 placed as subtle background geometry at 8-12% opacity)
- Color mood: HelloTalk Purple as primary, with softer secondary tones — avoid aggressive neon pink
- Feeling: precision, considered emptiness, calm authority

**Korean (한국어)**
- Composition: grid-logical, inspired by Hangul's block structure — elements snap to a visible underlying grid
- Typography: bold geometric contrast, strong hierarchies
- Decorative elements: Hangul syllable blocks (한, 글, 어) as background geometric shapes at 8% opacity
- Color mood: brand purple dominant + clean whites, bold color blocks for section headers
- Feeling: modern, systematic, K-design confidence

**Spanish (Español)**
- Composition: more dynamic — diagonal elements, flowing curves acceptable
- Typography: slightly larger, warmer — less cold-grid, more warmth
- Decorative elements: flowing arc lines, wave elements, warm geometric shapes
- Color mood: lean toward warmer accents (yellow and pink over cold blue-purple)
- Feeling: energy, warmth, motion

**German (Deutsch)**
- Composition: Bauhaus-inspired — strong geometric order, high contrast, systematic grids
- Typography: bold structure, no decorative excess
- Decorative elements: clean grid lines, precise geometric blocks
- Color mood: purple dominant, green for precision/correctness data, minimal accent use
- Feeling: rigor, reliability, structure

**Chinese/Mandarin (普通话)**
- Composition: balanced bilateral symmetry or clear center-anchored layout
- Decorative elements: Chinese characters as large calligraphic background shapes (汉, 语, 学 at 8% opacity)
- Color mood: allow a warm red-adjacent accent sparingly alongside brand purple for cultural resonance
- Feeling: harmony, balance, depth

**French (Français)**
- Composition: elegant proportions, generous margin, nothing cluttered
- Typography: slightly longer line lengths, refined hierarchy
- Decorative elements: subtle curved separator lines, refined geometric accents
- Color mood: brand purple + clean white dominant — minimal accent use
- Feeling: sophistication, clarity, refinement

**Arabic (العربية)**
- Composition: acknowledge right-to-left reading direction in layout flow
- Decorative elements: geometric interlocking patterns as background texture (inspired by Islamic geometric art) at 5% opacity
- Color mood: purple + gold-adjacent yellow for cultural resonance
- Feeling: geometric precision, cultural depth

**If no specific language** (general language learning, multilingual):
- Neutral composition — no single culture's aesthetic dominates
- Use multiple script samples as background decoration (one from each major script family)
- Clean, universal editorial style

---

### Step 3: Apply HelloTalk Brand

Once the visual concept and language aesthetic are chosen, apply the brand:

**Color application**:
- HelloTalk Purple `#5856D6` anchors the brand — use for the dominant structural element (the main bar, the path line, the central axis, the header band)
- Accent colors (Green `#34C759`, Pink `#FF2D92`, Yellow `#FFCC00`) differentiate data points — assign one per category/phase/zone
- Background: `#FAFAFE` or `#FFFFFF` — let the visual concept geometry provide the depth, not background color

**Visual richness layer** (apply to every image regardless of concept):
- Decorative geometry: 1-2 large partial circles at image corners, `#5856D6` at 5-8% opacity
- Left edge: 6-8px vertical `#5856D6` accent strip OR 32-40px purple footer band
- Category label: filled pill badge — `#5856D6` fill, white text, 20px corners
- Key data values: inside colored pill containers or bold-number callout backgrounds — never plain colored text
- Any card/block used: must have tinted fill (accent at 10-15% opacity) + flat line icon in header — not outline-only

---

## Brand Style Anchor (append to every prompt)

```
BRAND & STYLE: Use website/app marketing style. The main image should be photorealistic lifestyle photography of a generated, non-identifiable adult language learner using a smartphone, with a bright optimistic expression and polished commercial lighting. Purple (#5856D6) is the dominant accent color in chat bubbles, phone UI highlights, pill badges, curved bottom/edge shapes, and rounded cards. Background is white or very light lavender (#FAFAFE) with subtle purple decorative geometry. Add a realistic phone mockup showing generic language-exchange chat/voice elements; do not invent unsupported features, fake reviews, metrics, or exact UI claims. Use filled rounded cards, short text chips, soft shadows, and concise article-specific takeaways. AVOID: flat-only infographic output, cartoon characters, 3D render style, generic stock-photo cliches, unrelated logos, competitor UI, excessive text, dark/moody palettes, fake user data, unsupported product claims, and any text or logo that reads "HelloTalk" — use purple brand styling to convey brand identity without showing the brand name or icon.
```

---

## Worked Examples by Content Type

These examples demonstrate the three-step process in action. Notice each has a distinct structure — not variations of the same card grid.

---

### Example A: Difficulty Ranking (Gradient Scale concept + no specific language)

**Visual concept**: Gradient Scale — items are ranked by magnitude, the visual form itself encodes the hierarchy through weight and scale, not just bar length.

```
Create an infographic visualizing FSI language difficulty levels — 5 categories from easiest to hardest.

Visual concept: A GRADIENT SCALE — not a standard bar chart. Design this as a vertical slope or stepped-wedge shape where each row's visual weight physically increases from top to bottom. The hardest category (V) should feel heavy and wide; the easiest (I) should feel light and narrow. The entire composition reads as a single escalating form, not 5 separate bars.

Layout (16:9, 1600×900px):
- The slope/wedge occupies the right 65% of the image
- Left 35%: title section with category labels stacked vertically
- Each of the 5 tiers spans the full width of its wedge segment — width increases from ~25% to ~100%
- Row heights are equal but visual weight differs via fill density and label size

Tier treatment (top to bottom, lightest to heaviest):
Tier I — 600-750h — Spanish, French, Italian
  Color: Vibrant Green (#34C759), fill at 70% saturation
  Label pill: green fill, "TIER I · 600-750h" white text
  Feel: light, open, plenty of breathing room

Tier II — 900h — German
  Color: HelloTalk Purple (#5856D6)
  Label pill: purple fill, "TIER II · 900h" white text

Tier III — 1100h — Indonesian, Malay, Swahili
  Color: HelloTalk Purple (#5856D6), slightly deeper
  Label pill: purple fill

Tier IV — 1100h — Russian, Greek, Hebrew, Thai
  Color: Sunny Yellow (#FFCC00)
  Label pill: yellow fill, dark text

Tier V — 2200h — Arabic, Mandarin, Japanese, Korean
  Color: Bright Pink (#FF2D92), full saturation — this row is TWICE the visual weight of Tier I
  Label pill: pink fill, "TIER V · 2200h" white text
  The "2200h" appears in a large 44pt bold callout block on the right end with pink fill

Language names listed in small text inside each tier band (12pt, white)
Small flat clock icon (20px, white) before each label pill

Background:
- Left title zone: very light lavender (#FAFAFE)
- Right wedge zone: white
- Large partial circle at bottom-right: #5856D6 at 6% opacity
- Left edge: 6px #5856D6 vertical accent strip

Title area (left column):
- "COMPARISON" pill badge: #5856D6 fill, white text
- Title: "How long does it actually take?" — 30pt bold, #1C1C1E
- Subtitle: "FSI study hours by language difficulty" — 14pt, #6E6E73

BRAND & STYLE: Use website/app marketing style. The main image should be photorealistic lifestyle photography of a generated, non-identifiable adult language learner using a smartphone, with a bright optimistic expression and polished commercial lighting. Purple (#5856D6) is the dominant accent color in chat bubbles, phone UI highlights, pill badges, curved bottom/edge shapes, and rounded cards. Background is white or very light lavender (#FAFAFE) with subtle purple decorative geometry. Add a realistic phone mockup showing generic language-exchange chat/voice elements; do not invent unsupported features, fake reviews, metrics, or exact UI claims. Use filled rounded cards, short text chips, soft shadows, and concise article-specific takeaways. AVOID: flat-only infographic output, cartoon characters, 3D render style, generic stock-photo cliches, unrelated logos, competitor UI, excessive text, dark/moody palettes, fake user data, unsupported product claims, and any text or logo that reads "HelloTalk" — use purple brand styling to convey brand identity without showing the brand name or icon.
```

---

### Example B: Learning Milestones (Journey Path concept + Spanish aesthetic)

**Visual concept**: Journey Path — milestones are waypoints on a winding road, not circles on a straight horizontal line. The path itself communicates the sense of accumulating progress.

```
Create a milestone timeline infographic for Spanish language learning.

Visual concept: A JOURNEY PATH — a flowing road or winding path that moves from bottom-left to top-right of the image, with 4 milestone waypoints along it. The path metaphor communicates progress as a journey, not a factory assembly line. The path curves gently, like a road through a landscape.

Language aesthetic: Spanish — dynamic diagonal energy, warm color accents (lean toward yellow and pink), flowing curves. Slightly less rigid than a pure data chart.

Layout (16:9, 1600×900px):
- The path flows from bottom-left (start) to upper-right (fluency), curving twice
- 4 circular waypoint markers on the path, increasing in size from start to end (24px → 32px → 40px → 52px), each in a different accent color
- Each waypoint has a callout card branching off to the side (alternating: left, right, left, right)
- The path line is HelloTalk Purple (#5856D6), 6px stroke, slightly rounded

Path and waypoints:
Waypoint 1 (bottom-left, smallest) — Green (#34C759):
  - Circle: filled green, white "1" inside
  - Callout card (left side): green tinted fill (#34C759 at 12%), header strip in green
    - Header: clock icon + "2 MONTHS" white
    - Body: "Survival basics" bold green / "Greetings, food, directions" #1C1C1E 13pt

Waypoint 2 — Purple (#5856D6):
  - Circle: filled purple, white "2"
  - Callout card (right side): purple tinted fill
    - Header: speech bubble icon + "6 MONTHS" white
    - Body: "Daily comfort" bold purple / "Routine chats, familiar topics"

Waypoint 3 — Yellow (#FFCC00):
  - Circle: filled yellow, dark "3"
  - Callout card (left side): yellow tinted fill
    - Header: star icon + "12 MONTHS"
    - Body: "Independent use" / "Longer conversations, repair strategies"

Waypoint 4 (top-right, largest, glowing) — Pink (#FF2D92):
  - Circle: filled pink, white "4", slightly larger with a soft glow ring
  - Callout card (right side): pink tinted fill
    - Header: flag icon + "18 MONTHS" white
    - Body: "Fluency track" bold pink / "Confident speech at work and travel"

Background:
- A very faint warm arc shape sweeping from bottom to top-right: #FFCC00 at 4% opacity — echoes the journey energy
- Large partial circle at top-right: #5856D6 at 6% opacity
- Left edge: 6px #5856D6 accent strip

Title section (top-left):
- "MILESTONE TIMELINE" pill badge: #5856D6 fill, white
- Title: "Spanish learning milestone timeline" — 30pt bold, #1C1C1E

BRAND & STYLE: Use website/app marketing style. The main image should be photorealistic lifestyle photography of a generated, non-identifiable adult language learner using a smartphone, with a bright optimistic expression and polished commercial lighting. Purple (#5856D6) is the dominant accent color in chat bubbles, phone UI highlights, pill badges, curved bottom/edge shapes, and rounded cards. Background is white or very light lavender (#FAFAFE) with subtle purple decorative geometry. Add a realistic phone mockup showing generic language-exchange chat/voice elements; do not invent unsupported features, fake reviews, metrics, or exact UI claims. Use filled rounded cards, short text chips, soft shadows, and concise article-specific takeaways. AVOID: flat-only infographic output, cartoon characters, 3D render style, generic stock-photo cliches, unrelated logos, competitor UI, excessive text, dark/moody palettes, fake user data, unsupported product claims, and any text or logo that reads "HelloTalk" — use purple brand styling to convey brand identity without showing the brand name or icon.
```

---

### Example C: Two-Sided Comparison (Split Contrast concept)

**Visual concept**: Split Contrast — the two sides have fundamentally different visual grammar. Not two identical columns of text. The visual form enacts the difference.

```
Create an infographic showing the gap between solo study and real conversation practice.

Visual concept: BRIDGE / DIVIDE — the image is split into two zones by a visible gap in the center. Left zone is "Solo Study" — structured, contained, slightly cool. Right zone is "Real Conversation" — open, warmer, more dynamic. The gap itself is the subject. A thin bridge element crosses the gap to imply how the transition happens.

Layout (16:9, 1600×900px):
Left zone (45% of width) — "Solo Study":
  - Background: very light lavender (#F5F4FA), slightly cool
  - Zone header: filled purple bar across the top — "SOLO STUDY" in white 13pt bold
  - 3 content chips inside (each: white fill, 1px #E5E5EA border, 4px corners):
    1. Book icon + "Vocabulary" + "Grammar, lists, patterns"
    2. Headphone icon + "Listening" + "Podcasts, audio courses"
    3. Pencil icon + "Reading" + "Texts, structured input"
  - Bottom of this zone: large bold number "600+" with green pill badge label "hours of input possible"

Center gap (10% of width):
  - Narrow vertical void, background: white
  - A simple horizontal arrow bridge crossing the middle of the gap: #5856D6, 3px stroke, arrowhead right
  - Small pill badge on the bridge: #5856D6 fill, white "The gap" 11pt

Right zone (45% of width) — "Real Conversation":
  - Background: very light pink (#FF2D92 at 5% opacity), slightly warm
  - Zone header: filled pink bar — "REAL CONVERSATION" in white 13pt bold
  - 3 content chips:
    1. Speech bubble icon + "Recall under pressure" + "Words when you actually need them"
    2. Lightning icon + "Repair strategies" + "Handling breakdowns live"
    3. Person silhouette icon + "Cultural signals" + "Tone, pace, native rhythm"
  - Bottom: large bold "?" with pink pill badge "the skills solo study can't build alone"

Below the two zones:
  - A centered callout band (full width, #5856D6 at 8% fill, 8px corners):
    "The gap isn't knowledge — it's activation. Real exchanges close it."
    — 14pt #1C1C1E, center-aligned

Title (above the two zones):
  - "FRAMEWORK DIAGRAM" pill badge
  - "The gap between solo study and real conversation" — 30pt bold

BRAND & STYLE: Use website/app marketing style. The main image should be photorealistic lifestyle photography of a generated, non-identifiable adult language learner using a smartphone, with a bright optimistic expression and polished commercial lighting. Purple (#5856D6) is the dominant accent color in chat bubbles, phone UI highlights, pill badges, curved bottom/edge shapes, and rounded cards. Background is white or very light lavender (#FAFAFE) with subtle purple decorative geometry. Add a realistic phone mockup showing generic language-exchange chat/voice elements; do not invent unsupported features, fake reviews, metrics, or exact UI claims. Use filled rounded cards, short text chips, soft shadows, and concise article-specific takeaways. AVOID: flat-only infographic output, cartoon characters, 3D render style, generic stock-photo cliches, unrelated logos, competitor UI, excessive text, dark/moody palettes, fake user data, unsupported product claims, and any text or logo that reads "HelloTalk" — use purple brand styling to convey brand identity without showing the brand name or icon.
```

---

### Example D: Feature Cards for a Specific Language (Layered Architecture + Japanese aesthetic)

**Visual concept**: Layered Architecture — difficulty is built from stacked layers of challenge, each adding to the one below. Implies dependency and accumulation.

```
Create an infographic showing the 3 core difficulty factors in learning Japanese.

Visual concept: LAYERED ARCHITECTURE — the 3 difficulty factors are shown as building layers stacked vertically, each resting on the foundation of the one below. The bottom layer is the biggest/most fundamental; the top is the final challenge. This communicates that mastery requires building from the base up.

Language aesthetic: Japanese — asymmetric composition with intentional negative space on the right. Use actual Japanese characters (hiragana, katakana, kanji: あ, ア, 漢) as large-scale graphic elements in the background at 8% opacity. High contrast between very light and very bold elements. Quiet authority.

Layout (16:9, 1600×900px):
Left ~60%: the stacked architecture diagram
Right ~40%: title area + large Japanese character as background graphic

Stacked layers (bottom to top, each narrower):
Layer 1 (bottom, widest, most fundamental) — WRITING SYSTEMS:
  - Width: 80% of left zone
  - Height: 36% of diagram height
  - Fill: HelloTalk Purple (#5856D6) at 15%
  - Left-edge accent: full-height solid #5856D6 bar (8px)
  - Icon: 20px character/writing icon (purple)
  - Header: "WRITING SYSTEMS" white text on #5856D6 header strip (36px)
  - Content: "3 scripts · Hiragana · Katakana · Kanji"
  - Large number callout: "2,136" — pill badge in purple — "standard kanji characters"
  - Background decorative: small あ and ア characters in #5856D6 at 10% opacity

Layer 2 (middle) — GRAMMAR STRUCTURE:
  - Width: 65% of left zone (narrower to show it rests on layer 1)
  - Height: 30% of diagram height
  - Fill: Yellow (#FFCC00) at 12%
  - Header strip: #FFCC00 at 35%, "GRAMMAR STRUCTURE" dark text
  - Content: "SOV word order · Particles · Honorific levels"

Layer 3 (top, narrowest) — READING FLUENCY:
  - Width: 50% of left zone
  - Height: 26% of diagram height
  - Fill: Pink (#FF2D92) at 10%
  - Header strip: #FF2D92 at 35%, "READING FLUENCY" white text
  - Content: "Combining all 3 scripts in real text"

Connecting element: a subtle vertical spine line on the left edge of all 3 layers, #5856D6 2px

Right zone (40%):
  - Title area: "LANGUAGE LEARNING" pill badge + "3 core difficulty factors in Japanese" 28pt bold
  - Large background character: 漢 — 220pt, #5856D6 at 8% opacity, positioned center-right
  - At bottom-right: a small row of script samples (あ ア 漢 一 二 三) in 14pt, #6E6E73

Background:
  - Overall: white, airy
  - Subtle partial circles: top-right and bottom-left, #5856D6 at 5%
  - Left edge: 6px #5856D6 vertical strip

BRAND & STYLE: Use website/app marketing style. The main image should be photorealistic lifestyle photography of a generated, non-identifiable adult language learner using a smartphone, with a bright optimistic expression and polished commercial lighting. Purple (#5856D6) is the dominant accent color in chat bubbles, phone UI highlights, pill badges, curved bottom/edge shapes, and rounded cards. Background is white or very light lavender (#FAFAFE) with subtle purple decorative geometry. Add a realistic phone mockup showing generic language-exchange chat/voice elements; do not invent unsupported features, fake reviews, metrics, or exact UI claims. Use filled rounded cards, short text chips, soft shadows, and concise article-specific takeaways. AVOID: flat-only infographic output, cartoon characters, 3D render style, generic stock-photo cliches, unrelated logos, competitor UI, excessive text, dark/moody palettes, fake user data, unsupported product claims, and any text or logo that reads "HelloTalk" — use purple brand styling to convey brand identity without showing the brand name or icon.
```

---

## Template 3: UI Screenshot Modified (unchanged from v1)

**Critical**: Always reference an actual UI asset from `assets/ui-screenshots/`. Never generate a fake UI from scratch.

```
I will provide a real app UI screenshot as the base. Keep the UI elements (buttons, layout, brand purple #5856D6, fonts) EXACTLY the same — do not redesign or restyle.

Only modify:
- Partner name, location, bio/tags
- Avatar: flat illustration-style only (NOT a real photo)
- Chat message bubbles
- Timestamps (update to recent)

DO NOT add non-existent features. DO NOT add "HelloTalk" text, logo, or wordmark. DO NOT modify the color scheme.
Output: high-fidelity PNG, 9:16 mobile ratio.
```

---

## Prompt Construction Checklist

Before delivering any prompt, verify:

```
□ Visual concept selected from the library (not "picked a card grid template")
□ Visual concept matches what the section is actually communicating
□ Language aesthetic layer applied (if article targets a specific language)
□ Layout geometry flows from the concept — different content types look structurally different
□ Brand anchor appended at end
□ Key data values in pill containers (not plain colored text)
□ Filled card/block backgrounds (not outline-only)
□ Background geometry layer specified
□ Brand presence element specified (left strip or footer band)
□ Category label is a filled pill badge
```

---

## Color Quick Reference

```
DOMINANT:    HelloTalk Purple #5856D6
BACKGROUND:  #FAFAFE or #FFFFFF + subtle geometry at 5-8% opacity
ACCENTS:     Green #34C759 · Pink #FF2D92 · Yellow #FFCC00
TEXT:        Dark #1C1C1E · Secondary #6E6E73
AVOID:       Blue, coral, orange, moody/dark, 3D, outline-only boxes
```
