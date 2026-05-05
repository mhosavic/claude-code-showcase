# Q6 — Adding an MCP server in Claude Team org-wide

> "Comment ajouter un MCP dans Claude Team comme connecteur dans un skill
> pour que nous n'aillions pas à le faire sur chaque poste si possible."

There are **two paths** depending on what kind of MCP server you have.
Pick one based on Q5's tradeoff: hosted HTTP server vs stdio binary in a plugin.

## Path A — Hosted HTTP MCP server (the "connector" path)

If your MCP server is a hosted HTTP service (like Notion's at
`https://mcp.notion.com/mcp` or Sentry at `https://mcp.sentry.dev/mcp`),
the cleanest team-wide path is to register it as a **connector** in the
Claude.ai admin console. Once done, it shows up in every team member's
Claude Code, Claude desktop app, and Cowork — no per-workstation setup.

### Steps (Claude Team / Enterprise admin)

1. Sign in to [claude.ai](https://claude.ai) as an Owner or Primary Owner.
2. Go to **Admin Settings → Connectors**.
3. Click **Browse connectors** to see what's already in the catalog. Many
   common services (GitHub, Slack, Notion, Atlassian, Figma, Sentry, …) are
   one-click installs.
4. For the ones in the catalog, click **Add to your organization**. Some
   require an org-level OAuth step (e.g. Microsoft 365 needs tenant-admin
   consent).
5. After adding, every team member can connect their personal account from
   **Settings → Connectors** in their Claude Code or claude.ai.
6. For a custom internal HTTP MCP server that's NOT in the catalog, contact
   Anthropic support to add it as a private organization connector.

### What happens on the user's machine

Once a connector is enabled by an admin, the next time the user signs in to
Claude Code, the connector tools appear automatically. They run an OAuth
flow once (browser pops up, "Allow Claude to access X?"), and from then on
the tools are available in every session, on every project — no
`.mcp.json`, no `claude mcp add`, no env vars.

### Limitation worth knowing

`mcp__<connector>__<tool>` permission patterns work the same way for
admin-installed connectors as for plugin-bundled MCP servers. So you can
still do per-skill scoping with `allowed-tools`. The connector path doesn't
give you fewer controls — it gives you a faster install path.

## Path B — Bundled stdio MCP server (the "plugin" path)

If your MCP server runs locally (like the `linkedin-post` server in this
showcase), the connectors UI doesn't apply. Instead, distribute it as a
**plugin via a marketplace pushed by server-managed settings**.

### Steps (Claude Team / Enterprise admin)

1. Push your plugin + marketplace to GitHub (see
   [`03-team-distribution.md`](03-team-distribution.md)).
2. Sign in to claude.ai as admin.
3. Go to **Admin Settings → Claude Code → Managed settings**.
4. Paste this config:

   ```json
   {
     "extraKnownMarketplaces": {
       "mhosavic-team-tools": {
         "source": {
           "source": "github",
           "repo": "mhosavic/claude-code-showcase"
         }
       }
     },
     "enabledPlugins": {
       "linkedin-post@mhosavic-team-tools": true
     }
   }
   ```
5. Save. Within ~1 hour or on next session start, every team member's
   Claude Code:
   - Adds the marketplace.
   - Installs the plugin.
   - Starts the bundled MCP server automatically.
   - Prompts the user once for `userConfig` values (their own LinkedIn
     token, their own OpenAI key) — those stay on their machine.

The MCP server itself runs locally on each user's machine, but the
**distribution** is centralized. New hires get the right tooling on day 1.

### Why credentials still go to each user

For stdio MCP servers, credentials are user-specific by design — your
LinkedIn token is *yours*, not the team's. The plugin's `userConfig` prompts
each user once and stores their values in the macOS keychain (or its
equivalent). The team-wide piece is "the plugin is installed and ready"; the
per-user piece is "now plug in your own keys."

If you actually want a *shared* credential (e.g. a shared service account
token), turn the MCP server into a hosted HTTP service (Path A) and put the
shared credential server-side, behind your team's auth.

## Decision tree

```
Is the MCP server hosted (an HTTP endpoint somewhere)?
├── YES → Path A: register as a connector in admin console.
│         Users sign in to it once via OAuth.
│
└── NO  → It's a local binary or stdio process.
          ├── Should each user use their own credentials? → Path B
          │   (plugin + marketplace + server-managed settings).
          │
          └── Should everyone share one credential set? → Convert to a
              hosted HTTP service first, then go Path A.
```

## Server-managed settings caveats

- **Plan requirement**: Team or Enterprise. Pro/Max plans don't have the
  admin console.
- **MCP server configs are NOT distributable through server-managed
  settings**. You can push permissions, plugins, hooks, and most other
  settings, but `.mcp.json` content has to come from the repo or from
  individual `claude mcp add` commands. That's why we go through plugins
  for stdio MCP servers — plugins are the one mechanism that lets a hosted
  config push reach the local MCP layer.
- **Refresh cadence**: settings are fetched at sign-in and refreshed hourly
  during active sessions. New hires get them immediately on first sign-in.
- **Fail-closed mode**: set `forceRemoteSettingsRefresh: true` if you want
  Claude Code to refuse to start when it can't reach the admin server.
  Right for high-compliance teams; overkill for most.

## What about Cowork?

Both paths work for Claude Code CLI. Cowork (the desktop app) follows the
same connector path for hosted MCP servers (Path A) — admin-installed
connectors automatically appear in Cowork too. Plugin-bundled MCP servers
(Path B) currently work in Cowork on a per-user basis when the user
manually accepts them; a fully org-wide push for stdio plugins to Cowork is
[still being unified with Claude Code](07-using-with-cowork.md).

## In Cowork

This is the question where Claude Code and Cowork are most aligned —
**Path A is identical in both surfaces**:

1. Deploy your MCP server as HTTP (e.g. our `server-http.ts` running
   behind HTTPS).
2. Register it as an organization connector via Anthropic support.
3. Every Claude Code user **and every Cowork user** in the org sees
   it without manual setup.

For a single Cowork user (no admin, no org-wide rollout), the same
HTTP URL is also addable as a **personal custom connector** through
Cowork's Settings → Connectors → Add custom connector. So Path A is
strictly better for Cowork: it works at both the org level (admin)
and the individual level (user) without any plumbing changes.

Path B (bundled stdio MCP plugin) is **Claude Code-only**. To reach
Cowork users, the same MCP server needs an HTTP variant — which this
showcase provides as `src/server-http.ts`.

Full Cowork deploy guide: see
[`07-using-with-cowork.md#deploy-guide`](07-using-with-cowork.md#deploy-guide).

## Next

[`07-using-with-cowork.md`](07-using-with-cowork.md) — Cowork compatibility
in detail.
