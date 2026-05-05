# Concept: marketplaces

## What

A marketplace is a GitHub repo (or git URL, or local directory) with a
single file — `.claude-plugin/marketplace.json` — listing one or more
plugins and where to fetch each one. Adding a marketplace registers the
catalog with Claude Code; users then install individual plugins from it.

## Mental model

App Store : iPhone :: Marketplace : Claude Code.

Adding a marketplace is **subscribing to a publisher**. You browse what
they offer; you install only what you want. Each plugin is independently
installable, updatable, and uninstallable.

The publisher updates the marketplace by pushing commits. Subscribers'
Claude Code auto-pulls on session start.

## Concrete example from this showcase

This repo IS a marketplace. The catalog is `.claude-plugin/marketplace.json`:

```json
{
  "name": "claude-code-showcase",
  "owner": { "name": "mhosavic", "url": "https://github.com/mhosavic" },
  "metadata": { "pluginRoot": "./plugins" },
  "plugins": [
    { "name": "draft-email", "source": "draft-email", ... },
    { "name": "linkedin-post", "source": "linkedin-post", ... },
    { "name": "commit-helper", "source": "commit-helper", ... },
    { "name": "showcase-tour", "source": "showcase-tour", ... }
  ]
}
```

Each plugin's `source` points to a directory under `./plugins/` (because
of the `metadata.pluginRoot` shorthand). The same `source` field can also
point to a different GitHub repo, a git URL, an npm package, or a
subdirectory of a monorepo.

## Three distribution patterns

Once your marketplace is on GitHub, three ways to get it into your team's
Claude Code:

### Pattern 1 — Each developer adds it manually

```
/plugin marketplace add mhosavic/claude-code-showcase
/plugin install draft-email@claude-code-showcase
```

Works on every plan. Zero infrastructure. Each new hire has to be told.

### Pattern 2 — Auto-prompt via project settings

In each project where you want the plugins, commit a
`.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "claude-code-showcase": {
      "source": { "source": "github", "repo": "mhosavic/claude-code-showcase" }
    }
  },
  "enabledPlugins": {
    "draft-email@claude-code-showcase": true,
    "linkedin-post@claude-code-showcase": true
  }
}
```

When teammates clone the repo and open it with `claude`, they get a
trust-and-install prompt. Works on every plan. **This showcase repo does
exactly this** — see `.claude/settings.json` at the root.

### Pattern 3 — Server-managed settings (Team / Enterprise only)

Admin pushes the same `extraKnownMarketplaces` + `enabledPlugins` from
the **claude.ai admin console → Claude Code → Managed settings**. Every
team member's Claude Code picks it up at next login. Zero per-developer
setup. New hires have it on day 1.

## When to use vs alternatives

| You want… | Use… |
|---|---|
| To share one skill with one teammate | Just send them the SKILL.md file. |
| To share several skills with a team | A plugin in a marketplace. |
| Enforce installation org-wide | Server-managed settings (Pattern 3). |
| Public distribution to the community | Submit to the official Anthropic marketplace. |

## Try this

1. Run `/showcase-tour:inspect .claude-plugin/marketplace.json` to walk
   through this marketplace's catalog.
2. Then run `/showcase-tour:explain scopes` to understand where plugin
   skills live vs personal vs project-level skills.
