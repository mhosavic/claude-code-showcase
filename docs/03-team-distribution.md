# Q3 — Sharing skills with the team in Claude Team

> "Comment partager ces skills avec le reste de l'équipe dans Claude Team.
> Pour les skills simples, nous utilisons une marketplace sur GitHub. Pour
> les skills complexes, comment les rendre disponibles?"

**Short answer:** the same path works for both simple and complex skills.
Both go in a plugin, the plugin goes in a marketplace, the marketplace lives
on GitHub. Complex skills (with bundled MCP servers, agents, hooks) work
*exactly* the same way as simple ones — they just have more files inside the
plugin directory.

This page first covers **where skills physically live** (the three scopes),
then **three distribution patterns** for plugin scope ordered by how much
team infrastructure each one requires.

## Where skills live: three scopes

Before picking a distribution path, decide which scope the skill belongs in.
This is the part Francis flagged when he wrote "we have personal skills in
our root that we share informally if we like them."

| Scope | File location | Invocation | Sharing path | When to use |
|---|---|---|---|---|
| **Personal** | `~/.claude/skills/<name>/SKILL.md` | `/<name>` | DM the file, paste in Slack, copy into another machine | Personal preference, prototyping, "I find this useful and might share later." |
| **Project** | `<repo>/.claude/skills/<name>/SKILL.md` | `/<name>` | Commit it. Anyone who clones the repo gets it. | Repo-specific workflow, anything that depends on this codebase's conventions. |
| **Plugin** | `<plugin-dir>/skills/<name>/SKILL.md` | `/<plugin>:<name>` | Marketplace install. Versioned. Updates push automatically. | Anything you want multiple people across multiple projects to use. |

The three scopes aren't mutually exclusive. A skill can start as `~/.claude/`
(prototype), graduate to `<repo>/.claude/` (project-specific), and eventually
get packaged as a plugin in a team marketplace (broadly sharable). That
progression is the typical lifecycle.

### What happens when names collide

If you have `~/.claude/skills/commit/SKILL.md` AND a plugin ships
`/foo:commit`, both work. The personal one is `/commit`; the plugin one is
`/foo:commit`. Plugin namespacing prevents collisions between plugins; it
doesn't override personal/project skills.

### Promoting a personal skill to a plugin

When a skill from `~/.claude/skills/` proves useful enough to share:

1. `mkdir -p new-plugin/skills/<skill-name>` and copy the `SKILL.md` in.
2. Add `new-plugin/.claude-plugin/plugin.json` with name + description.
3. Add the plugin to your team's marketplace (`marketplace.json`).
4. The original personal skill stays where it is — it'll continue to shadow
   the plugin's namespaced version for *you*. Once you're confident, delete
   the personal copy.

The rest of this page is about **the third scope** (plugin), which is the
only one that benefits from a marketplace.

This page covers three distribution patterns, ordered by how much team
infrastructure they require.

## Pattern 1 — Each developer adds the marketplace

The simplest path. Once your marketplace repo is on GitHub:

```
/plugin marketplace add mhosavic/claude-code-showcase
/plugin install draft-email@claude-code-showcase
/plugin install linkedin-post@claude-code-showcase
/plugin install commit-helper@claude-code-showcase
```

Each teammate runs these commands once. Updates flow automatically when
you push new commits (Claude Code auto-updates marketplaces at startup).

**Pros:** zero infrastructure, works on every plan (Free / Pro / Max / Team /
Enterprise).

**Cons:** every developer has to remember to add the marketplace at least
once. New hires need to be told.

## Pattern 2 — Auto-prompt via project settings

For each repo where the team uses the plugins, commit a `.claude/settings.json`
that registers the marketplace and lists the plugins to enable. When a
teammate opens the repo with Claude Code and accepts workspace trust, they're
prompted to install.

`.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "claude-code-showcase": {
      "source": {
        "source": "github",
        "repo": "mhosavic/claude-code-showcase"
      }
    }
  },
  "enabledPlugins": {
    "draft-email@claude-code-showcase": true,
    "linkedin-post@claude-code-showcase": true,
    "commit-helper@claude-code-showcase": true
  }
}
```

This file is committed and shared. Anyone who clones the repo and runs
`claude` gets a prompt: *"This project wants to install the plugins X, Y.
Allow?"* They click yes once.

This is what *this* showcase repo does (look at
[`.claude/settings.json`](../.claude/settings.json)) — it self-bootstraps
when you clone and open it.

**Pros:** the right plugins for a project follow the project. New
contributors get the right setup automatically. Works on every plan.

**Cons:** still per-project. You'd repeat the same `extraKnownMarketplaces`
block in every repo if your team has many.

## Pattern 3 — Server-managed settings (Claude Team / Enterprise only)

For Team and Enterprise plans, an admin can push the marketplace and the
list of enabled plugins from the **Claude.ai admin console** to every user
in the org, with no per-repo config and no per-user setup.

**Steps:**

1. Sign in to [claude.ai](https://claude.ai) as an admin (Owner or Primary
   Owner).
