# Concept: subagents

## What

A subagent is a specialized AI worker that runs in **its own context
window** with a focused system prompt and (optionally) a restricted tool
set. The main conversation delegates a self-contained task to it; it
works independently; only the summary comes back.

## Mental model

A subagent is like **handing off a research assignment to a colleague**.
You tell them what you need; they go do the reading; they come back with
a one-page summary. The piles of articles they consulted never clutter
your desk.

This is the inverse of skills. Skills run **inline** in your main
conversation. Subagents run **off to the side** in their own window.

## Concrete example from this showcase

`plugins/linkedin-post/agents/post-coordinator.md`:

```yaml
---
name: post-coordinator
description: Use to run an end-to-end LinkedIn post workflow in an isolated
              context (interview → draft → image → push to LinkedIn). Invoke
              when the user wants to delegate the whole flow rather than steer
              it themselves.
tools: Read, Grep, Glob, Bash
model: sonnet
color: blue
---

You coordinate a complete LinkedIn post creation workflow. You run in
your own context window — the user's main conversation stays clean.
...
```

Two ways to invoke it:

```text
Use the post-coordinator subagent to make a LinkedIn post about our launch.
@post-coordinator make a linkedin post about our launch
```

The subagent:
1. Runs the same `/linkedin-post:*` skills you could run yourself.
2. Asks the user clarifying questions and waits for replies (those
   exchanges happen in the subagent's window).
3. Reports the final result — text, image URL, draft URN — back to your
   main conversation as a summary.

## When to use a subagent vs alternatives

| Use a subagent when… | Use the main thread (skills) when… |
|---|---|
| The work produces a lot of intermediate output you don't need long-term. | You want every step visible and steerable. |
| You're running multiple things in parallel (each subagent gets its own window). | The work is a single quick action. |
| The task needs a different *system prompt* (security reviewer, code editor, data scientist personality). | You're fine with the default Claude Code behavior. |
| You want hard tool restrictions (e.g. read-only). | The skill's `allowed-tools` is enough. |

Subagent vs skill, in one sentence: **same conversation = skill;
separate conversation = subagent.**

## Built-in vs custom subagents

Claude Code ships built-in subagents you don't have to define:

- **Explore** — fast read-only codebase search (Haiku model).
- **Plan** — research mode for plan-before-code workflows.
- **general-purpose** — general multi-step tasks.
- **statusline-setup**, **Claude Code Guide** — narrow helpers.

Custom subagents live in `.claude/agents/<name>.md` (project) or
`~/.claude/agents/` (personal) or `<plugin>/agents/<name>.md` (plugin).
The `post-coordinator` above is a plugin subagent.

## Frontmatter cheat sheet

| Field | Effect |
|---|---|
| `name` | Required. The slash-name and `@`-mention name. |
| `description` | Required. What Claude reads to decide when to delegate. |
| `tools` | Allowlist (e.g. `Read, Grep, Glob`). Inherits all if omitted. |
| `disallowedTools` | Denylist applied first, then `tools` resolves against the rest. |
| `model` | `sonnet` / `opus` / `haiku` / `inherit`. |
| `permissionMode` | `default`, `plan`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`. |
| `memory` | `user` / `project` / `local` for cross-session learning. |
| `isolation: worktree` | Run in a temporary git worktree (isolated checkout). |
| `background: true` | Run concurrent with the main conversation. |

## Subagents can't spawn subagents

Subagents are **one level deep**. If you need nested delegation, use
skills inside a subagent, or chain subagents from the main conversation.

## Try this

1. Run `/showcase-tour:inspect plugins/linkedin-post/agents/post-coordinator.md`
   to read this subagent's full definition.
2. Then try invoking it: `Use the post-coordinator subagent to draft a
   LinkedIn post about <topic>`. Watch how the back-and-forth happens in
   a separate panel below your prompt.
3. Then run `/showcase-tour:explain hooks` for the deterministic
   counterpart to skills/subagents.
