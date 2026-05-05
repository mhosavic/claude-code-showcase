# Q1 — File structure of a simple skill

> "La structure des fichiers pour un skill simple (exemple, rédiger un courriel)."

A skill is a **prompt** that Claude can invoke as a slash command. The
simplest possible plugin is one skill, one file, no extras.

## The whole plugin in 3 files

```
plugins/draft-email/
├── .claude-plugin/
│   └── plugin.json                       ← manifest (required)
├── README.md                             ← human docs (optional but nice)
└── skills/
    └── draft-email/
        └── SKILL.md                      ← the skill itself
```

That's it. No build step. No dependencies. No configuration.

## The manifest

[`plugins/draft-email/.claude-plugin/plugin.json`](../plugins/draft-email/.claude-plugin/plugin.json)

```json
{
  "name": "draft-email",
  "version": "0.1.0",
  "description": "Adds /draft-email:draft, a simple skill that writes a polite, well-structured email from a one-line description.",
  "author": { "name": "mhosavic" },
  "license": "MIT",
  "keywords": ["email", "writing", "skill", "starter"]
}
```

The only required field is `name`. The rest are for the plugin browser UI and
for marketplace listings. Keep `description` accurate — Claude uses it (along
with the skill descriptions inside) to decide when to surface the plugin's
skills.

## The skill

[`plugins/draft-email/skills/draft-email/SKILL.md`](../plugins/draft-email/skills/draft-email/SKILL.md)

Skills live under `skills/<skill-name>/SKILL.md`. The directory name becomes
the default invocation name. You can override that by setting `name:` in the
frontmatter — that's what we do here, so the slash command is `/draft-email:draft`
instead of `/draft-email:draft-email`.

```markdown
---
name: draft
description: Draft a polite, well-structured email from a one-line description.
              Use when the user asks to write an email, draft a message, or compose
              a note to send.
argument-hint: <one-line description of what the email should say>
---

# Draft email

Write an email based on this brief: **$ARGUMENTS**

(...the rest of the prompt is the actual instructions...)
```

### What each frontmatter field does

| Field | Purpose |
|---|---|
| `name` | Invocation name. With this set, the slash command is `/<plugin-name>:<name>`. Omit it and the directory name is used. |
| `description` | Two jobs: (a) Claude reads it to decide when to auto-invoke the skill; (b) it's shown in the `/plugin` browser. **Lead with what the skill does, then when to use it.** |
| `argument-hint` | Hint shown in autocomplete after `/draft-email:draft `. Optional but helps users. |
| `disable-model-invocation` | Set to `true` for skills with side effects (like deploying or sending real messages). It means only the user can invoke the skill — Claude won't auto-pick it. |
| `allowed-tools` | Tools the skill can use without asking permission. Useful for skills that need Bash or specific MCP tools. Not used in this simple example. |

### What `$ARGUMENTS` means

Whatever the user types after the slash command becomes `$ARGUMENTS`. In:

```
/draft-email:draft tell my landlord I'll be 3 days late
```

`$ARGUMENTS` expands to `tell my landlord I'll be 3 days late`. You can also
access individual positional args with `$0`, `$1`, etc. — useful when the
user passes structured input.

## Naming pattern: `<plugin>:<skill>`

Plugin skills are namespaced. If two plugins both ship a `commit` skill,
they're `/foo:commit` and `/bar:commit` and never collide.

Standalone skills in a project's `.claude/skills/` directory are *not*
namespaced — they're invoked just as `/commit`. The trade-off:

| | Standalone (`.claude/skills/`) | Plugin |
|---|---|---|
| Invocation | `/commit` | `/<plugin>:commit` |
| Sharing | Copy/paste, or commit `.claude/` | One-line install via marketplace |
| Versioning | Whatever the repo uses | Plugin manifest version |
| Use when | Skill is project-specific or you're prototyping | Skill should be sharable / reusable |

## Try it

```
/plugin install draft-email@claude-code-showcase
/reload-plugins
/draft-email:draft thank my mentor for the coffee chat last week
```

## Next

Now that the simple case is clear, see how a multi-step skill orchestrates
sub-skills, a subagent, and an MCP server:
[`02-complex-skill-orchestration.md`](02-complex-skill-orchestration.md)
