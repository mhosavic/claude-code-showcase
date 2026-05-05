# draft-email

Single-skill plugin demonstrating the simplest possible Claude Code plugin shape: one skill, no agents, no MCP, no hooks. Useful as a template when starting a new plugin.

## What it adds

- `/draft-email:draft <brief>` — writes a polite, well-structured email from a one-line description.

## File anatomy

```
draft-email/
├── .claude-plugin/
│   └── plugin.json          ← name, version, description (required)
└── skills/
    └── draft-email/
        └── SKILL.md         ← frontmatter + prompt instructions
```

## Try it

```bash
/plugin install draft-email@claude-code-showcase
/draft-email:draft tell my coworker the quarterly review meeting is moved to Thursday
```

## Things to notice

- **Skill name vs invocation**: the directory is `skills/draft-email/`, the `name` in frontmatter is `draft`, so the invocation is `/draft-email:draft` (`<plugin-name>:<skill-name>`). If `name` were omitted, the directory name would be used and the invocation would be `/draft-email:draft-email`.
- **`$ARGUMENTS`**: everything after the slash command becomes `$ARGUMENTS`. If you want positional access, use `$0`, `$1`, etc.
- **`description` matters for auto-discovery**: when Claude is deciding which skill to use, it reads the description. Lead with what the skill *does*, then *when to use it* — the first phrase is what Claude pattern-matches against.
- **No `disable-model-invocation`**: this skill is fine for Claude to invoke automatically when the user asks to write an email. If you have a skill with side effects (like deploying code or sending a message), add `disable-model-invocation: true` so only the user can trigger it.
