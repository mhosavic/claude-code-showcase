# Prerequisites

Before starting the tour, make sure you have these installed.

## Required

### Claude Code

The CLI itself. One of:

```bash
# macOS / Linux / WSL — Homebrew
brew install claude-code

# Anywhere with npm
npm install -g @anthropic-ai/claude-code
```

Verify:

```bash
claude --version
# expect: 2.x.x or later
```

If you see a version older than 2.1.x, run `claude update` (or `npm install
-g @anthropic-ai/claude-code@latest`).

Sign in:

```bash
claude              # opens a browser for OAuth
```

Confirm you're signed in:

```bash
claude auth status
# expect: "Logged in as you@example.com"
```

A **paid plan** (Pro / Max / Team / Enterprise) is required for plugins,
MCP servers, and the rest of the showcase. Free tier won't work.

### Node.js 20 or newer

The `linkedin-post` plugin's bundled MCP server is a Node.js stdio process.
It builds itself from source on first session, so `node` and `npm` need to
be on your `PATH`.

```bash
node --version          # expect: v20.x or higher
npm --version           # expect: 10.x or higher
```

If you don't have Node, install from <https://nodejs.org> or via your
package manager:

```bash
# macOS
brew install node

# Linux (Ubuntu/Debian, NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Anywhere — via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
```

> **If you only intend to use `draft-email` and `commit-helper`, you can
> skip Node** — they have no MCP server. The `linkedin-post` plugin is the
> only one that needs it.

## Optional but recommended

### git

You almost certainly already have it. The `commit-helper` plugin uses
`git` directly for live diffs and history; it'll fail loudly if absent.

```bash
git --version
# expect: 2.x or later
```

### GitHub CLI (`gh`)

Lets Claude Code clone private marketplace repos and post PR comments
without manually configuring credentials.

```bash
gh --version
gh auth status
```

Install:

```bash
brew install gh         # macOS
sudo apt install gh     # Debian/Ubuntu
```

Then `gh auth login` to authenticate.

### `jq`

Used by some hook scripts for parsing JSON input. Almost always already
installed; if not:

```bash
brew install jq         # macOS
sudo apt install jq     # Debian/Ubuntu
```

## Network access

Claude Code talks to:

- `api.anthropic.com` (model inference)
- `claude.ai` (auth, plugin marketplace, admin settings)
- `code.claude.com`, `docs.claude.com` (documentation lookup)

The showcase plugins additionally need:

- `github.com` (cloning the marketplace repo)
- `registry.npmjs.org` (`npm install` for the MCP server's deps)
- `api.openai.com` (only if you turn off mock mode for image generation)
- `api.linkedin.com` (only if you turn off mock mode for posting)

If your machine is behind a proxy, set `HTTPS_PROXY` and `NPM_CONFIG_PROXY`
before running `claude`.

## Plan / subscription

| Plan | Plugins | MCP servers | Cowork | Server-managed settings |
|---|---|---|---|---|
| Free | ❌ | ❌ | ❌ | ❌ |
| Pro / Max | ✅ | ✅ | ✅ | ❌ |
| Team | ✅ | ✅ | ✅ | ✅ (admin push) |
| Enterprise | ✅ | ✅ | ✅ | ✅ + SSO + ZDR |

Everything in this showcase works on Pro / Max. Section
[`06-claude-team-connectors.md`](06-claude-team-connectors.md) covers the
Team-specific admin push.

## Verifying everything is ready

The fastest end-to-end check:

```bash
# 1. Claude Code is installed and signed in
claude auth status

# 2. Node is available (only needed for linkedin-post)
node --version

# 3. Pull this repo and confirm it parses
git clone https://github.com/mhosavic/claude-code-showcase.git
cd claude-code-showcase
git status

# 4. Open with Claude Code — workspace trust will prompt
claude
```

If all four steps succeed, you're ready for [`00-start-here.md`](00-start-here.md).

If any step fails, see [`09-troubleshooting.md`](09-troubleshooting.md).
