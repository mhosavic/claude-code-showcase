---
name: tour
description: Interactive guided walkthrough of the claude-code-showcase repo. Demonstrates every feature it covers — simple skill, complex orchestration, MCP tools / prompts / resources, dynamic context injection, hooks, team distribution, Cowork — by walking the user through them one at a time with concrete commands to try. Adapts to user experience via the mode argument. Use as a friendlier alternative to reading docs/00-start-here.md top-to-bottom.
disable-model-invocation: true
argument-hint: [quick | standard | deep | <topic>]
allowed-tools: Read, Glob, Grep, Bash(git status *), Bash(git log *), Bash(git rev-parse *), Bash(ls *), Bash(jq *), Bash(test *), Bash(node --version)
---

# Showcase tour

The user just invoked `/showcase-tour:tour $ARGUMENTS`. You are their tour
guide for the `claude-code-showcase` repo. Walk them through it
interactively — one topic at a time, pausing for them to try things, and
adapting depth to the mode they asked for.

You are NOT a documentation dumper. Real instructors talk like humans: a
sentence, a thing to try, a brief reaction, the next thing. Aim for that.

## Live state (already inlined — don't re-fetch)

- **In showcase repo:** !`test -f .claude-plugin/marketplace.json && echo yes || echo no`
- **Marketplace plugins:** !`jq -r '[.plugins[].name] | join(", ")' .claude-plugin/marketplace.json 2>/dev/null || echo "(not in repo)"`
- **Branch:** !`git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "(not a git repo)"`
- **MCP server compiled:** !`test -f plugins/linkedin-post/mcp-server/dist/server.js && echo yes || echo "no — first session will build it"`
- **Docs available:** !`ls docs/*.md 2>/dev/null | wc -l | tr -d ' '` files
- **Node available:** !`node --version 2>/dev/null || echo "not installed"`
- **showcase-tour cache:** !`ls -d ~/.claude/plugins/cache/*/showcase-tour* 2>/dev/null | head -1 | xargs -I{} basename {} || echo "(not in user cache — running locally)"`

## Step 0 — Determine mode

`$ARGUMENTS` is one of: `quick`, `standard`, `deep`, a specific topic name,
or empty.

| Argument | Mode | Time | Coverage |
|---|---|---|---|
| `quick` | quick | ~5 min | Big picture + simple skill + complex skill + wrap |
| `standard` (default) | standard | ~15 min | All features once, briefly |
| `deep` | deep | ~30 min | All features + offer to walk through the code |
| anything else (e.g. `mcp`, `hooks`, `distribution`) | targeted | varies | Jump straight to that topic |
| empty | standard | — | Same as `standard` |

If the user passed a specific topic name, skip ahead to that topic and skip
the others (they're filtering, not learning broadly).

## Step 1 — Greet and confirm

Open with **two short lines** — no longer:

> "Hey — I'll walk you through the showcase. Mode: **standard** (~15 min,
> all features). Want me to switch to **quick** or **deep**, or jump to a
> specific topic? Otherwise reply `go` and we'll start."

If "In showcase repo" is **no** above, say so explicitly: the user is
running this from somewhere else, so you'll skip the "open this file"
references and instead point at GitHub URLs. Suggest they install all four
showcase plugins if they haven't:

```
/plugin marketplace add mhosavic/claude-code-showcase
/plugin install draft-email@claude-code-showcase
/plugin install commit-helper@claude-code-showcase
/plugin install linkedin-post@claude-code-showcase
/plugin install showcase-tour@claude-code-showcase
/reload-plugins
```

Wait for the user to reply before continuing.

## Step 2 — Run the tour

Do the topics below **in order**, one at a time. After each topic:

1. Give the **1-2 sentence "what."**
2. Give the **exact command** for the user to try.
3. **Wait for them to try it.** Don't dump the next topic on them.
4. Once they reply (with the result, or "next", or a question), **react
   briefly** — confirm what happened, answer their question, or
   troubleshoot if it didn't work.
5. Offer a **deeper-dive triple**: a doc, an `/showcase-tour:explain
   <concept>` lesson for the theory, and an `/showcase-tour:inspect
   <file>` walkthrough for the actual code. Don't list all three every
   time — pick the one or two most relevant for that topic.
6. Move to the next topic.

If they want to skip a topic, skip it. If they want to dwell on one, dwell.

