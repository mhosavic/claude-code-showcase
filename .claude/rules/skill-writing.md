# Skill-writing rule

How to write a new skill in this repo. Loaded by `CLAUDE.md`; applies
whenever you create or substantially edit a `SKILL.md`.

## Frontmatter checklist

Required:

- `name` — kebab-case, lowercase. Becomes the slash-command leaf:
  `name: draft` → `/draft-email:draft`.
- `description` — one sentence telling Claude **when** to use this skill,
  not just what it does. Claude reads the description to decide whether
  to invoke; vague descriptions ("helps with email") cause both
  over-firing and under-firing.

Strongly recommended:

- `argument-hint` — a one-line placeholder shown in the slash-command UI.
  Examples: `<topic>`, `<file-path>`, `[mode: quick|deep]`.
- `allowed-tools` — narrow the tool list to only what the skill needs.
  Critical for skills that talk to MCP servers — `mcp__server__tool` must
  be listed explicitly.

Use when the action has side effects or shouldn't fire automatically:

- `disable-model-invocation: true` — Claude cannot auto-invoke; only the
  user typing the slash command does. Use for: anything that posts,
  spends API credit, mutates state, or is part of a deliberate workflow.

Use when the skill should only activate inside a particular subtree:

- `paths:` — glob list. Skill is suggested only when Claude reads files
  matching one of the patterns. Example: `paths: ["**/*.py"]`.

## Body conventions

1. **Open with intent.** First line of the body should restate what the
   user just asked for. Example: "The user wants me to generate a commit
   message based on the current `git diff`."
2. **Use `$ARGUMENTS`, `$0`, `$N`** to substitute slash-command args. Do
   not read the user's message and re-interpret — the substitution is
   already done before Claude sees the body.
3. **`!` blocks for live data.** `` !`git diff --stat` `` is replaced
   with the command's stdout *before* Claude sees the prompt. Use for:
   current branch, last 5 commits, list of plugins. Do not use for
   anything slow or interactive.
4. **Numbered steps for procedures.** If the skill describes a workflow,
   use `## Step 1`, `## Step 2`, etc. Claude follows numbered structure
   reliably.
5. **Be explicit about the deliverable.** End with a section like
   "What to output" so Claude knows when it's done.

## Tone

- Imperative, not descriptive. "Read X, then do Y" beats "the skill
  reads X and does Y."
- No filler. Skills are loaded into every conversation that triggers
  them — every line costs context.
- No emoji.

## What NOT to put in a SKILL.md

- Long examples of *output*. Show the user with `argument-hint`, not by
  pasting sample emails.
- Contributor / maintenance notes. Those go in the plugin's `README.md`,
  not the skill body.
- `version` or `author` fields — those belong on the plugin manifest.

## Anti-patterns we've seen

- A skill that calls a tool not listed in `allowed-tools` — fails
  silently or loops. Always update `allowed-tools` when adding a tool
  call.
- A skill description that says "Use this skill" — circular and
  uninformative. Describe the trigger condition.
- `disable-model-invocation: true` missing on a skill that posts to
  external APIs. Always opt out of auto-invoke for side-effecting work.

## Existing examples to mirror

| You're writing… | Closest existing example |
|---|---|
| A simple one-shot prompt | `plugins/draft-email/skills/draft-email/SKILL.md` |
| A skill with live shell context | `plugins/commit-helper/skills/commit-msg/SKILL.md` |
| A path-scoped skill | `plugins/commit-helper/skills/cleanup-imports/SKILL.md` |
| A workflow orchestrator | `plugins/linkedin-post/skills/post-to-linkedin/SKILL.md` |
| A skill that calls an MCP tool | `plugins/linkedin-post/skills/generate-post-image/SKILL.md` |

## Verifying

After editing a SKILL.md:

1. `/reload-plugins` (or restart Claude Code).
2. `/showcase-tour:status` — confirms the plugin is loaded.
3. Type the new slash command's prefix (`/draft-email:`) — the skill
   should appear with its `argument-hint`.
4. Run it with a sample input — check that `$ARGUMENTS` substituted
   correctly.
