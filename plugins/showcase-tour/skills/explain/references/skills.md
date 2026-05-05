# Concept: skills

## What

A skill is a markdown file that becomes a slash command. The body is a
prompt — when invoked, Claude reads it as instructions and follows them.

## Mental model

Think of a skill as a **saved prompt with a name and a clear contract**.
Where you'd otherwise type "please write me an email saying X" every
time, you save the instructions once and invoke them with
`/draft-email:draft X`.

Skills are how you **stop re-explaining yourself** to Claude.

## Concrete example from this showcase

The simplest skill in the repo is `plugins/draft-email/skills/draft/SKILL.md`:

```yaml
---
name: draft
description: Draft a polite, well-structured email from a one-line description.
              Use when the user asks to write an email, draft a message, or
              compose a note to send.
argument-hint: <one-line description of what the email should say>
---

# Draft email

Write an email based on this brief: **$ARGUMENTS**

(...detailed instructions on tone, structure, what to avoid...)
```

Three things make this work:

1. **The frontmatter** between `---` markers. `name: draft` plus the
   plugin name `draft-email` produces the slash command
   `/draft-email:draft`. The `description` is what Claude reads to decide
   when to *auto-pick* this skill (e.g. when the user says "write an
   email about X" without using the slash command).
2. **`$ARGUMENTS`** — whatever the user types after the command becomes
   this string. So `/draft-email:draft thank my mentor` makes
   `$ARGUMENTS = "thank my mentor"`.
3. **The body** — plain English instructions. Claude follows them.
   They're not code, they're guidance.

## When to use vs alternatives

| Use a skill when… | Don't use a skill when… |
|---|---|
| You catch yourself re-typing the same prompt or type-of-prompt. | The task is genuinely one-off. |
| You want a stable contract: same input → similar output. | The work needs real I/O (then use an MCP tool). |
| The instructions fit comfortably in markdown. | The "skill" would be a single line ("be polite"); just say it. |

Skills vs the alternatives:

- **vs CLAUDE.md** — CLAUDE.md is "always loaded" project-wide context.
  Skills are "load when invoked." Use CLAUDE.md for facts about the
  project. Use skills for repeatable workflows. (Full concept:
  `/showcase-tour:explain claude-md-and-rules`.)
- **vs subagents** — Subagents run in a *separate* context window. Use
  subagents when you want the work isolated. Use skills when you want it
  inline in the user's main conversation.
- **vs MCP tools** — MCP tools call code. Skills are prompts. Use MCP
  tools when you need real I/O (post to LinkedIn, generate an image,
  query a database). Use skills when text instructions are enough.

## Try this

1. Run `/showcase-tour:inspect plugins/draft-email/skills/draft/SKILL.md`
   to walk through this skill line-by-line with annotations.
2. Then run `/showcase-tour:explain plugins` to learn what wraps a skill
   for distribution.
