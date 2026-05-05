# `claude.com/plugins` submission package

Paste-ready answers for every plugin in this repo. Submit each plugin
separately at <https://claude.ai/settings/plugins/submit> (signed in
as `mhosavic`). I cannot submit on your behalf — Anthropic's
submission flow is browser-only and gated by your account.

This file lives at the repo root so you can copy fields straight
into the form.

---

## 1. `draft-email`

**Repository URL:**
`https://github.com/mhosavic/claude-code-showcase`

**Plugin path within repo:**
`plugins/draft-email`

**Short description (≤100 chars):**
> A simple `/draft-email:draft` skill that writes polite, well-structured emails from a one-line brief.

**Long description (≤500 chars):**
> The minimum-viable Claude Code plugin: a single SKILL.md that drafts emails in any language, given a one-line description. Output includes subject line, body, and sign-off; tone adapts to the audience (peer / client / executive). Bracketed placeholders flag missing details rather than hallucinating. Bilingual (English / Français) — the email matches the brief's language. Useful as a teaching example of the simplest possible plugin shape.

**Category:** `productivity` (or `writing` if available)

**Tags:** `email`, `writing`, `skill`, `starter`, `bilingual`

**Target surfaces:** ✓ Claude Code, ✓ Claude Cowork

**What users get:**
- One slash command: `/draft-email:draft <one-line description>`
- Subject line + body + sign-off, ~100–150 words
- Bracketed placeholders for missing details (no hallucinated names / dates)
- Works in English or French — matches the brief's language

**Permissions / scopes used:** None (pure prompt skill, no Bash, no MCP).

**Mock vs real:** Pure prompt — no API calls, no credentials.

