---
name: status
description: 30-second health check of the claude-code-showcase installation. Reports which showcase plugins are installed, whether the linkedin-post MCP server is built, mock-mode state, and prerequisite tooling (node, jq). Use before running the tour or trying the plugins, or whenever something feels broken.
disable-model-invocation: true
allowed-tools: Bash(test *), Bash(ls *), Bash(node *), Bash(jq *), Bash(which *), Bash(gh --version)
---

# Showcase status

The user wants a 30-second installation health check. Gather the state
yourself with the read-only Bash commands listed below, then produce
the status table. All commands here are pre-approved via `allowed-tools`,
so they run without prompting.

## Step 1 — Probe state

Run these commands (parallel where possible). Each is harmless and
short:

**Repo state**
- `test -f .claude-plugin/marketplace.json && echo "in showcase repo" || echo "not in showcase repo"`
- If "in showcase repo":
  - `jq -r '.name' .claude-plugin/marketplace.json 2>/dev/null` → marketplace name
  - `jq -r '[.plugins[].name] | join(", ")' .claude-plugin/marketplace.json 2>/dev/null` → plugins catalogued

**Plugins installed (one ls per plugin)**
- `ls -d ~/.claude/plugins/cache/*/draft-email* 2>/dev/null | head -1`
- `ls -d ~/.claude/plugins/cache/*/commit-helper* 2>/dev/null | head -1`
- `ls -d ~/.claude/plugins/cache/*/linkedin-post* 2>/dev/null | head -1`
- `ls -d ~/.claude/plugins/cache/*/showcase-tour* 2>/dev/null | head -1`

Empty stdout means "not installed". Non-empty means installed.

**linkedin-post MCP server build state** (only if `linkedin-post` is
installed)
- `ls ~/.claude/plugins/cache/*/linkedin-post*/mcp-server/dist/server.js 2>/dev/null | head -1`
- `ls -d ~/.claude/plugins/data/linkedin-post* 2>/dev/null | head -1`

If both are empty, the SessionStart hook hasn't built yet. If the first
is non-empty, ready.

**Prerequisites**
- `node --version 2>/dev/null`
- `jq --version 2>/dev/null`
- `gh --version 2>/dev/null` (optional)

Empty/error means missing.

## Step 2 — Produce the status table

Output exactly this format:

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

## Step 3 — Summary line — pick the right one

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
- Don't take more than ~5 seconds to gather state. Parallelize the Bash
  calls where you can.
