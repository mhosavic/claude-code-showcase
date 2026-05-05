---
name: post
description: Orchestrate a complete LinkedIn post — interview the user about what to post, draft the text, generate an image, and push the draft to LinkedIn. Use when the user asks for a LinkedIn post, wants to share something on LinkedIn, or asks for help promoting a launch / announcement / milestone.
disable-model-invocation: true
allowed-tools: mcp__linkedin-post__post_linkedin_draft
---

# Post to LinkedIn — orchestrator

**Language.** Run this orchestrator in the language the user is using
(English / Français). Your interview questions, transitions, and
status messages are all in their language. The post text itself
follows the brief: if `$ARGUMENTS` is in French, the LinkedIn post is
in French; same for English.

You are coordinating a multi-step LinkedIn post workflow. Walk through these
steps **in order** and never skip ahead. If the user provides input out of
order, set it aside and return to the current step.

The brief from the user is: **$ARGUMENTS**

## Step 1 — Interview the user

Invoke the sub-skill `/linkedin-post:interview` with the brief above as
arguments. It will ask the user the right questions to understand:
- the audience
- the goal of the post (awareness, recruiting, lead gen, etc.)
- the key message
- desired tone
- whether an image is wanted

Wait for the user to finish answering before moving on. If they explicitly skip
the interview ("just write something"), use sensible defaults and proceed.

## Step 2 — Draft the post text

Invoke `/linkedin-post:draft-text` with the answers from step 1. It returns a
post draft (≈150 words, with a hook, value, and a soft call to action).

Show the draft to the user. Ask them to **approve, tweak, or rewrite** before
moving to step 3.

## Step 3 — Generate an image (if wanted)

If the user asked for an image in step 1, invoke `/linkedin-post:generate-image`
with a short visual description matching the post.

Show the user the resulting image URL or local path. Let them iterate (different
prompt, different style) until they're satisfied. If they skip imagery, move on.

## Step 4 — Push the draft to LinkedIn

Once both the text and (optionally) the image are approved, call the MCP tool
`mcp__linkedin-post__post_linkedin_draft` with:
- `text`: the approved post text
- `image_url` (optional): the approved image URL from step 3
- `visibility`: `"PUBLIC"` (default) or `"CONNECTIONS"` if the user prefers

The tool returns a draft URN. **Do not auto-publish** — the user finalizes and
publishes from LinkedIn directly. Confirm with a one-line summary:

```
✓ Draft created on LinkedIn (urn:li:share:...).
  Open LinkedIn to review and publish: https://www.linkedin.com/feed/
```

## Mock mode reminder

If the MCP server is running in mock mode (the default), the tools log what
they *would* do but don't make real API calls. Tell the user clearly when this
is the case — they should know whether they actually posted or not.

## Failure handling

If the user wants to stop mid-workflow, just stop. Don't try to call the
LinkedIn API with incomplete data. If a sub-skill returns nothing useful (e.g.
the user gave one-word answers), summarize what you have and ask whether to
continue with sensible defaults or abort.
