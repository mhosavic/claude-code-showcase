# Concept: path-scoping

## What

The `paths:` field in skill frontmatter is a list of glob patterns.
Claude only **auto-loads the skill into context** when it reads a file
matching one of those patterns. The skill is still callable manually, but
it's invisible until relevant.

## Mental model

Path-scoping is a **lazy load** for skills. Without it, every skill's
description is loaded into the model's context at session start. With
many internal skills, that's wasteful — most aren't relevant to any one
task.

Scoping says: *"don't bother showing this to Claude unless the user is
working with files I care about."*

The token-budget benefit shows up when your team has 30 internal skills
and any single conversation only needs 2 of them.

## Concrete example from this showcase

`plugins/commit-helper/skills/cleanup-imports/SKILL.md`:

```yaml
---
name: cleanup-imports
description: Sort and dedupe import statements in TypeScript / JavaScript files...
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.mjs"
---
```

When Claude is working in a Python repo, this skill never enters context.
When Claude reads any `.ts` or `.tsx` file, it gets loaded automatically
and Claude becomes aware that it can clean up imports in this file type.

If the user explicitly types `/commit-helper:cleanup-imports` in a Python
project, it still works — `paths:` only affects *automatic* discovery.

## Glob syntax cheat sheet

| Pattern | Matches |
|---|---|
| `**/*.ts` | All `.ts` files anywhere in the working tree. |
| `src/**/*` | Anything under `src/`. |
| `*.md` | Markdown files in the project root only. |
| `src/components/*.tsx` | TSX files in exactly that directory. |
| `**/*.{ts,tsx}` | TS or TSX, anywhere. |

Same syntax as `.claude/rules/` `paths:` fields.

## When to use vs alternatives

| Use `paths:` when… | Skip it when… |
|---|---|
| The skill is only relevant to certain file types or directories. | The skill applies everywhere (commit messages, emails, etc.). |
| Your team has many internal skills and you want to keep context lean. | You only have a handful of skills. |
| The skill references file-type-specific conventions (JS imports, CSS rules, Python typing). | The skill is generic. |

Compare with related mechanisms:

- **vs `.claude/rules/`** — Rules use the same `paths:` syntax but are
  *not* invocable. They're inert context that loads when Claude reads
  matching files. Use rules for "this is how we do X in src/api/" facts.
  Use path-scoped skills for *actions* the user might take on those files.
  Full concept: `/showcase-tour:explain claude-md-and-rules`.
- **vs `disable-model-invocation`** — `paths:` controls *automatic
  discovery*. `disable-model-invocation` controls whether Claude can
  *invoke* the skill at all. They compose: a skill can be path-scoped AND
  user-only.

## Things to watch out for

- **Globs are checked at file-read time, not session start.** If you have
  `paths: ["src/**"]` and Claude never reads anything under `src/` in a
  given session, the skill never loads. This is desired — but it means
  testing your skill requires actually exercising the path.
- **Path-scoped skills still appear in the `/` autocomplete menu** when
  the user types — auto-load only affects model context, not user-facing
  discoverability.

## Try this

1. Run `/showcase-tour:inspect plugins/commit-helper/skills/cleanup-imports/SKILL.md`
   to see the full skill including the `paths:` block.
2. Open any TypeScript file in this repo and ask Claude "clean up the
   imports here" without naming the skill. It should auto-pick
   `cleanup-imports`. (Try the same in a markdown file — it shouldn't.)
3. Then run `/showcase-tour:explain skill-controls` for the rest of the
   skill-frontmatter control surface.