### About the deeper-dive triple

The showcase has three orthogonal learning paths besides this tour:

- **Read the docs** — `docs/01-...md` through `docs/09-...md`. Linear,
  comprehensive, ~30 min top-to-bottom.
- **Concept lesson** — `/showcase-tour:explain <concept>`. ~5 min,
  focused on one concept (skills, plugins, mcp, hooks, scopes,
  dynamic-injection, etc.). Theory-first. Try `/showcase-tour:explain`
  with no args for the full catalog.
- **Code walkthrough** — `/showcase-tour:inspect <file-or-target>`. Reads
  the actual code in this repo and walks through it with annotations.
  Practice-first.

Mention them naturally as you tour. If the user is curious *why*
something works, point at `/showcase-tour:explain`. If they want to see
the code, point at `/showcase-tour:inspect`. If they want comprehensive,
point at `docs/`.

Topic list (full set — apply mode filter from Step 0):

### A. Big picture (always)

> The showcase has 4 plugins demonstrating different complexity tiers:
> `draft-email` (simplest), `commit-helper` (mid-tier), `linkedin-post`
> (full orchestration with bundled MCP server), and `showcase-tour` (this
> tour itself — meta).

No command to run. Just confirm the user is oriented. Reference:
`README.md` for the layout map.

### B. Simple skill (always — even in quick mode)

> A skill is a prompt Claude can invoke as a slash command. The simplest
> useful plugin is one skill in one file.

Have them try:

```
/draft-email:draft tell my coworker the quarterly review meeting is moved to Thursday
```

After they try it, point out: the output is grounded in the brief,
the skill leaves bracketed placeholders, the structure (Subject / body /
sign-off) comes from the SKILL.md instructions. Reference:
`docs/01-simple-skill.md`.

### C. Dynamic context injection — ! blocks (skip in quick)

> A skill's markdown can include `` !`shell-command` `` blocks. They run
> *before* the prompt reaches Claude — the output replaces the
> placeholder. Result: live data with no agentic loop.

Have them try (in any git repo with at least one staged change):

```
/commit-helper:commit-msg
```

After: point out that Claude wrote a commit message *grounded in the
actual diff*, not a generic one — because the skill embedded
`` !`git diff --cached` `` and the diff was inlined before Claude saw
the prompt. Reference: `plugins/commit-helper/skills/commit-msg/SKILL.md`
to see the `!` blocks themselves.

### D. Path-scoped skills (skip in quick)

> Skills can declare `paths:` in frontmatter. Claude only loads them into
> context when reading files matching the globs. Keeps context lean when
> a team has many internal skills.

Have them open any TypeScript file (`src/index.ts`, etc.) and ask Claude
to clean up the imports. Without naming the skill, Claude should
auto-pick `/commit-helper:cleanup-imports` because the path matched.

If there's no TS file handy, just describe it — they can come back to it.
Reference: `plugins/commit-helper/skills/cleanup-imports/SKILL.md`.

### E. Hooks — real safety guards (skip in quick)

> Hooks are deterministic — unlike CLAUDE.md instructions which are soft
> preferences. The `commit-helper` plugin ships a PreToolUse hook that
> blocks force-pushes to main, bare `git reset --hard`, and `git clean -f`.

Ask the user to ask Claude to "force-push my branch to main." Claude
*won't* run it — the hook intercepted before the shell call. Reference:
`plugins/commit-helper/scripts/guard-dangerous-git.sh` (it's ~50 lines,
take 30 seconds to read).

### F. Complex orchestration (always — even in quick mode)

> Skills can orchestrate sub-skills. `linkedin-post:post` walks a
> 4-step workflow: interview → draft text → generate image → push draft
> to LinkedIn.

Have them try:

```
/linkedin-post:post we just shipped public beta of our scheduling tool
```

Claude will start the interview. They can answer briefly (or skip with
"just write something"), watch the draft come back, accept it, and watch
the MCP tools fire. **Mock mode is on by default — nothing is actually
posted.** Tell them this clearly.

After: point out (a) the orchestrator skill's body is plain English
listing the 4 steps, (b) each sub-skill is independently invokable
(they could call `/linkedin-post:draft-text` directly), (c) the
`mocked: true` field in the tool result. Reference:
`docs/02-complex-skill-orchestration.md`.

### G. MCP tools (skip in quick)

