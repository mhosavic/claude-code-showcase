# claude-code-showcase

[![test](https://github.com/mhosavic/claude-code-showcase/actions/workflows/test.yml/badge.svg)](https://github.com/mhosavic/claude-code-showcase/actions/workflows/test.yml)

Reference plugins for Claude Code. Built to answer six concrete questions
about how to set up, distribute, and extend Claude Code on a real team —
plus a Cowork-compatibility note.

| # | Question | Where to look |
|---|---|---|
| 1 | What does the file structure of a **simple skill** look like? | `plugins/draft-email/` + [`docs/01-simple-skill.md`](docs/01-simple-skill.md) |
| 2 | How do you orchestrate a **complex skill** with sub-skills, an agent, and an MCP server? | `plugins/linkedin-post/` + [`docs/02-complex-skill-orchestration.md`](docs/02-complex-skill-orchestration.md) |
| 3 | How do you **share with the team** in Claude Team? | [`docs/03-team-distribution.md`](docs/03-team-distribution.md) |
| 4 | What does an **MCP server with credentials and per-skill scoping** look like? | `plugins/linkedin-post/mcp-server/` + [`docs/04-mcp-server-with-auth.md`](docs/04-mcp-server-with-auth.md) |
| 5 | What does an **MCP function** look like in code (tools + prompts + resources)? | [`docs/05-mcp-function-example.md`](docs/05-mcp-function-example.md) |
| 6 | How do you **add an MCP in Claude Team as a connector** so individual workstations don't have to set it up? | [`docs/06-claude-team-connectors.md`](docs/06-claude-team-connectors.md) |
| 7 | Bonus — Compatibility with **Claude Cowork** (the desktop app). | [`docs/07-using-with-cowork.md`](docs/07-using-with-cowork.md) |
| 8 | Bonus — How do you set **repo-wide instructions** with `CLAUDE.md` and `.claude/rules/`? | [`CLAUDE.md`](CLAUDE.md) + [`.claude/rules/`](.claude/rules/) + `/showcase-tour:explain claude-md-and-rules` |

A third plugin, `plugins/commit-helper/`, also ships in the marketplace.
It's a "middle tier" between simple and complex, demonstrating three
features the others don't: dynamic context injection (`` !`cmd` `` blocks
in skills), path-scoped skill activation, and a real PreToolUse hook.

A fourth plugin, `plugins/showcase-tour/`, is a meta-plugin and a
self-contained learning curriculum:

- **`/showcase-tour:tour`** — interactive walkthrough of every feature.
- **`/showcase-tour:explain <concept>`** — focused 5-minute concept
  lesson. 13 concepts cover skills, plugins, marketplaces, scopes,
  dynamic-injection, path-scoping, skill-controls, subagents, hooks,
  the MCP trio (mcp / mcp-tools / mcp-prompts-resources), and
  claude-md-and-rules. With no args, lists all 13 with one-line
  definitions (glossary mode).
- **`/showcase-tour:inspect <target>`** — reads any file/plugin/skill in
  the showcase and walks through it line-by-line with annotations.
- **`/showcase-tour:status`** — 30-second installation health check.

The plugin's skills compose: the tour suggests `explain` and `inspect`
at relevant points, and the concept lessons cross-reference each other
plus point at concrete files to inspect. The tour itself uses every
pattern it teaches — it's a worked example of skill-building.

> **Where to start:** [`docs/prerequisites.md`](docs/prerequisites.md) →
> install the plugins → run `/showcase-tour:tour`. The tour walks through
> every feature with concrete commands. Or skip the tour and pick a
> concept from `/showcase-tour:explain` if you already know what you want
> to learn. Or jump to [`docs/00-start-here.md`](docs/00-start-here.md)
> if you'd rather read prose.

## Layout

```
claude-code-showcase/
├── README.md                              ← you are here
├── CLAUDE.md                              ← repo-scoped policy (loaded every turn)
├── .claude-plugin/
│   └── marketplace.json                   ← lists all four plugins
├── .claude/
│   ├── settings.json                      ← bootstraps the marketplace
│   │                                        for anyone who clones the repo
│   └── rules/                             ← topic-specific guidance referenced from CLAUDE.md
│       ├── skill-writing.md
│       ├── mcp-server.md
│       └── concept-references.md
├── plugins/
│   ├── draft-email/                       ← Q1 — simplest possible plugin
│   │   ├── .claude-plugin/plugin.json
│   │   └── skills/draft-email/SKILL.md
│   ├── commit-helper/                     ← demos !-injection, paths:, hook
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/
│   │   │   ├── commit-msg/SKILL.md
│   │   │   ├── yesterday-summary/SKILL.md
│   │   │   └── cleanup-imports/SKILL.md
│   │   ├── hooks/hooks.json
│   │   └── scripts/guard-dangerous-git.sh
│   ├── showcase-tour/                     ← meta-plugin: tour + curriculum + inspector
│   │   ├── .claude-plugin/plugin.json
│   │   └── skills/
│   │       ├── tour/SKILL.md              ← interactive walkthrough
│   │       ├── explain/                   ← concept curriculum (13 lessons)
│   │       │   ├── SKILL.md
│   │       │   └── references/*.md       ← lazy-loaded concept files
│   │       ├── inspect/SKILL.md           ← code walkthroughs
│   │       └── status/SKILL.md            ← health check
│   └── linkedin-post/                     ← Q2, Q4, Q5 — orchestration + MCP
│       ├── .claude-plugin/plugin.json
│       ├── skills/
│       │   ├── post-to-linkedin/          ← orchestrator
│       │   ├── interview-for-post/        ← sub-skill 1
│       │   ├── draft-post-text/           ← sub-skill 2
│       │   └── generate-post-image/       ← sub-skill 3
│       ├── agents/post-coordinator.md     ← optional alt-orchestrator
│       └── mcp-server/                    ← bundled stdio MCP server (TypeScript)
│           └── src/
│               ├── server.ts              ← registerTool + registerPrompt + registerResource
│               ├── auth.ts                ← env-var loading, mock-mode
│               ├── tools/                 ← generate_image, post_linkedin_draft
│               ├── prompts/composer.ts    ← MCP prompt → slash command
│               ├── resources/style-guide.ts ← MCP resource → @-mention
│               └── __tests__/             ← vitest unit tests (mock + schema + auth)
└── docs/
    ├── prerequisites.md                   ← what to install first
    ├── 00-start-here.md                   ← guided tour
    ├── 01-simple-skill.md                 ← Q1
    ├── 02-complex-skill-orchestration.md  ← Q2
    ├── 03-team-distribution.md            ← Q3, plus user/project/plugin scopes
    ├── 04-mcp-server-with-auth.md         ← Q4
    ├── 05-mcp-function-example.md         ← Q5
    ├── 06-claude-team-connectors.md       ← Q6
    ├── 07-using-with-cowork.md            ← Cowork compatibility
    ├── 08-verify.md                       ← end-to-end check that everything works
    └── 09-troubleshooting.md              ← when something doesn't
```

## Quick start

### Option A — Add the marketplace globally

```
/plugin marketplace add mhosavic/claude-code-showcase
/plugin install draft-email@claude-code-showcase
/plugin install commit-helper@claude-code-showcase
/plugin install linkedin-post@claude-code-showcase
/plugin install showcase-tour@claude-code-showcase
/reload-plugins
```

Three entry points — pick the one that fits how you learn:

```
/showcase-tour:tour              # interactive walkthrough, ~15 min
/showcase-tour:explain skills    # 5-min focused lesson on one concept
/showcase-tour:inspect plugins/draft-email   # walk through actual code
```

Or get the catalog of all 13 concept lessons:

```
/showcase-tour:explain           # lists every concept with a 1-line def
```

Or pick a tour mode:

```
/showcase-tour:tour quick        # 5-min big picture only
/showcase-tour:tour deep         # 30-min everything + offer to read source
/showcase-tour:tour mcp          # just the MCP topic
```

### Option B — Clone the repo and self-bootstrap

```bash
git clone https://github.com/mhosavic/claude-code-showcase.git
cd claude-code-showcase
claude
```

`.claude/settings.json` declares the marketplace and lists all four
plugins as enabled. Claude Code prompts you to accept on first launch.
Say yes, then run `/showcase-tour:tour` — or read
[`docs/00-start-here.md`](docs/00-start-here.md) if you'd rather follow
the docs.

### Verify everything works

```
/showcase-tour:status
```

For a deeper checklist, [`docs/08-verify.md`](docs/08-verify.md) is the
10-step copy-paste version.

## Mock vs real

The `linkedin-post` plugin's MCP server defaults to **mock mode**. The
`generate_image` and `post_linkedin_draft` tools log what they would do
and return canned successes — nothing actually posted, no API calls, no
credentials required.

To switch to real mode, see [`docs/04-mcp-server-with-auth.md`](docs/04-mcp-server-with-auth.md).
You'll need an OpenAI API key and a LinkedIn 3-legged OAuth token.

## License

MIT.
