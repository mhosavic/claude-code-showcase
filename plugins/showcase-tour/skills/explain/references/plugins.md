# Concept: plugins

## What

A plugin is a directory that bundles related Claude Code extensions —
skills, agents, hooks, MCP servers, LSP servers — into one installable
unit with a manifest at `.claude-plugin/plugin.json`.

## Mental model

A skill is a single song. A plugin is the **album**: a curated collection
that ships, versions, and updates together. Once you have more than one
related skill, or a skill plus a hook, or anything that needs
configuration, you reach for a plugin.

The trade-off vs standalone skills (in `~/.claude/skills/` or
`.claude/skills/`): plugins get **versioning**, **automatic updates from
a marketplace**, and **namespaced slash commands** (`/<plugin>:<skill>`)
that prevent collisions. Standalone skills get shorter names but lose
those things.

## Concrete example from this showcase

`plugins/linkedin-post/.claude-plugin/plugin.json`:

```json
{
  "name": "linkedin-post",
  "version": "0.1.0",
  "description": "Orchestrated LinkedIn post workflow...",
  "author": { "name": "mhosavic" },
  "license": "MIT",

  "userConfig": {
    "MOCK_MODE": {
      "type": "boolean",
      "title": "Mock mode",
      "default": true
    },
    "OPENAI_API_KEY": {
      "type": "string",
      "title": "OpenAI API key",
      "sensitive": true
    },
    "LINKEDIN_ACCESS_TOKEN": { ..., "sensitive": true }
  },

  "mcpServers": {
    "linkedin-post": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/server.js"],
      "env": {
        "MOCK_MODE": "${user_config.MOCK_MODE}",
        "OPENAI_API_KEY": "${user_config.OPENAI_API_KEY}",
        ...
      }
    }
  }
}
```

Two patterns worth seeing here:

1. **`userConfig`** — when the plugin is installed, Claude Code prompts
   the user for these values. Sensitive ones go to the system keychain;
   non-sensitive ones go to `settings.json`. The plugin author gets safe
   credential collection without writing any UI.
2. **`${user_config.X}` interpolation** — those collected values get
   injected into MCP server `env` (or hook commands, or LSP configs). The
   plugin code never sees the keychain — Claude Code unlocks and pipes.

## When to use vs alternatives

| Use a plugin when… | Use standalone (`.claude/skills/`) when… |
|---|---|
| You want to share with a team. | The skill is project-specific or experimental. |
| You need to bundle multiple related pieces. | One skill is enough. |
| You want versioned releases. | You're iterating fast and don't care about versions. |
| You need credential prompting. | No secrets needed. |
| Namespaced slash commands are fine. | You want a short slash command. |

The typical lifecycle: prototype as `~/.claude/skills/foo/SKILL.md` →
when it's stable, copy to `<plugin>/skills/foo/SKILL.md` and add a
`plugin.json` → push to a marketplace.

## Plugin directory structure

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json           ← manifest (only required file)
├── README.md                 ← human docs
├── skills/<name>/SKILL.md    ← skills
├── agents/<name>.md          ← subagents
├── hooks/hooks.json          ← hook configs
├── .mcp.json                 ← MCP servers (or inline in plugin.json)
└── scripts/                  ← hook scripts, MCP server bin, etc.
```

Only `.claude-plugin/plugin.json` is strictly required. Everything else is
optional — and Claude Code auto-discovers them at default paths.

## Try this

1. Run `/showcase-tour:inspect plugins/linkedin-post/.claude-plugin/plugin.json`
   to read this manifest in detail with annotations.
2. Then run `/showcase-tour:explain marketplaces` to learn how plugins
   actually get distributed.
