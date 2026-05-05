---
name: draft-text
description: Draft LinkedIn post text from a structured brief (audience, goal, topic, tone, etc.). Returns a single ~150-word post with a hook, value, and soft CTA. Use after /linkedin-post:interview produces a brief.
argument-hint: <structured brief from /linkedin-post:interview>
---

# Draft LinkedIn post text

Write a single LinkedIn post from this brief: **$ARGUMENTS**

## What good looks like

- **~150 words** (LinkedIn truncates at ~210 characters in feed; first 2 lines
  are the hook).
- **First line is a hook** that makes someone stop scrolling. Concrete,
  specific, slightly counterintuitive if the topic supports it.
- **Body delivers value** — a story, a number, a lesson, an insight. Not a
  press release.
- **Closes with a soft CTA** matching the brief's `GOAL`. Not "click here" — a
  question, an invitation to share experience, or a link with one line of
  context.
- **Line breaks every 1–2 sentences.** Walls of text die on LinkedIn.
- **No more than 3 hashtags**, and only if they're genuinely useful for
  discovery. Default to none.

## What to avoid

- Buzzword openings ("Excited to share…", "Thrilled to announce…"). They get
  scrolled past.
- Fake-vulnerable stories the user didn't actually mention.
- Inventing numbers, names, or quotes.
- Over-promising. If the brief is "we shipped a beta", don't write "we
  revolutionized…".

## Tone guide

- **casual personal**: "I" voice, contractions, conversational asides.
- **polished professional**: full sentences, no slang, but still warm.
- **technical**: lead with the concrete what; assume the reader is in the
  field; one or two specifics matter more than narrative.
- **inspirational**: lean into the story arc, but ground it in a specific
  moment, not generic platitudes.

## Output

Return only the post text — no preamble, no explanation, no markdown
formatting. Use blank lines between paragraphs. The orchestrator shows it to
the user for approval before continuing.

If the brief is missing a critical piece (no clear topic, no audience), say so
in one line and stop. Don't paper over with generic copy.
