# Concept: claude-md-and-rules

## What

`CLAUDE.md` is a markdown file at the repo root (or in `~/.claude/`,
`<repo>/.claude/`, or anywhere up the tree) that's automatically loaded
into Claude's context every time it works in that scope. The `.claude/
rules/` directory is the conventional home for longer, topic-specific
guidance that's referenced by — but not duplicated into — `CLAUDE.md`.

Together they're the project's "house style": durable instructions that
shouldn't have to be repeated each conversation.

## Mental model

`CLAUDE.md` is to a Claude Code project what a `CONTRIBUTING.md` is to a
human-run open-source project. It tells the next contributor (which is
sometimes a future you, sometimes Claude) "this is how we do things
here." Unlike `CONTRIBUTING.md`, Claude actually reads it every time —
so you can rely on it being followed.

The rules folder is the **referenced bibliography**. Keep `CLAUDE.md`
short and readable; push deep how-to content into rule files that get
loaded only when relevant.

Hierarchy of authority (highest first):

1. The user's explicit message in the current turn.
2. `CLAUDE.md` files (closest scope wins — repo overrides user-global).
3. Skills, plugins, MCP servers — they describe *how* to do specific
   tasks but don't override repo policy.
4. Claude's default training.

This means `CLAUDE.md` is not a soft suggestion — it's the second-most
authoritative voice in the room.

## Concrete example from this showcase

The showcase's own `CLAUDE.md`:

```markdown
## House rules — code

1. **Do not change a plugin's `version` without a reason.** The number is
   how downstream users decide whether to update. Bumping it casually
   churns everyone's settings.
2. **Mock-mode is the default.** `linkedin-post`'s MCP server defaults to
   `MOCK_MODE=true`. Never remove the mock branch when adding a real-mode
   path — the mock is what makes this repo demoable without credentials.
...
```

And the rules it references:

```
.claude/rules/
├── skill-writing.md       — frontmatter checklist + tone for SKILL.md
├── mcp-server.md          — how to add an MCP tool, naming, mock mode
└── concept-references.md  — the strict template every concept follows
```

`CLAUDE.md` lists the *rules*. The *how* lives in the rule files.
Conversations that don't touch MCP-server code don't need to load
`mcp-server.md` — keeping context lean.

## When to use vs alternatives

| Situation | Use |
|---|---|
| Cross-cutting policy that applies to *every* edit in this repo. | `CLAUDE.md` at repo root. |
| Topic-specific deep-dive (how to add a tool, how to write a doc). | `.claude/rules/<topic>.md` referenced from `CLAUDE.md`. |
| User-personal preferences across all projects. | `~/.claude/CLAUDE.md`. |
| Behavior that must run on every event, deterministically. | A **hook** — see `/showcase-tour:explain hooks`. |
| Knowledge specific to one workflow, not the whole project. | A **skill** — see `/showcase-tour:explain skills`. |

`CLAUDE.md` is *advisory* — Claude will respect it, but no exit code
enforces it. If something must be 100% blocked (like a destructive
shell command), make it a hook, not a CLAUDE.md rule.

## Try this

1. Open this repo's `CLAUDE.md` and notice how short it is — it lists
   policy and points at the rules folder for depth.
2. Run `/showcase-tour:inspect CLAUDE.md` to walk through the whole
   file with annotations.
3. Then `/showcase-tour:explain hooks` — to see the difference between
   advisory (`CLAUDE.md`) and deterministic (hooks) enforcement.
