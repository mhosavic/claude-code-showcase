# Start here

Two paths through the showcase. Pick one.

| Path | Time | Format |
|---|---|---|
| **Interactive tour** — `/showcase-tour:tour` | 5–30 min depending on mode | Claude walks you through every feature with concrete commands. Adapts to your experience level. |
| **This document** | ~30 min top-to-bottom | Linear written tour. Pause and try things as you go. Cross-references the deeper docs. |

The interactive tour is usually the faster path for hands-on learners.
This document is better if you want to read first and try later, or if
the tour skill ever feels too rigid for you.

> **Before either path:** make sure your machine is ready —
> [`prerequisites.md`](prerequisites.md). About 5 minutes if Claude Code
> isn't already installed.

---

## Step 1 — Install Claude Code (if you haven't yet)

Skip if you can already run `claude` in a terminal. Otherwise:

```bash
brew install claude-code            # macOS / Linux / WSL
# or
npm install -g @anthropic-ai/claude-code
claude                              # opens browser to sign in
```

A paid plan (Pro / Max / Team / Enterprise) is required for plugins, MCP
servers, and Cowork. Free tier won't work.

If you're on **Claude Team or Enterprise** — sign in with your work email.
Section [Step 7](#step-7--claude-team-deployment-q6) covers admin push.

---

## Step 2 — Get this showcase into your Claude Code

Three options. **Pick one.**

### 2a. Clone and open (recommended for first time)

```bash
git clone https://github.com/mhosavic/claude-code-showcase.git
cd claude-code-showcase
claude
```

`.claude/settings.json` declares this repo as a marketplace AND lists all
three plugins as enabled. On first launch you'll see prompts:

1. *"Trust this workspace?"* → yes.
2. *"This project wants to install 3 plugins. Allow?"* → yes.
3. *"Plugin includes hooks / shell commands. Allow?"* → yes (the hook is
   `commit-helper`'s git safety guard — see
   `plugins/commit-helper/scripts/guard-dangerous-git.sh`, ~50 lines).
4. *"Plugin includes MCP server. Allow?"* → yes (the LinkedIn server,
   defaulted to mock mode, no credentials needed).

### 2b. Run on the web (no local install)

After pushing this repo (or your fork) to GitHub:

1. Open <https://claude.ai/code>.
2. Connect your GitHub account.
3. Pick the showcase repo.
4. Start a session. Cloud sessions clone the repo and pick up
   `.claude/settings.json` automatically.

### 2c. Add the marketplace from another project

If you want the showcase plugins available everywhere on your machine:

```
/plugin marketplace add mhosavic/claude-code-showcase
/plugin install draft-email@claude-code-showcase
/plugin install commit-helper@claude-code-showcase
/plugin install linkedin-post@claude-code-showcase
/reload-plugins
```

---

## Step 3 — Try the simple skill (Q1)

```
/draft-email:draft tell my coworker the quarterly review meeting is moved to Thursday
```

Claude responds with a 100-150 word email — Subject line, greeting, 2
paragraph body, sign-off, bracketed placeholders for things you didn't
specify.

📖 What happened, and how the file structure works:
[`01-simple-skill.md`](01-simple-skill.md).

---

## Step 4 — Try the middle-tier plugin (`commit-helper`)

This plugin demonstrates three features the simple/complex plugins don't:

### 4a. Dynamic context injection

Make sure something is staged in any git repo, then run:

```
/commit-helper:commit-msg
```

The skill's markdown contains `` !`git diff --cached` `` blocks. Those run
*before* the prompt reaches Claude — the diff is already inlined when
Claude sees it. Result: a commit message grounded in your actual changes,
no agentic loop required.

### 4b. Path-scoped skill activation

The `cleanup-imports` skill declares `paths: ["**/*.ts", "**/*.tsx", ...]`
in its frontmatter. It only loads into Claude's context when you're
working with TypeScript / JavaScript files. In a Python project, it's
invisible — no token cost.

```
/commit-helper:cleanup-imports
```

### 4c. PreToolUse hook (a real safety guard)

The plugin ships a hook in `hooks/hooks.json`. It runs before every Bash
call and blocks three irrecoverable git operations: force-push to main,
bare `git reset --hard`, and `git clean -fd`.

Try:

```
push my current branch to main with --force
```

Claude won't run it. The hook intercepted before the shell call happened.

📖 Full breakdown:
[`plugins/commit-helper/README.md`](../plugins/commit-helper/README.md).

---

## Step 5 — Try the complex orchestration (Q2)

```
/linkedin-post:post we just shipped public beta of our scheduling tool, want to share with founders / CTOs
```

Claude walks through:

1. **Interview** — asks audience, goal, tone, image preference.
2. **Draft** — writes ~150-word post text, shows it for approval.
3. **Image** — if you said yes, generates one (mock placeholder URL by
   default).
4. **Push** — calls the LinkedIn MCP tool. Returns a fake URN with a
   clear "mock" note. Nothing posted.

📖 How orchestration works, single-skill vs sub-agent patterns, when each
applies:
[`02-complex-skill-orchestration.md`](02-complex-skill-orchestration.md).

---

## Step 6 — Share with your team (Q3)

You're now running the plugins locally. Three patterns to give the rest of
your team the same experience:

- **Each developer adds the marketplace.** Fast, works on every plan.
- **`extraKnownMarketplaces` per project.** Auto-prompt on workspace
  trust. What this showcase repo itself does.
- **Server-managed settings.** Team / Enterprise plans only — admin push
  from claude.ai admin console.

This page also covers the **three skill scopes** — personal
(`~/.claude/skills/`), project (`<repo>/.claude/skills/`), plugin
(`<plugin>/skills/`) — and when to use each:

📖 [`03-team-distribution.md`](03-team-distribution.md).

---

## Step 7 — Make the LinkedIn integration real (Q4 + Q5)

Right now everything is mocked. To switch to real:

- **OpenAI API key** for image generation.
- **LinkedIn 3-legged OAuth token** + person URN for posting.

📖 Step-by-step credential setup, the MCP server's auth model, per-skill
scoping with `allowed-tools`, and how `userConfig` keeps secrets in the
keychain:
[`04-mcp-server-with-auth.md`](04-mcp-server-with-auth.md).

📖 Annotated walkthrough of the actual TypeScript — the three things an
MCP server can register (tools, prompts, resources) and what each one
becomes in Claude Code:
[`05-mcp-function-example.md`](05-mcp-function-example.md).

---

## Step 8 — Claude Team deployment (Q6)

Two paths depending on whether your MCP server is hosted (HTTP) or
bundled (stdio):

- **Hosted HTTP** → register as a connector in Claude.ai admin console.
  Every team member sees it after one sign-in.
- **Bundled stdio** → push the plugin marketplace via server-managed
  settings. Plugin installs automatically; each user provides their own
  credentials via `userConfig` once.

📖 Both paths with admin steps:
[`06-claude-team-connectors.md`](06-claude-team-connectors.md).

---

## Step 9 — Use this with Claude Cowork

Cowork is the Claude desktop app with agentic features. It uses the same
connector infrastructure for hosted MCP servers, but custom plugin
distribution to Cowork specifically is being unified with Claude Code.

📖 What works today, what's still being unified, recommended path for
custom team plugins:
[`07-using-with-cowork.md`](07-using-with-cowork.md).

---

## Step 10 — Verify it all works

[`08-verify.md`](08-verify.md) is a 10-step copy-paste checklist. Run
through it once to make sure everything described above is actually
working on your machine.

If something's broken: [`09-troubleshooting.md`](09-troubleshooting.md).

---

## Where to go next

- **Start a new plugin** — copy `plugins/draft-email/` as a template,
  change the name, replace the skill, push to GitHub.
- **Add a tool to the MCP server** — copy a file in
  `plugins/linkedin-post/mcp-server/src/tools/`, change the schema and
  handler, register it in `server.ts`. `npm run build && /reload-plugins`.
- **Add a prompt or resource to the MCP server** — see
  `src/prompts/composer.ts` and `src/resources/style-guide.ts` as
  templates.
- **Convert a personal `~/.claude/skills/` skill into a shared plugin** —
  see [Promoting a personal skill](03-team-distribution.md#promoting-a-personal-skill-to-a-plugin).

If you're stuck, the most useful single command is:

```
/plugin
```

The **Errors** tab tells you what's actually broken faster than any other
debugging path.
