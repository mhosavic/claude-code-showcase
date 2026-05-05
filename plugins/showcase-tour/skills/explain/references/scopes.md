# Concept: scopes

## What

Where a skill physically lives — and as a result, **who can use it and
how it gets shared**. Four scopes, each with a different sharing path:

| Scope | File location | Invocation | Sharing path |
|---|---|---|---|
| **Personal** | `~/.claude/skills/<name>/SKILL.md` | `/<name>` | DM the file. Copy/paste. |
| **Project** | `<repo>/.claude/skills/<name>/SKILL.md` | `/<name>` | Commit it. Anyone who clones the repo gets it. |
| **Plugin** | `<plugin>/skills/<name>/SKILL.md` | `/<plugin>:<name>` | Marketplace install. Versioned. Auto-updates. |
| **Managed** | Pushed via admin console | `/<plugin>:<name>` | Team / Enterprise admin push. Cannot be disabled by users. |

## Mental model

Think of scopes as a **lifecycle**. Most skills start as `~/.claude/`
(personal prototype), graduate to `<repo>/.claude/` once they prove
useful for a specific project, and eventually get packaged as a plugin
in a team marketplace once they're broadly valuable.

You're picking a scope based on **how widely the skill should apply**:

- **Just me, everywhere** → personal (`~/.claude/skills/`)
- **Anyone in this repo** → project (`<repo>/.claude/skills/`)
- **Multiple people across multiple projects** → plugin (with marketplace)
- **Everyone in the org, no opt-out** → managed (server-managed settings)

## Concrete example from this showcase

This showcase exists primarily at **plugin scope**. Every skill in the
repo lives under `plugins/<name>/skills/`:

```
plugins/draft-email/skills/draft/SKILL.md
plugins/commit-helper/skills/commit-msg/SKILL.md
plugins/linkedin-post/skills/post/SKILL.md
```

But scopes coexist. If a teammate forks this repo and likes the
`draft-email` skill, they could:

1. Copy `plugins/draft-email/skills/draft/SKILL.md` to
   `~/.claude/skills/draft/SKILL.md` for personal use.
2. Invoke it as `/draft-email` (no plugin namespace) instead of
   `/draft-email:draft`.
3. Edit it freely without affecting the upstream plugin.

That's how Francis's team currently shares skills informally — personal
copies that get promoted to plugins when something proves useful enough.

## When name collisions happen

If `~/.claude/skills/commit/SKILL.md` exists AND a plugin ships
`/foo:commit`:

- The personal one is `/commit`.
- The plugin one is `/foo:commit`.
- Both work simultaneously.

**Plugin namespacing** (`<plugin>:<skill>`) prevents collisions between
plugins. It does NOT shadow personal/project skills — those live at the
unprefixed `/<name>` slot.

Within the same scope, **enterprise > personal > project > plugin**
takes precedence on duplicate names.

## Promoting a personal skill to a plugin

When `~/.claude/skills/<x>/SKILL.md` proves useful enough to share:

1. `mkdir -p new-plugin/skills/<x>` and copy the SKILL.md in.
2. Add `new-plugin/.claude-plugin/plugin.json` with name + description.
3. Add the plugin to your team's marketplace.
4. Optionally delete the personal copy once you trust the plugin
   version.

## When to use vs alternatives

| You want… | Use scope… |
|---|---|
| Quickly try a skill out, only on your machine. | Personal. |
| Skill that depends on a specific repo's conventions. | Project. |
| Skill that should follow you across multiple projects. | Personal. |
| Skill several people on different projects use. | Plugin. |
| Hard-enforce org-wide (security / compliance). | Managed. |

## Try this

1. Run `/showcase-tour:inspect plugins/draft-email/skills/draft/SKILL.md`
   to see what a plugin-scope skill looks like.
2. Then create a personal version: copy that file to
   `~/.claude/skills/quick-email/SKILL.md` and try invoking it as
   `/quick-email`.
3. Then run `/showcase-tour:explain dynamic-injection` to learn one of
   the patterns that makes skills genuinely powerful.
