# UI Screenshot Guide

How to use the HelloTalk UI screenshot library in `assets/ui-screenshots/`. This guide covers:
1. What UI screenshots are available
2. How to choose the right one for a given article
3. Compliance and safety boundaries when modifying them
4. Step-by-step modification workflow

Current default image direction is photorealistic HelloTalk website/app composite. Use this guide only when a prompt needs a real UI screenshot modification. If no real UI asset is available, use a generic phone mockup inside a photorealistic brand composite instead of claiming to reproduce an exact screenshot.

---

## Library Inventory

The `assets/ui-screenshots/` folder should contain (the user supplies these from their own app):

| Filename | Shows | Best for articles about... |
|---|---|---|
| `matching-screen.png` | Partner discovery / matching interface | Finding language partners, profession filtering |
| `chat-interface.png` | 1-on-1 text chat with bubbles | Daily practice, async conversation |
| `voice-message-ui.png` | Voice message recording / playback | Voice messages, async speaking practice |
| `voicerooms-list.png` | Voice rooms / live group chat list | Group practice, live conversation |
| `voicerooms-active.png` | Inside an active voice room | Live group dynamics, immersion |
| `moments-feed.png` | Social feed (Moments) | Community feedback, native corrections |
| `profile-with-tags.png` | User profile showing interest/profession tags | Interest matching, profession-based search |
| `correction-popup.png` | Native speaker correction interface | Real corrections, learning from natives |
| `ai-partner-chat.png` | AI conversation partner interface | Pre-warmup practice, no-pressure reps |
| `translation-inline.png` | In-chat translation feature | Translation tool, language barrier removal |

⚠️ **If a UI screenshot needed for an article isn't in the library**, tell the user: "You'll need to add a screenshot of [SPECIFIC UI SCREEN] to the library before I can generate this image plan."

---

## Matching UI Screenshots to Article Sections

When recommending a UI screenshot, match the article topic to the right base:

| Article topic | Recommended UI base |
|---|---|
| "Finding industry peers" | `matching-screen.png` + show profession filter |
| "30-minute daily routine" | `chat-interface.png` + voice message exchange |
| "Voice messages for async practice" | `voice-message-ui.png` |
| "Group practice / Voicerooms" | `voicerooms-active.png` |
| "How natives correct your sentences" | `correction-popup.png` |
| "AI partner for low-pressure practice" | `ai-partner-chat.png` |
| "Tapping to translate mid-chat" | `translation-inline.png` |
| "Pre-trip matching with locals" | `matching-screen.png` + travel-themed bio |

---

## Modification Rules

When the user generates AI-modified versions of UI screenshots, enforce these rules:

### ✅ Allowed Modifications

- **Partner names**: Use common multi-cultural names (Maria, Tom, Akiko, Wei, Carmen, etc.)
- **Partner avatars**: Replace with illustration-style avatars, NOT real photos
- **Bio/tags**: Modify to match article context (e.g., "Software Engineer · Madrid" for N3)
- **Chat content**: Replace message bubbles with article-relevant conversation
- **Languages shown**: Match the article's target language
- **Timestamps**: Update to recent/relevant times
- **Streak numbers, points, badges**: Can be modified to reasonable numbers

### ❌ Forbidden Modifications

- **Adding non-existent features**: If a button/panel/feature isn't in the original UI, don't add it
- **Removing core HelloTalk elements**: Don't strip the logo, brand colors, or navigation
- **Using real people's photos**: Always use generated illustration-style avatars
- **Faking user testimonials**: Don't add 5-star reviews or "100K users love it" overlays
- **Combining UIs from different apps**: Don't merge HelloTalk UI with Duolingo or other competitors
- **Showing identifying real user data**: If your screenshot captured another real user's name/photo, P it out

---

## Content Authenticity Guidelines

The conversation content shown in modified screenshots should be:

### ✅ Good content patterns

**Specific and useful**:
- "I'm visiting Madrid next month — what's the one thing locals always eat that tourists miss?"
- "Try churros con chocolate at San Ginés, but go at 7am when the night-out crowd is leaving 😄"

**Industry-specific** (for N3):
- User: "Our team uses 'push back' a lot in meetings — what's the natural way to say this in formal contexts?"
- Partner: "'Raise concerns about' or 'flag some hesitation with' — both work. Push back is fine in casual standups too."

**Cultural exchange** (for N6 Japanese):
- User (Japanese learner): "私の発音、変じゃないですか？"
- Partner (native Japanese): "全然OKです！自然に聞こえますよ 😊"

### ❌ Bad content patterns

**Too generic**:
- "Hello! How are you?"
- "I'm fine, thanks. And you?"

**Marketing-y**:
- "HelloTalk is amazing!"
- "I learned so much from this app!"

**Off-topic**:
- Personal/intimate conversations
- Anything that doesn't match the article's educational angle

---

## Step-by-Step Modification Workflow

When the user is generating a modified UI screenshot:

```
1. Identify which raw UI screenshot to use (from library)
2. Write the specific modification prompt using Template 3 from prompt-templates.md
3. Include the raw UI screenshot when calling Codex/GPT
4. Review the output for:
   □ UI elements are pixel-perfect (no warping)
   □ Modified content is readable and on-topic
   □ No fake features added
   □ No real user data leaked
5. If UI warping occurred, manually retouch with Photoshop/Figma
6. Export as PNG, save to the article's image folder
7. Strip EXIF metadata (optional but recommended)
```

---

## Privacy Safety Check

Before any modified UI screenshot is published, verify:

```
□ No real other users' usernames visible
□ No real other users' photos visible
□ No real chat history from real conversations
□ Generated avatars are clearly illustration-style, not photo-realistic
□ Names used don't match any real prominent people
□ Locations are general (city level, not specific addresses)
□ Any phone numbers, emails, or IDs are removed/replaced
```

---

## Fallback: When No UI Screenshot Is Available

If the article needs a UI illustration but no suitable raw screenshot exists, recommend one of these alternatives:

1. **Use a photo-ui-composite**: photorealistic generated learner + generic phone mockup showing common chat/voice elements
2. **Ask the user to capture the missing UI screenshot** before proceeding
3. **Use a photo-learning-scene** with compact rounded cards/chips if the section is conceptual

⚠️ Do NOT claim that a generic phone mockup is a pixel-perfect HelloTalk screenshot. Keep UI elements common and truthful, and do not invent unsupported features.

---

## Quality Standard

A successfully modified UI screenshot should:

- Be indistinguishable from a real screenshot at first glance
- Have content that adds educational value to the article (not just decoration)
- Reinforce a specific point made in the surrounding text
- Pass the "could this be a real screenshot from yesterday?" test

If the output feels off, regenerate with more specific instructions or fall back to an infographic.
