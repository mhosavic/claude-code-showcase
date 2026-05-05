---
name: inspect
description: Read a target file, plugin, or skill in the showcase repo and walk through it with annotations. Pairs with /showcase-tour:explain — explain teaches concepts (theory), inspect teaches by reading the actual code (practice). Targets can be a file path, a plugin name, a skill name, or a category like "the marketplace" / "the MCP server" / "the orchestrator".
disable-model-invocation: true
argument-hint: <path | plugin-name | skill-name | category-keyword>
allowed-tools: Read, Glob, Grep
---

# Inspect a piece of the showcase

The user wants you to read **`$ARGUMENTS`** in this repo and explain
what's there. Walk through it the way an experienced engineer would
introduce a junior to the codebase: file by file, with annotations on
what each piece does and why.

## Step 1 — Resolve the target

`$ARGUMENTS` can be one of:

### A. A specific file path

If it looks like a path (contains `/` or ends in `.md`/`.json`/`.ts`/`.sh`):
read it directly.

Examples:
- `plugins/draft-email/skills/draft-email/SKILL.md`
- `plugins/linkedin-post/.claude-plugin/plugin.json`
- `plugins/commit-helper/scripts/guard-dangerous-git.sh`

### B. A plugin name

If it matches a plugin (`draft-email`, `linkedin-post`, `commit-helper`,
`showcase-tour`): walk through the plugin's structure — list the files,
read `plugin.json`, then read the most important skill or component.

### C. A skill name

If it matches a skill name (e.g. `commit-msg`, `compose_post`, `tour`):
find which plugin it belongs to (use Glob if needed) and read the
SKILL.md.

### D. A category keyword

Map common phrases to a target:

| User said… | Read this |
|---|---|
| `the marketplace`, `marketplace` | `.claude-plugin/marketplace.json` |
| `the settings`, `settings`, `bootstrap` | `.claude/settings.json` |
| `the MCP server`, `the server`, `mcp server` | `plugins/linkedin-post/mcp-server/src/server.ts` |
| `the orchestrator`, `the workflow` | `plugins/linkedin-post/skills/post-to-linkedin/SKILL.md` |
| `the hook`, `the safety hook` | `plugins/commit-helper/scripts/guard-dangerous-git.sh` |
| `the subagent`, `the coordinator` | `plugins/linkedin-post/agents/post-coordinator.md` |
| `the tour`, `the tour skill` | `plugins/showcase-tour/skills/tour/SKILL.md` |
| `userConfig` | `plugins/linkedin-post/.claude-plugin/plugin.json` |
| `the README` | `README.md` |
| `CLAUDE.md`, `the house style`, `house rules` | `CLAUDE.md` |
| `the rules`, `rules folder` | List `.claude/rules/`, then read whichever the user names (or all three if they don't pick). |
| `the tests`, `the MCP tests` | List `plugins/linkedin-post/mcp-server/src/__tests__/`, walk through `images.test.ts` first. |

### E. Empty or unclear

If `$ARGUMENTS` is empty or doesn't match anything, list the **most
useful files to inspect** (the same ones from the table above) and ask
which.

## Step 2 — Walk through it

Once you've identified the target, use this structure:

### Step 2a — Open with one sentence

> "This file is `<path>`. It's the <role> of the <plugin/feature>."

One line. Don't preamble.

### Step 2b — Read the whole file (or the relevant chunk)

Use the Read tool. For long files (>300 lines), focus on the section
relevant to what the user asked about and tell them you're skipping the
rest unless they want it.

### Step 2c — Annotate as you go

Quote 5-15 lines at a time, then explain. Pattern:

> "Lines 1-12 are the manifest header — `name` becomes the slash-command
> namespace, `version` is what users compare against to decide if they
> need to update.
>
> ```yaml
> name: linkedin-post
> version: 0.1.0
> ...
> ```
>
> Notice that `version` is set explicitly. That means users won't get
> updates until the maintainer bumps this number — see
> `/showcase-tour:explain plugins` for why this matters."

Skip lines that are obvious (closing brackets, blank lines). Don't
narrate "and now we have a comma." Annotate the *meaningful* parts.

### Step 2d — Cross-reference

After walking through the file, suggest:

- A related concept lesson: `/showcase-tour:explain <concept>` for the
  theory behind what they just read.
- A related file to inspect next: `/showcase-tour:inspect <file>` for
  the next logical piece.

For example: after reading a SKILL.md, suggest reading the plugin's
`plugin.json` next so they see how the skill plugs into the bundle.

## Step 3 — Stay grounded in the actual code

You are a **code-walker**, not a concept-teacher. The `/showcase-tour:explain`
skill exists for theory. Your job is to make the user feel like they
read the file with someone smart explaining each piece.

If the user asks a theory question mid-walk ("but why is plugin
versioning a thing at all?"), answer briefly and point them at
`/showcase-tour:explain` for the deeper context.

## What you do NOT do

- Don't paraphrase the file's contents instead of showing them. Quote
  what's actually there.
- Don't invent functionality the file doesn't have. If you're not sure
  what a line does, say so and look it up (Grep / Read of related files).
- Don't read more than ~3 files in a single inspect session unless the
  user keeps asking for more. Each `/showcase-tour:inspect` is one
  walkthrough.
- Don't dump the entire file as one block. Annotate progressively.

## A worked example

User: `/showcase-tour:inspect plugins/draft-email`

You should:

1. Glob `plugins/draft-email/**` to see the structure.
2. Open with: "This is the showcase's simplest plugin — three files.
   I'll walk through them in order: manifest first, then the skill
   itself."
3. Read `plugins/draft-email/.claude-plugin/plugin.json`. Quote it.
   Annotate the fields.
4. Read `plugins/draft-email/skills/draft-email/SKILL.md`. Quote the
   frontmatter. Explain `name`, `description`, `argument-hint`. Quote a
   chunk of the body. Note `$ARGUMENTS` substitution.
5. Skip `README.md` (just human docs).
6. Cross-reference: "want the theory behind why the plugin / skill split
   exists? `/showcase-tour:explain plugins`. Want to see the next-most
   complex example? `/showcase-tour:inspect plugins/commit-helper`."
