# CLAUDE.md — claude-code-showcase

This file is loaded into Claude's context every time it works in this
repo. It acts as the project's "house style" — durable instructions that
shouldn't have to be repeated each conversation.

This particular `CLAUDE.md` doubles as a teaching artifact: it shows what
project-scoped instructions look like in practice. For the theory, see
`/showcase-tour:explain claude-md-and-rules`.

## What this repo is

Reference plugins for Claude Code. Four plugins with deliberately
graduated complexity:

| Plugin | Showcases |
|---|---|
| `draft-email` | The minimum viable plugin — one skill, no extras. |
| `commit-helper` | Mid-tier — `!`-injection, `paths:` scoping, a real `PreToolUse` hook. |
| `linkedin-post` | Full orchestration — sub-skills, a subagent, a bundled stdio MCP server with credentials. |
| `showcase-tour` | Meta-plugin — interactive tour, concept curriculum, code inspector, health check. |

The repo also ships:

- A marketplace at `.claude-plugin/marketplace.json` so the four plugins
  can be installed with `/plugin install` after one `marketplace add`.
- Bootstrap settings at `.claude/settings.json` so anyone who clones the
  repo gets the plugins offered on first launch.
- Eleven docs in `docs/` answering the six questions Francis raised plus
  Cowork compatibility, verification, and troubleshooting.

## House rules — code

1. **Do not change a plugin's `version` without a reason.** The number is
   how downstream users decide whether to update. Bumping it casually
   churns everyone's settings.
2. **Mock-mode is the default.** `linkedin-post`'s MCP server defaults to
   `MOCK_MODE=true`. Never remove the mock branch when adding a real-mode
   path — the mock is what makes this repo demoable without credentials.
3. **MCP server source lives in TypeScript.** The compiled `dist/` is
   `.gitignored`. Builds run via the plugin's `SessionStart` hook on
   first launch. Don't commit `dist/`.
4. **Skills with side effects must set `disable-model-invocation: true`.**
   Anything that posts, deletes, mutates state, or spends API credit is
   user-triggered only. The orchestrator and the LinkedIn-poster skills
   already do this — match the pattern.
5. **Hook scripts must be idempotent and fast.** `commit-helper`'s
   `guard-dangerous-git.sh` runs on every Bash call; anything slower than
   ~50ms there will degrade the user's experience.

See `.claude/rules/` for longer-form, topic-specific guidance that
doesn't fit in this file (e.g., how to write a new concept reference,
how to add an MCP tool).

## House rules — docs

- The 11 doc pages in `docs/` are answers to specific questions, not
  open-ended tutorials. Each page has a clear scope. If a topic does not
  fit cleanly into one of them, add a new file rather than overloading.
- The 12 concept references under
  `plugins/showcase-tour/skills/explain/references/` follow a strict
  template: **what / mental model / example from this showcase / when to
  use vs alternatives / try this**. New concepts must use the same
  template — see `.claude/rules/concept-references.md`.
- Cross-references between docs use relative paths (`docs/04-…`), not
  GitHub URLs, so they work in local clones and forks.

## Where to look when…

| Task | Open |
|---|---|
| Adding a new plugin | `.claude-plugin/marketplace.json`, then mirror an existing plugin's structure under `plugins/`. |
| Adding a new MCP tool | `plugins/linkedin-post/mcp-server/src/tools/` — copy `images.ts` as the template; register in `server.ts`. |
| Adding a new concept lesson | `.claude/rules/concept-references.md` — and update the catalog table in `skills/explain/SKILL.md`. |
| Writing a new skill anywhere | `.claude/rules/skill-writing.md` — frontmatter checklist, tone, what to avoid. |
| Updating the tour | `plugins/showcase-tour/skills/tour/SKILL.md` — keep section structure intact, the `quick/standard/deep` modes branch on it. |

## Working with this repo

- Use `/showcase-tour:status` to confirm the plugins are loaded and the
  MCP server is built before testing changes.
- After editing a skill, `/reload-plugins` (or restart Claude Code) — the
  cache won't pick up changes otherwise.
- The `linkedin-post` MCP server lives at
  `plugins/linkedin-post/mcp-server/`. From there: `npm install && npm
  run build`. Tests: `npm test`. The plugin's `SessionStart` hook does
  this automatically on first launch in mock mode.

## What this repo is *not*

- Not a Claude Code distribution. Bugs in Claude Code itself belong on
  the Anthropic side.
- Not a production LinkedIn poster. The real-mode path works but the
  intent is pedagogy — credentials, error handling, and quota awareness
  are demonstration-grade.
- Not a substitute for the docs. The skills here teach by example;
  reference material lives at https://docs.claude.com/en/docs/claude-code/.

## When in doubt

- New contributor? Run `/showcase-tour:tour` once before editing
  anything. Twelve minutes saves an hour of guessing.
- Writing a new file in an unfamiliar area? Run
  `/showcase-tour:inspect <nearest-existing-file>` to see the convention
  it should follow.
- Concept feels half-understood? `/showcase-tour:explain <concept>` —
  twelve five-minute lessons, ordered as a curriculum.