2. Go to **Admin Settings → Claude Code → Managed settings**.
3. Paste a JSON config:

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
       "draft-email@mhosavic-team-tools": true,
       "linkedin-post@mhosavic-team-tools": true
     }
   }
   ```
4. Save. Within an hour (or on next session start) every team member's
   Claude Code picks up the marketplace, installs the plugins, and they
   start showing up in `/plugin`.

**Pros:** zero per-developer setup. Plugins update automatically when you
push to GitHub. New hires see the right plugins on day 1.

**Cons:** Team or Enterprise plan only. If your repo is private, Claude Code
also needs `GITHUB_TOKEN` set in each user's env to auto-update — see the
[Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces#private-repositories)
docs for tokens-and-private-repos specifics.

## Marketplace structure recap

A marketplace is just a GitHub repo with one file at the root:
`.claude-plugin/marketplace.json`. The plugins it lists can live in the
**same** repo (using relative paths) or in **other** repos (using `github`
or `url` sources).

This showcase puts everything in one repo:

```
claude-code-showcase/                   # GitHub: mhosavic/claude-code-showcase
├── .claude-plugin/marketplace.json     # ← lists plugins, uses relative paths
└── plugins/
    ├── draft-email/                    # source: "draft-email"
    └── linkedin-post/                  # source: "linkedin-post"
```

`marketplace.json`:

```json
{
  "name": "claude-code-showcase",
  "owner": { "name": "mhosavic" },
  "metadata": { "pluginRoot": "./plugins" },
  "plugins": [
    { "name": "draft-email", "source": "draft-email", ... },
    { "name": "linkedin-post", "source": "linkedin-post", ... }
  ]
}
```

The `metadata.pluginRoot` field is a small convenience: it lets each plugin's
`source` be just the directory name (e.g. `"draft-email"`) instead of the
full relative path (`"./plugins/draft-email"`).

## When to split plugins into separate repos

Single-repo marketplace (this one) is right when:
- You want one URL teammates need to remember.
- Plugins are versioned together.
- You're a small team and the whole catalog fits comfortably in one repo.

Split repos (one repo per plugin, plus a small marketplace repo that
references them) are right when:
- Different plugins have different maintainers / release cadences.
- Some plugins are public, others private.
- Plugins are large enough that you want isolated git history per plugin.

In split mode, each plugin entry in `marketplace.json` uses a `github`
source instead of a relative path:

```json
{
  "name": "linkedin-post",
  "source": {
    "source": "github",
    "repo": "mhosavic/linkedin-post-plugin"
  }
}
```

## Versioning

Pick one of two approaches per plugin:

- **Pin versions** — set `version` in `plugin.json`. Bump it on every
  release. Users only get updates when you bump. Right for plugins where you
  want a predictable release cycle.
- **Track HEAD** — leave `version` unset. Every commit on the marketplace
  branch counts as a new version, and Claude Code auto-updates. Right for
  plugins under active development on internal teams.

For this showcase, we set `version: 0.1.0`. When we ship 0.2.0 we bump the
field; until then, `git push` doesn't move users forward.

## Private repos

If your marketplace repo is private:

- **Manual install** (`/plugin marketplace add owner/repo`): uses your local
  `gh auth` or git credential helper. Works.
- **Auto-update at startup**: needs `GITHUB_TOKEN` (or `GH_TOKEN`) in the
  environment, because background updates can't prompt you. Set it in
  `~/.zshrc` / `~/.bashrc` or distribute it via your team's secret-management
  flow.

## In Cowork

This is the question where Claude Code and Cowork diverge most.
Custom GitHub marketplaces (`/plugin marketplace add <repo>`) are
**Claude Code-only** today. For Cowork, the distribution paths are:

| Cowork path | What it is | Status |
|---|---|---|
| **`claude.com/plugins` submission** | Submit at <https://claude.ai/settings/plugins/submit>. Once accepted, every Cowork user can install. | Available now. |
| **Server-managed `enabledPlugins` push** | Team / Enterprise admin pushes plugins via managed settings from the Claude.ai admin console. | Works for Claude Code today; Cowork support **rolling out**. |
| **Project-level custom instructions** | For one-off, project-specific use: paste the skill body into a Cowork Project's custom instructions. | Available now. |
| **Custom connectors for MCP servers** | Distribution gap closed at the MCP layer: any Cowork user adds an HTTP MCP URL via Settings → Connectors → Add custom connector. Org admins can register an org-wide connector via Anthropic support. | Available now. |

So for Francis's team today: if the value is mostly in the MCP server
(LinkedIn integration), use the connector path — it works in both
surfaces immediately. If the value is in skills and orchestration,
submit to `claude.com/plugins` for Cowork reach.

Full Cowork answer for Q3: see
[`07-using-with-cowork.md`](07-using-with-cowork.md#q3--sharing-with-the-team).

## Next

Once you can distribute, the next question is: how does the *MCP server*
inside the complex plugin work?

[`04-mcp-server-with-auth.md`](04-mcp-server-with-auth.md) — credentials,
scoping, real-mode setup.
