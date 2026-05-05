# Q2 — Complex skill orchestration

> "La structure des fichiers et les instructions d'orchestration pour un skill
> complexe (exemple, un projet qui a comme tâche de faire un post LinkedIn
> avec plusieurs skills qui lui sont propres, comme questionner l'utilisateur
> pour cerner le besoin, générer le texte, générer l'image, pousser le
> brouillon dans LinkedIn)."

The `linkedin-post` plugin is built exactly around this scenario. This page
walks through how it's organized and explains the design decisions.

## The whole plugin

```
plugins/linkedin-post/
├── .claude-plugin/plugin.json
├── README.md
├── skills/
│   ├── post-to-linkedin/SKILL.md       ← the orchestrator
│   ├── interview-for-post/SKILL.md     ← sub-skill 1: ask the user
│   ├── draft-post-text/SKILL.md        ← sub-skill 2: write the text
│   └── generate-post-image/SKILL.md    ← sub-skill 3: make an image
├── agents/post-coordinator.md          ← optional alt-orchestrator
└── mcp-server/                         ← bundled tools (covered in Q4/Q5)
```

## How the orchestration actually works

There are **two orchestration patterns** in Claude Code, and this plugin
demonstrates both. Pick whichever matches the work.

### Pattern A — One orchestrator skill that calls sub-skills

This is `/linkedin-post:post`. The skill body itself contains the workflow as
plain instructions:

> Step 1: Invoke `/linkedin-post:interview` with the brief…
> Step 2: Invoke `/linkedin-post:draft-text` with the result…
> Step 3: If the user wanted an image, invoke `/linkedin-post:generate-image`…
> Step 4: Call the MCP tool `mcp__linkedin-post__post_linkedin_draft`.

Claude reads those instructions and follows them in order, asking the user
for input at each step. Each sub-skill is a regular plugin skill — they're
also independently invokable on their own (`/linkedin-post:interview` works
without the orchestrator).

**Use this pattern when:**
- The workflow is mostly linear with user check-ins between steps.
- Each step is a discrete chunk you can also imagine someone running by itself.
- You want the user steering the flow in their main conversation.

**Trade-off:** all the intermediate output (interview answers, draft text,
image URLs) accumulates in the user's main conversation context.

### Pattern B — A subagent that owns the workflow

This is `agents/post-coordinator.md`. Invoke it with:

```
Use the post-coordinator subagent to make a LinkedIn post about our beta launch
```

The subagent runs in its own isolated context window. It calls the same
sub-skills, but the verbose interview Q&A and the draft iterations stay in
the subagent's window. Only the final summary (post text + image URL + draft
URN) comes back to the main conversation.

**Use this pattern when:**
- The user wants to delegate the whole flow rather than steer it themselves.
- The main conversation is busy with other work and you don't want to
  pollute it.
- You're running multiple workflows in parallel (each subagent gets its own
  window).

**Trade-off:** the subagent can't ask you mid-flow as cleanly — it's more
"go away and do this" than "let's do this together."

### Pattern C (bonus) — Multiple top-level skills with no orchestrator

You don't *have* to write an orchestrator. The Notion plugin is a good
example: it ships independent skills (`/Notion:search`, `/Notion:create-page`,
etc.) and trusts the user to compose them.

**Use when:** the steps don't have a fixed order, and most users will only
need one at a time.

## Per-skill tool scoping (the answer to part of Q4 too)

Each skill declares which MCP tools it's allowed to use, via `allowed-tools`
in the frontmatter:

| Skill | `allowed-tools` |
|---|---|
| `post-to-linkedin` (orchestrator) | `mcp__linkedin-post__post_linkedin_draft` |
| `generate-post-image` | `mcp__linkedin-post__generate_image` |
| `interview-for-post` | (none — pure prompt, can't touch MCP) |
| `draft-post-text` | (none — pure prompt, can't touch MCP) |

This is the answer to Francis's question *"how do I control which functions
can be called by which skills."* `allowed-tools` is the mechanism.

The `mcp__<server-name>__<tool-name>` naming pattern is how MCP tools are
addressed everywhere (settings.json permissions, allowed-tools, hook
matchers).

## Design checklist for your own complex skills

When you're building something similar:

1. **Start with the user-facing skill name.** `/linkedin-post:post` reads
   well. `/linkedin-post:run-the-workflow` doesn't.
2. **Decide the orchestration pattern** before you write code. The body of
   the orchestrator skill is fundamentally different from the body of a
   subagent.
3. **Make each sub-skill independently useful.** If `/linkedin-post:draft-text`
   only made sense in the context of the orchestrator, it shouldn't be a
   skill at all — it should be embedded in the orchestrator's prompt.
4. **Use `disable-model-invocation: true`** on skills with side effects (the
   orchestrator does, because it eventually publishes). Sub-skills without
   side effects (interview, draft) leave it off, so Claude can pick them up
   automatically when the user asks "draft a LinkedIn post about X".
5. **Scope tools with `allowed-tools`.** Default-deny: a skill that doesn't
   need MCP tools shouldn't list any.
6. **Always check in mock mode first** before requiring credentials. People
   can try the workflow, see what it does, then decide whether to set up
   real auth.

## Try it

End-to-end orchestrator:

```
/linkedin-post:post we just shipped public beta of our scheduling tool
```

Just one step:

```
/linkedin-post:interview I want to share that we hit 1000 paying customers
```

Subagent path:

```
Use the post-coordinator subagent to draft a LinkedIn post about our beta launch
```

## Next

[`03-team-distribution.md`](03-team-distribution.md) — how to ship this to
your team.
