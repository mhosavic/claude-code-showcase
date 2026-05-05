---
name: generate-image
description: Generate an image for a LinkedIn post via the bundled MCP server (uses gpt-image-1 in real mode, returns a placeholder in mock mode). Use after /linkedin-post:draft-text when the brief said an image is wanted.
argument-hint: <short visual description, e.g. "a quiet morning office with steam from a coffee mug">
allowed-tools: mcp__linkedin-post__generate_image
---

# Generate post image

Generate a square (1024×1024) image for a LinkedIn post matching this brief:
**$ARGUMENTS**

## How to call the tool

Call the MCP tool `mcp__linkedin-post__generate_image` with:

- `prompt`: a clear, specific visual description.
  - **Refine the user's words** before sending. "An office" is too vague —
    rephrase as "a minimal modern home office at golden hour, plant on desk,
    laptop open, no people, soft natural light."
  - **Specify style** if relevant: "photorealistic", "flat illustration",
    "duotone editorial illustration".
  - **Avoid text in the image**: image models are bad at text. If the user
    asks for a quote on the image, say so and recommend they add text in
    Canva/Figma later.
- `size`: `"1024x1024"` (default — works well for LinkedIn posts).
- `quality`: `"medium"` is a good default. Use `"high"` only when the user
  explicitly cares about polish.

## What you get back

- In **mock mode**: a placeholder URL like `https://example.com/mock-image-<id>.png`
  and a note saying it's mocked. Show this to the user and explain mock mode is on.
- In **real mode**: a URL to the generated image (hosted by OpenAI temporarily,
  or returned as a data URI depending on config). The URL is what gets passed
  to `post_linkedin_draft` in the next step.

## Iteration

If the user wants a different image:
- Take their feedback.
- Tweak the prompt — usually you want to be **more specific**, not less.
- Call the tool again.
- Don't auto-iterate without showing the user the result first.

## Cost note (real mode)

gpt-image-1 charges per image:
- low quality: ~$0.02
- medium: ~$0.07
- high: ~$0.19

Mention this if the user is iterating heavily.