**Notes for review:**
This is the "minimum viable plugin" example from a teaching repo
(<https://github.com/mhosavic/claude-code-showcase>). It's three
files (manifest + skill + readme). Useful as a reference for
new plugin authors.

---

## 2. `commit-helper`

**Repository URL:**
`https://github.com/mhosavic/claude-code-showcase`

**Plugin path within repo:**
`plugins/commit-helper`

**Short description (≤100 chars):**
> Three Claude Code patterns: bang-block context injection, path-scoped skills, and a safety hook.

**Long description (≤500 chars):**
> Mid-tier teaching plugin showing three Claude Code features: (1) dynamic context injection — `/commit-helper:commit-msg` writes commit messages grounded in the actual `git diff --cached`; (2) path-scoped activation — `/commit-helper:cleanup-imports` only loads when reading TS/JS files; (3) a real PreToolUse hook that blocks dangerous git commands (force-push to main, `reset --hard`, `clean -f`). Useful in any git project. Bilingual.

**Category:** `development` (or `git` if available)

**Tags:** `git`, `commit`, `hook`, `safety`, `dynamic-injection`, `bilingual`

**Target surfaces:** ✓ Claude Code only (uses bang-injection and PreToolUse hooks — Claude-Code-specific features)

**What users get:**
- `/commit-helper:commit-msg` — writes a commit message from your staged changes
- `/commit-helper:yesterday` — stand-up summary of the last 24 hours of commits
- `/commit-helper:cleanup-imports` — sorts and dedupes TS/JS imports (path-scoped)
- A PreToolUse hook that blocks force-push to main, `git reset --hard`, and `git clean -f`

**Permissions / scopes used:**
- `Bash(git diff *)`, `Bash(git log *)`, `Bash(git rev-parse *)`,
  `Bash(git status *)` — for reading repo state via bang-blocks.

**Mock vs real:** Real — runs git commands against your repo.

**Notes for review:**
Same showcase repo as `draft-email`. The hook script is in
`plugins/commit-helper/scripts/guard-dangerous-git.sh` (~50 lines)
and is smoke-tested in CI. Hook fires only on `Bash` tool calls —
never affects other tools.

---

## 3. `linkedin-post`

**Repository URL:**
`https://github.com/mhosavic/claude-code-showcase`

**Plugin path within repo:**
`plugins/linkedin-post`

**Short description (≤100 chars):**
> Orchestrate a complete LinkedIn post: interview, draft, generate image, push draft. Mock by default.

**Long description (≤500 chars):**
> Full-orchestration plugin: `/linkedin-post:post` walks a 4-step workflow (interview → draft → generate image → push draft to LinkedIn). Bundles a TypeScript MCP server with two tools (`generate_image` via OpenAI gpt-image-1, `post_linkedin_draft` via the LinkedIn ugcPosts API), one prompt (`compose_post`), and one resource (style guide). Mock-mode by default — no credentials needed to evaluate. Real mode requires OpenAI + LinkedIn OAuth credentials. Bilingual.

**Category:** `productivity` (or `social` if available)

**Tags:** `linkedin`, `social`, `orchestration`, `mcp`, `image-generation`, `bilingual`

**Target surfaces:** ✓ Claude Code, ✓ Claude Cowork (via the bundled HTTP transport — see Cowork section below)

**What users get:**
- 4 skills: `/linkedin-post:post`, `/linkedin-post:interview`,
  `/linkedin-post:draft-text`, `/linkedin-post:generate-image`
- 1 MCP prompt: `/mcp__linkedin-post__compose_post` with `topic` and `audience` args
- 1 MCP resource: `team-style://linkedin/voice` (style guide)
- 1 subagent: `post-coordinator` for the alt-orchestration path
- Per-skill `allowed-tools` so only the orchestrator can publish

**Permissions / scopes used:**
- `mcp__linkedin-post__post_linkedin_draft` (orchestrator only)
- `mcp__linkedin-post__generate_image` (image skill only)
- `userConfig` for `MOCK_MODE`, `OPENAI_API_KEY`,
  `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_PERSON_URN`

**Mock vs real:** Mock by default. Real mode requires:
- OpenAI API key (for `generate_image`)
- LinkedIn 3-legged OAuth access token + person URN (for posting)

**Cowork support:**
The MCP server ships with **two transport entry points** —
`server.ts` (stdio, for Claude Code) and `server-http.ts` (Streamable
HTTP, for Cowork's custom-connector flow). A Cloudflare Workers
deploy is documented at `cloudflare/README.md` (free tier covers
~100k requests/day). Same business logic, two transports.

**Notes for review:**
Mock mode is a true short-circuit — the real-mode `fetch` calls are
gated by an explicit `if (config.mockMode) return mockResult(...)`
at the top of each tool. Three end-to-end protocol tests verify
the HTTP transport. 28 unit tests in CI.

---

## 4. `showcase-tour`

**Repository URL:**
`https://github.com/mhosavic/claude-code-showcase`

**Plugin path within repo:**
`plugins/showcase-tour`

**Short description (≤100 chars):**
> Interactive bilingual tour of the claude-code-showcase repo. 13-concept curriculum + code inspector.

**Long description (≤500 chars):**
> Meta-plugin and self-contained learning curriculum for the claude-code-showcase. `/showcase-tour:tour` is an interactive walkthrough (quick / standard / deep / cowork modes). `/showcase-tour:explain <concept>` is a 13-concept curriculum (skills, plugins, marketplaces, MCP trio, hooks, scopes, etc.) — each concept has a focused 5-minute lesson. `/showcase-tour:inspect <file>` reads the actual code with annotations. `/showcase-tour:status` is a 30-second installation health check. Bilingual.

**Category:** `learning` (or `tutorial` if available)

**Tags:** `tour`, `tutorial`, `meta`, `claude-code`, `cowork`, `bilingual`, `curriculum`

**Target surfaces:** ✓ Claude Code only (Cowork support deferred — relies on `/plugin install` of the other showcase plugins to demo against)

**What users get:**
- `/showcase-tour:tour [quick|standard|deep|cowork] [en|fr]` — interactive walkthrough
- `/showcase-tour:explain [concept]` — 13-concept curriculum
- `/showcase-tour:inspect <target>` — code walkthroughs
- `/showcase-tour:status` — health check

**Permissions / scopes used:**
- Read, Glob, Grep
- `Bash(test *)`, `Bash(jq *)`, `Bash(git rev-parse *)`,
  `Bash(ls *)`, `Bash(node --version)` — for live state gathering.

**Mock vs real:** N/A — no external API calls.

**Notes for review:**
This plugin is pedagogical: the tour itself uses every pattern it
teaches (progressive disclosure via `references/`, language gate,
mode argument, `disable-model-invocation`). Useful as a reference
for skill-building.

---

## After submission

Anthropic typically reviews within ~5 business days. Once approved:

1. The plugin appears in the catalog at <https://claude.com/plugins>.
2. Claude Code users can install with
   `/plugin install <name>@claude-plugins-official` (no marketplace
   add needed).
3. Cowork users see it under **Settings → Plugins**.
4. Custom-marketplace installs from
   `mhosavic/claude-code-showcase` continue to work in parallel —
   useful for development and for users who prefer not to wait for
   review on bug fixes.

## What to update before re-submitting (if anything changes)

- Bump `version` in the plugin's `plugin.json` AND in
  `.claude-plugin/marketplace.json`.
- Push to `main`. The GitHub Action runs build + tests + manifest
  validation.
- File a re-submission via the same form — Anthropic ties
  submissions to repository, not version.

## Marketing / discovery extras (optional, not required for submission)

If Anthropic's form asks for these, paste from below. Otherwise
skip.

**One-line tagline (for the catalog card):**
- `draft-email` — "Polite emails, one line in."
- `commit-helper` — "Commits grounded in your actual diff. Plus a guard against rewriting history."
- `linkedin-post` — "Interview → draft → image → publish. Mocks by default."
- `showcase-tour` — "Learn Claude Code by walking through a real plugin showcase."

**Recommended demo command** (for the catalog page):
- `draft-email` — `/draft-email:draft thank my mentor for last week's coffee chat`
- `commit-helper` — `/commit-helper:commit-msg`
- `linkedin-post` — `/linkedin-post:post we just shipped public beta of our scheduling tool`
- `showcase-tour` — `/showcase-tour:tour quick`

**Screenshot stubs** (if the form asks):
Anthropic's submission form may request 1–3 screenshots showing
the plugin in action. The fastest way to capture these:

```bash
# Run the demo command in Claude Code, screenshot the terminal at:
# 1. The skill firing (slash command + first response)
# 2. A representative output
# 3. (For linkedin-post) the /mcp panel showing the connected server
```

I haven't bundled screenshots in the repo. Capture them when you
submit — Anthropic typically accepts PNG / JPG up to ~2MB each.
