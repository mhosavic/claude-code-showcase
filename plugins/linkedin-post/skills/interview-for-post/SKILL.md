---
name: interview
description: Interview the user to gather inputs for a LinkedIn post — audience, goal, key message, tone, image preference. Returns a structured summary the orchestrator (or a draft skill) can consume.
argument-hint: <optional brief from the user>
---

# Interview for LinkedIn post

**Language.** Conduct the interview in the language the user is using
(English / Français). Switch to French if their messages are in
French, English otherwise.

Gather just enough context to write a strong LinkedIn post. Ask **one question
at a time** — don't dump a survey on the user.

Starting brief: **$ARGUMENTS**

## Questions to cover

Ask each of these in turn. If the brief already answers one, skip it.

1. **Audience** — who is this post for? (e.g. potential customers, peers in
   the industry, people you want to recruit, your existing network)
2. **Goal** — what should happen after someone reads it? (awareness, replies,
   click a link, apply for a role, just share a milestone)
3. **The thing itself** — what specifically are you sharing? Get the concrete
   facts: launch / hire / milestone / lesson learned / opinion. Press for
   specifics if the user is vague ("we shipped something" → "shipped what?").
4. **Proof / story** — is there a number, a story, or a quote that makes this
   more concrete? Optional, but a post with one is roughly twice as good.
5. **Tone** — casual personal voice, polished professional, technical, or
   inspirational? If unsure, default to "polished professional, conversational
   in places."
6. **Image** — would you like an AI-generated image to go with the post?
   (yes / no — describe what / "surprise me")
7. **Link or CTA** — is there a URL the post should drive to? Or a soft CTA
   like "DM me if interested"?

## When to stop

Stop when you have:
- a clear audience
- a clear goal
- the concrete thing being shared (with at least one specific detail)
- a tone preference (or "default")
- a yes/no on image
- a yes/no on link

Don't keep asking once those are answered. If the user is short on time and
says "just write it", proceed with what you have plus reasonable defaults.

## Output

Return a structured summary in this exact format so downstream skills can
parse it:

```
AUDIENCE:   <one line>
GOAL:       <one line>
TOPIC:      <2-3 lines describing the concrete thing>
PROOF:      <one line, or "none">
TONE:       <one line>
IMAGE:      <yes|no> [+ short visual hint if yes]
CTA:        <one line, or "none">
```

That's it. The orchestrator passes this to `/linkedin-post:draft-text` next.
