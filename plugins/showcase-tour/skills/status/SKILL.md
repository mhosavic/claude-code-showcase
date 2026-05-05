---
name: status
description: 30-second health check of the claude-code-showcase installation. Reports which showcase plugins are installed, whether the linkedin-post MCP server is built, mock-mode state, and prerequisite tooling (node, jq). Use before running the tour or trying the plugins, or whenever something feels broken.
disable-model-invocation: true
allowed-tools: Bash(test *), Bash(ls *), Bash(node *), Bash(jq *), Bash(which *)
---

# Showcase status

(All values below are inlined before this prompt reaches Claude — actual
output, not commands.)

## Repo

- **In showcase repo:** !`test -f .claude-plugin/marketplace.json && echo "yes" || echo "no"`
- **Marketplace name:** !`jq -r '.name' .claude-plugin/marketplace.json 2>/dev/null || echo "(not in repo)"`
- **Plugins listed:** !`jq -r '[.plugins[].name] | join(", ")' .claude-plugin/marketplace.json 2>/dev/null || echo "(not in repo)"`

## Plugins installed (user cache)

- **draft-email:** !`ls -d ~/.claude/plugins/cache/*/draft-email* 2>/dev/null | head -1 | xargs -I{} basename {} || echo "not installed"`
- **commit-helper:** !`ls -d ~/.claude/plugins/cache/*/commit-helper* 2>/dev/null | head -1 | xargs -I{} basename {} || echo "not installed"`
- **linkedin-post:** !`ls -d ~/.claude/plugins/cache/*/linkedin-post* 2>/dev/null | head -1 | xargs -I{} basename {} || echo "not installed"`
- **showcase-tour:** !`ls -d ~/.claude/plugins/cache/*/showcase-tour* 2>/dev/null | head -1 | xargs -I{} basename {} || echo "not installed (may be running from --plugin-dir or local repo)"`

## linkedin-post MCP server

- **Built (cache):** !`ls ~/.claude/plugins/cache/*/linkedin-post*/mcp-server/dist/server.js 2>/dev/null | head -1 || echo "no — first session will build it"`
- **Built (local repo):** !`ls plugins/linkedin-post/mcp-server/dist/server.js 2>/dev/null || echo "no"`
- **Persistent deps installed:** !`ls -d ~/.claude/plugins/data/linkedin-post* 2>/dev/null | head -1 | xargs -I{} basename {} || echo "not yet (first session will install)"`

## Prerequisites

- **node:** !`node --version 2>/dev/null || echo "MISSING — required for linkedin-post MCP server"`
- **jq:** !`jq --version 2>/dev/null || echo "MISSING — used by hook scripts"`
- **gh:** !`which gh >/dev/null 2>&1 && gh --version 2>/dev/null | head -1 || echo "not installed (optional)"`

## Your task

Read the state above and produce a **status table** in this exact format:

```
showcase-tour status

Repo               <✓|✗> in showcase repo
Plugins installed  <count>/4
  draft-email      <✓|✗>
  commit-helper    <✓|✗>
  linkedin-post    <✓|✗>
  showcase-tour    <✓|✗>
MCP server         <✓ ready | building | ✗ not built>
Prerequisites      <✓ all present | ✗ missing: node/jq>

→ <one-line summary>
```

Use ✓ for present and ✗ for missing.

## Summary line — pick the right one

- All ✓ → `Everything wired up. Try /showcase-tour:tour to walk through what's here.`
- Some plugins missing → `<n> plugin(s) not installed. Run /plugin install <name>@claude-code-showcase for each.`
- node missing → `Install Node.js 20+ before using linkedin-post — see docs/prerequisites.md.`
- linkedin-post installed but MCP server not built → `MCP server hasn't built yet. Run /reload-plugins.`
- Not in showcase repo AND nothing installed → `You're not in the showcase repo and no plugins are installed. Either /plugin marketplace add mhosavic/claude-code-showcase, or git clone the repo and open it.`

If multiple things are wrong, pick the **earliest** in the chain (prereqs
before plugins before MCP build) so the user fixes things in dependency
order.

## What you do NOT do

- Don't repeat the table data in prose. Once is enough.
- Don't suggest fixes the user didn't ask for. The summary line is the
  only nudge.
- Don't run any tools. The state is already inlined above.
