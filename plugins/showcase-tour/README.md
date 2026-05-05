# showcase-tour

The "two-in-one" plugin: it's a useful set of skills (interactive
walkthrough + concept lessons + code walkthroughs + health check) AND
it demonstrates skill-building by being a skill itself.

## What it adds

| Skill | What it does | Time |
|---|---|---|
| `/showcase-tour:tour [quick\|standard\|deep\|<topic>]` | Interactive guided tour of every feature in the showcase. Adapts to mode and to what's installed. | 5 / 15 / 30 min |
| `/showcase-tour:explain [concept]` | Concept curriculum. With no args, lists 13 concepts with one-line definitions (glossary mode). With a concept name, loads that concept's full lesson (~5 min). | 30s glossary / 5 min lesson |
| `/showcase-tour:inspect <target>` | Code walkthrough — reads any file/plugin/skill in the showcase and explains it line-by-line with annotations. | 5-10 min |
| `/showcase-tour:status` | 30-second health check: which plugins are installed, MCP server build state, prerequisite tooling. | 30s |

## The three-skill learning system

The skills are designed to compose:

- **`/showcase-tour:tour`** is the **breadth-first** path. Walks through
  every feature once.
- **`/showcase-tour:explain <concept>`** is the **theory-first** path.
  Pick a concept (skills, plugins, hooks, mcp, etc.); get a focused
  5-minute lesson with examples.
- **`/showcase-tour:inspect <file>`** is the **code-first** path. Reads
  the actual file with you and explains as it goes.

Use them however suits you. The tour also points to the other two at
relevant moments.

## Concept catalog (for `/showcase-tour:explain`)

Thirteen concepts, ordered as a curriculum:

1. `skills` — the prompt-as-slash-command primitive
2. `plugins` — bundling unit (covers `userConfig`)
3. `marketplaces` — distribution + 3 patterns
4. `scopes` — user / project / plugin / managed
5. `dynamic-injection` — `!` blocks in skill bodies
6. `path-scoping` — `paths:` frontmatter
7. `skill-controls` — `allowed-tools`, `disable-model-invocation`, etc.
8. `subagents` — isolated context workers
9. `hooks` — deterministic lifecycle handlers
10. `mcp` — protocol overview, the 3 primitives
11. `mcp-tools` — verbs Claude invokes
12. `mcp-prompts-resources` — slash commands + `@`-mentions from servers
13. `claude-md-and-rules` — repo-scoped policy layer (advisory, contrast with hooks)

Each concept lives at
`plugins/showcase-tour/skills/explain/references/<concept>.md` and
follows the same template: **what / mental model / example / when-to-use
/ try-this**.

## Inspectable targets (for `/showcase-tour:inspect`)

Anything in the repo. Common targets recognized as keywords:

| You type… | It reads… |
|---|---|
| `the marketplace` | `.claude-plugin/marketplace.json` |
| `the settings` | `.claude/settings.json` |
| `the MCP server` | `plugins/linkedin-post/mcp-server/src/server.ts` |
| `the orchestrator` | `plugins/linkedin-post/skills/post-to-linkedin/SKILL.md` |
| `the hook` | `plugins/commit-helper/scripts/guard-dangerous-git.sh` |
| `the subagent` | `plugins/linkedin-post/agents/post-coordinator.md` |
| `the tour` | `plugins/showcase-tour/skills/tour/SKILL.md` |
| `CLAUDE.md` / `the house style` | `CLAUDE.md` |
| `the rules` | `.claude/rules/` (skill-writing.md, mcp-server.md, concept-references.md) |
| `the tests` | `plugins/linkedin-post/mcp-server/src/__tests__/` |

You can also pass any literal path, plugin name (`draft-email`,
`linkedin-post`, `commit-helper`, `showcase-tour`), or skill name
(`commit-msg`, `compose_post`, `tour`).

## Why a meta-plugin

Two reasons. First, it lowers the barrier to entry — Francis (or any
new team member) types one command and the showcase teaches itself. No
reading 11 doc pages cold.

Second, it's pedagogical-by-existing: the tour skill itself uses every
feature the showcase teaches:

- It's a **plugin** (Q1 — simple plugin shape).
- The tour skill uses **dynamic context injection** (`` !`cmd` `` blocks
  at the top to detect repo and install state — same pattern as
  `commit-helper`).
- The tour skill **orchestrates** by walking the user through invoking
  the other plugins' skills (same pattern as `linkedin-post:post`).
- All four skills use `disable-model-invocation: true` because they're
  deliberate user actions (same pattern as the `linkedin-post`
  orchestrator).
- The `explain` skill uses **progressive disclosure** — a small
  dispatcher SKILL.md plus 12 reference files in `references/` that
  load only when their topic is requested. This is Anthropic's
  recommended pattern for large reference content.

When the tour explains what these patterns are, it's pointing at itself.

## File anatomy

```
showcase-tour/
├── .claude-plugin/plugin.json
├── README.md
└── skills/
    ├── tour/SKILL.md                    ← the interactive walkthrough
    ├── explain/
    │   ├── SKILL.md                     ← the dispatcher / glossary
    │   └── references/                  ← lazy-loaded concept files
    │       ├── skills.md
    │       ├── plugins.md
    │       ├── marketplaces.md
    │       ├── scopes.md
    │       ├── dynamic-injection.md
    │       ├── path-scoping.md
    │       ├── skill-controls.md
    │       ├── subagents.md
    │       ├── hooks.md
    │       ├── mcp.md
    │       ├── mcp-tools.md
    │       ├── mcp-prompts-resources.md
    │       └── claude-md-and-rules.md
    ├── inspect/SKILL.md                 ← the code walkthrough
    └── status/SKILL.md                  ← the health check
```

No bundled MCP server, no hooks, no agents. Just four skills that
compose.

## Maintenance

When the showcase grows new plugins or features, this is the place to
update:

- New plugin → add a topic section in `tour/SKILL.md`, a row in
  `status/SKILL.md`, and (if it introduces a new concept) a reference
  file under `explain/references/`.
- New MCP primitive (e.g. resource templates) → add a concept reference
  file.
- Renamed skill → update example commands in tour and references.

The skills are intentionally written as top-to-bottom checklists so a
new maintainer can edit them without learning a new abstraction.