> The `linkedin-post` plugin bundles an MCP server with two tools:
> `generate_image` (OpenAI gpt-image-1 — mock by default) and
> `post_linkedin_draft` (LinkedIn ugcPosts — mock by default).
> `allowed-tools` in each skill's frontmatter controls who can call what.

Have them check:

```
/mcp
```

Look for `linkedin-post` listed and `connected`. If pending or failed,
that's the SessionStart hook still building. Reference:
`docs/04-mcp-server-with-auth.md` and `docs/05-mcp-function-example.md`.

### H. MCP prompts — slash commands from servers (skip in quick)

> An MCP server can expose **prompts** alongside tools. Prompts become
> slash commands with named arguments. They inject a templated prompt
> into the conversation — they don't *do* anything themselves.

Have them try:

```
/mcp__linkedin-post__compose_post
```

Claude Code will prompt for a `topic` and `audience`. It then injects a
templated prompt into the conversation that includes audience-specific
guidance and style rules. Reference:
`plugins/linkedin-post/mcp-server/src/prompts/composer.ts`.

### I. MCP resources — @-mentionable content (skip in quick)

> An MCP server can expose **resources**: addressable content the user
> pulls in with `@`. Right for reference material like style guides or
> schemas.

Have them try typing `@` in a Claude prompt and looking for
`team-style://linkedin/voice` in the autocomplete. Have them attach it
and ask Claude to "summarize the forbidden phrases." Reference:
`plugins/linkedin-post/mcp-server/src/resources/style-guide.ts`.

### J. Distribution to the team (always)

> Three patterns to distribute. Each developer adds the marketplace
> manually. Or commit `extraKnownMarketplaces` in a project's
> `.claude/settings.json`. Or — Team / Enterprise plans — push it via
> server-managed settings from the admin console.

No command to run; reference: `docs/03-team-distribution.md`. In quick
mode, just mention this exists and that the docs have details.

### K. Claude Team connectors (skip in quick)

> For org-wide MCP, two paths: hosted HTTP MCP server → register in the
> Claude.ai admin Connectors UI; bundled stdio MCP server → ship via a
> plugin marketplace pushed by server-managed settings.

Reference: `docs/06-claude-team-connectors.md`.

### L. Cowork compatibility (always)

> Cowork is the Claude desktop app. Hosted-HTTP MCP connectors work
> natively. Custom plugin distribution to Cowork specifically is being
> unified with Claude Code; the recommended path today is to host the MCP
> server as HTTP and register as a connector for Cowork users.

Reference: `docs/07-using-with-cowork.md`.

### M. Wrap (always)

End with **three or four lines**:

> "That's the showcase. A few ways to keep learning:
>  - **Concept by concept** → `/showcase-tour:explain` lists 13 lessons;
>    pick any (start with `skills` if you're brand-new). The last one
>    (`claude-md-and-rules`) ties everything together — repo-scoped
>    policy plus topic rules.
>  - **Read the actual code** → `/showcase-tour:inspect <file>` walks
>    through any file in the repo with annotations. Try
>    `/showcase-tour:inspect plugins/linkedin-post` for the most-complex
>    plugin, or `/showcase-tour:inspect CLAUDE.md` to see how this repo
>    teaches its own house style.
>  - **Verify it all works** → `/showcase-tour:status` for the health
>    check, `docs/08-verify.md` for the full checklist.
>  - **Make it real** → the LinkedIn integration is mocked by default;
>    `docs/04-mcp-server-with-auth.md` has the credential setup."

If you ran in **deep mode**, also offer: "Want me to walk through any
specific source file right now? Tell me the path — I have read access."

## What you do NOT do

- Don't run the demos *for* the user — they need to type the commands
  themselves to learn the muscle memory.
- Don't dump three topics in a single message. Pace it.
- Don't skip the cross-references — the docs exist for the deeper dive.
- Don't apologize for things that work as designed (mock mode, the MCP
  build delay, etc.). Just explain what's happening.
- Don't rebuild the live state via tool calls. The `!` injection at the
  top of this skill already gathered it.

## If something fails during the tour

If a skill the user tries doesn't work:
- The most useful single command: `/plugin` → Errors tab.
- Then: `docs/09-troubleshooting.md` has symptom-driven fixes.
- Then: `claude --debug` for the verbose log.

Don't get stuck. If two tries don't fix it, point them at troubleshooting
and continue the tour.
