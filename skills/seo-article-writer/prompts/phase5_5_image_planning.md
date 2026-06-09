# Phase 5.5 Prompt: HelloTalk Image Planning

You are running the internal `phase5_5_image_planning` step after Phase 5 final article confirmation.

Use the provided finished article and the `hellotalk-blog-image-planner-v2` skill materials. This is the first step in the workflow that may plan images.

## Required Work

Read the complete final article Markdown first, then create a production image plan that follows the HelloTalk blog image planner rules.

If an `Image Style Reference Examples` input is provided, use those examples as visual style and composition references. Do not copy exact artwork, visible text, UI copy, logos, wordmarks, or unsupported claims from the examples. Convert reusable traits into concrete prompt language: photorealistic generated learner, bright website hero composition, brand-purple emphasis, soft lavender/white backgrounds, phone mockups, chat bubbles, rounded cards, and article-specific composition. If any reference example conflicts with the active image policy, the active policy wins.

You must:

- identify article type: `Pillar`, `Support article`, `GEO`, or `SEO`
- count actual words
- list H2 sections
- list HelloTalk mention positions with approximate word index and nearby text
- identify the final CTA position
- decide image count by article length and content need; do not force 3 images
- make `IMAGE_1` a `photo-hero-composite` in the opening hero position, visually close to the HelloTalk website/app marketing style
- place `IMAGE_2` at a mid-article framework or concept explanation point when useful; use `photo-ui-composite` or `photo-learning-scene`, not a flat-only infographic
- place `IMAGE_3` only if needed, before an action plan, and keep the same photorealistic website hero / phone mockup style
- avoid placing images within 100 words before or after a HelloTalk mention
- avoid placing images directly before the final CTA paragraph
- prefer `photo-hero-composite`, `photo-ui-composite`, and `photo-learning-scene`
- every prompt must use a photorealistic generated, non-identifiable adult learner as the human subject; do not depict a real public figure, celebrity, influencer, or any private person
- every prompt must include a phone mockup or app-card element with brand-consistent visual style (purple #5856D6, chat bubbles, rounded cards); do not invent unsupported features, metrics, testimonials, or claims; do NOT include "HelloTalk" text, logo, or wordmark in any image — use purple brand styling to convey brand identity without showing the brand name or icon
- avoid generic AI scene art, generic stock-photo clichés, flat-only infographics, unrelated logos, fake competitor UI, and large visible text beyond short headline/chip labels
- include HelloTalk brand visual identity in every prompt: `purple #5856D6`, soft white/lavender background, rounded UI cards, pill badges or visual containers, purple chat bubbles, and subtle decorative geometry layer
- incorporate relevant style cues from the image reference examples into each prompt as explicit visual instructions; do not merely say "refer to the example image"
- make every alt text naturally include the target keyword or a relevant SEO keyword

If a real UI screenshot is not available, use a `photo-ui-composite` with a generic phone mockup that shows only common HelloTalk-like conversation elements (chat bubbles, voice/message controls, language-learning cards). Do not claim exact pixel-perfect UI or add unsupported product features.

## Output

Write only valid JSON. Do not wrap it in Markdown fences.

Use exactly this top-level structure:

{
  "article_summary": {
    "article_type": "SEO",
    "target_word_count": "",
    "actual_word_count": 0,
    "h2_sections": [],
    "hellotalk_mentions": [
      {
        "section": "",
        "word_index": 0,
        "nearby_text": ""
      }
    ],
    "final_cta_position": {
      "section": "",
      "word_index": 0
    }
  },
  "images": [
    {
      "id": "IMAGE_1",
      "slug": "",
      "type": "photo-hero-composite",
      "insertion_marker": "[IMAGE_1]",
      "insert_after_text": "",
      "insert_before_heading": "",
      "source_ui": null,
      "visual_concept": "",
      "language_aesthetic": "",
      "prompt": "",
      "alt_text": "",
      "why_here": "",
      "style_reference_examples": [],
      "nearest_hellotalk_mention_distance_words": 0,
      "policy_notes": {
        "not_near_hellotalk_mention": true,
        "not_before_final_cta": true,
        "not_generic_scene_art": true,
        "hero_is_photorealistic_brand_composite": true,
        "uses_generated_non_identifiable_person": true,
        "no_fake_features": true,
        "uses_brand_visual_style": true
      }
    }
  ],
  "policy_check": {
    "total_images_allowed": true,
    "hero_is_photorealistic_brand_composite": true,
    "no_image_near_hellotalk_mentions": true,
    "no_image_before_final_cta": true,
    "no_generic_scene_art": true,
    "all_images_use_photorealistic_generated_people": true,
    "all_alt_text_has_keywords": true,
    "no_fake_features": true,
    "ui_screenshot_sources_valid": true,
    "ready_for_generation": true
  }
}

Do not include an empty `IMAGE_3` if the article only needs two images.
