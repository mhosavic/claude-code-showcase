# Bonus — Using this with Claude Cowork

> "He might want to use claude cowork with this project."

Claude Cowork is the **Claude desktop app with agentic features** —
sub-agents, file access, scheduled tasks, long-running tasks. It's separate
from Claude Code CLI but shares a lot of the underlying skill / connector
infrastructure.

This page tells you what works today, what doesn't, and how to get the
showcase plugins in front of Cowork users.

## Cowork at a glance

| | Claude Code (CLI / VS Code) | Claude Cowork (Desktop app) |
|---|---|---|
| Install | `brew install claude-code` or `npm i -g @anthropic-ai/claude-code` | Download the [Claude desktop app](https://claude.com/download) |
| Platforms | macOS, Linux (incl. WSL), Windows | macOS and Windows only — no web, no mobile |
| Plans | Free / Pro / Max / Team / Enterprise | Pro / Max / Team / Enterprise (paid only) |
| Primary surface | Terminal | GUI (the desktop app) |
| File access | Wherever you launch the CLI | Folders you grant access to via the app |
| Skills today | Plugin marketplace, project `.claude/skills/`, user `~/.claude/skills/` | Bundled skills + skills from the Claude.ai plugin marketplace |
| MCP servers | `.mcp.json`, `claude mcp add`, plugin-bundled, admin-installed connectors | Admin-installed connectors |
| Custom team plugins | Plugin marketplace (Path B in [Q6](06-claude-team-connectors.md)) | **Distribution path is converging — see below** |

## What works today

✅ **Hosted HTTP MCP servers** — admin-installed connectors (Path A from
[Q6](06-claude-team-connectors.md)) appear in Cowork too. The Notion
connector, Slack connector, Atlassian connector, etc. — all the ones in the
admin **Connectors** catalog work the same way in Cowork as in Claude Code.

✅ **Bundled skills from the official Anthropic marketplace** — Cowork ships
with a set of pre-installed skills (research, writing, analysis, etc.) and
can install additional ones from `claude.ai/plugins`.

✅ **The `draft-email` plugin** — once published to the official marketplace
(or made available via your team's marketplace), simple skills like this
work in Cowork.

## What's still in motion

🟡 **Custom team plugins with bundled stdio MCP servers** (like our
`linkedin-post` plugin). Cowork's plugin model is being unified with Claude
Code's. The path that *works today* is:

1. Use Path A from [Q6](06-claude-team-connectors.md) for the MCP server —
   host it as an HTTP service, register as a connector in the admin
   console.
2. Ship the skills (without the bundled MCP server) via the plugin
   marketplace.
3. The skills land in Cowork via the marketplace; the MCP tools land via
   the connector. Functionally equivalent to the all-in-one stdio plugin,
   just split into two pieces.

🟡 **Server-managed `enabledPlugins` for Cowork** — admin push works for
Claude Code today; Cowork honors many of the same managed settings but the
plugin push path specifically is rolling out.

## Concrete recommendations for your team

If Francis (and your team) wants to use Cowork with the showcase:

1. **Try the plugins in Claude Code first.** Cowork is a different surface;
   getting the plugins right in CLI is the foundation.

2. **For the LinkedIn workflow specifically** — if you eventually want it in
   Cowork, plan to **promote the MCP server from stdio (this showcase) to
   HTTP-hosted**. That means: wrap the same two tools (`generate_image`,
   `post_linkedin_draft`) in an Express/Fastify app, deploy somewhere your
   team can reach (a Cloudflare Worker, AWS Lambda, internal VM, etc.), and
   register it as a custom connector via Anthropic support.

3. **Until then, run the workflow in Claude Code** — it's a more capable
   surface for plugin development anyway, and it's where you'd debug
   anything that breaks.

4. **Read the Cowork docs**: <https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork>.
   Cowork features ship roughly monthly; the gap between Claude Code and
   Cowork is closing fast.

## How to think about it

| Goal | Use |
|---|---|
| Heads-down individual coding work | Claude Code CLI / VS Code |
| Knowledge work (docs, slides, spreadsheets, file processing) | Cowork |
| Mobile-friendly delegation (start a task, walk away) | Claude Code on the web (`claude.ai/code`) or Cowork's mobile-app delegation |
| Team-wide tool access via OAuth | Connectors (Path A in [Q6](06-claude-team-connectors.md)) — works in both Claude Code and Cowork |
| Custom internal workflows with bundled tools | Plugin + marketplace (Path B) — best in Claude Code today, expanding to Cowork |

Cowork isn't "another Claude Code" — it's Claude *adapted for non-engineering
work surfaces*. If your team is mostly knowledge workers, Cowork is probably
the right primary surface and the plugin development happens in Claude Code
on the developers' side.

## Where to go for help

- **Cowork-specific issues**: support tab inside the desktop app, or
  <https://support.claude.com>.
- **Plugin / MCP issues**: `claude --debug` from the CLI is the fastest way
  to surface load errors. The `/plugin` Errors tab is the second-fastest.
- **Connectors / admin push**: Claude.ai admin console under
  Admin Settings → Claude Code, or Anthropic support for organization-level
  custom connectors.
