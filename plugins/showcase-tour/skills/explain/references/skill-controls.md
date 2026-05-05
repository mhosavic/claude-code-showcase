# Concept: skill-controls

## What

The cluster of frontmatter fields that gate a skill's **behavior, who
can invoke it, and what tools it can use without prompting**:

| Field | What it does |
|---|---|
| `disable-model-invocation: true` | User-only skill — Claude can't auto-pick it. |
| `user-invocable: false` | Claude-only skill — hidden from the `/` menu. |
| `allowed-tools: <list>` | Pre-approves named tools for this skill (no permission prompt). |
| `argument-hint: <text>` | Autocomplete hint shown after the slash command. |
| `model: sonnet|opus|haiku` | Override the model for this skill's turn. |
| `effort: low|medium|high|xhigh|max` | Override the reasoning effort for this skill. |

Together, they're how you express "**this skill is for X situations,
should be invoked by Y, and can use Z**" precisely.

## Mental model

Frontmatter is the **contract** between the skill and the rest of the
system. The body says what to do; the frontmatter says under what
conditions it can run.

Most skills only need `name`, `description`, and maybe `argument-hint`.
The control fields kick in once a skill has *side effects* (deploys,
posts, sends messages) or needs *specific tools* (Bash, MCP, Edit).

## Concrete example from this showcase

`plugins/linkedin-post/skills/post/SKILL.md`:

```yaml
---
name: post
description: Orchestrate a complete LinkedIn post...
disable-model-invocation: true
allowed-tools: mcp__linkedin-post__post_linkedin_draft
---
```

Three deliberate choices:

1. **`disable-model-invocation: true`** — this skill *posts to LinkedIn*.
   You don't want Claude deciding to call it because something looks
   ready. Only the user can trigger it.
2. **`allowed-tools: mcp__linkedin-post__post_linkedin_draft`** — this
   skill needs exactly one tool. Pre-approving it means the user doesn't
   get a permission prompt mid-workflow.
3. **No `mcp__linkedin-post__generate_image` in `allowed-tools`** — this
   orchestrator is for *posting*. Image generation belongs to a different
   skill (`generate-post-image`). Per-skill scoping enforces it.

Compare to `plugins/linkedin-post/skills/interview-for-post/SKILL.md`:

```yaml
---
name: interview
description: Interview the user...
argument-hint: <optional brief from the user>
---
```

No `disable-model-invocation` (Claude can pick it up if the user says
"help me write a linkedin post"). No `allowed-tools` (it's a pure prompt,
needs no tools).

## The control matrix

| Frontmatter | User invokes? | Claude invokes? | When loaded into context |
|---|---|---|---|
| (default) | Yes | Yes | Description always; full skill on invocation. |
| `disable-model-invocation: true` | Yes | No | Description NOT loaded; full skill loads when YOU invoke. |
| `user-invocable: false` | No | Yes | Description always; full skill on auto-invocation. |

So `disable-model-invocation: true` is also a **context optimization** —
the skill's description doesn't take up space when only the user can
trigger it anyway.

## When to use what

- **Has side effects** (deploy, post, send, write to DB) →
  `disable-model-invocation: true`.
- **Pure prompt with no tools** → no `allowed-tools` needed.
- **Calls one specific MCP tool** → `allowed-tools: mcp__server__tool`.
- **Calls Bash for a fixed command pattern** →
  `allowed-tools: Bash(git diff *)`.
- **Heavy reasoning task** → `model: opus` and/or `effort: high`.

## `allowed-tools` syntax

Same as permission rules elsewhere:

```yaml
allowed-tools: Read, Grep, Glob, Bash(git status *), mcp__github__*
```

`mcp__server__*` matches any tool from that server.
`Bash(prefix *)` matches any command starting with that prefix.

## Try this

1. Run `/showcase-tour:inspect plugins/linkedin-post/skills/post/SKILL.md`
   to see how these fields combine in a real orchestrator.
2. Compare with `/showcase-tour:inspect plugins/linkedin-post/skills/interview-for-post/SKILL.md`
   to see the same fields used differently for a pure-prompt skill.
3. Then run `/showcase-tour:explain subagents` if you want isolated
   contexts, or `/showcase-tour:explain hooks` for deterministic
   enforcement.
