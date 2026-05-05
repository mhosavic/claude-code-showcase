# linkedin-post

Multi-skill orchestration plugin demonstrating:

- A **main orchestrator skill** that runs a multi-step workflow.
- **Sub-skills** that handle each step and can also be called individually.
- A **subagent** as an alternative orchestration path (isolated context).
- A **bundled stdio MCP server** with two tools and credential handling.
- **Per-skill `allowed-tools`** controlling which MCP functions each skill can call.
- **`userConfig`** for prompting users for credentials at install time
  (sensitive values stored in the system keychain).

## Skills

| Skill | What it does | Allowed MCP tools |
|---|---|---|
| `/linkedin-post:post` | End-to-end orchestrator. Runs interview → draft → image → push. | `post_linkedin_draft` |
| `/linkedin-post:interview` | Gathers a structured brief from the user. | (none — pure prompt) |
| `/linkedin-post:draft-text` | Turns a brief into ~150-word post text. | (none — pure prompt) |
| `/linkedin-post:generate-image` | Generates a post image via the MCP server. | `generate_image` |

Each sub-skill is independently invokable. The orchestrator calls them in
sequence; nothing stops you from calling `/linkedin-post:draft-text` on its
own with your own brief.

## Agents

| Agent | Role |
|---|---|
| `post-coordinator` | Runs the full workflow in an isolated context window. Useful when the main conversation is busy with other work. |

## MCP server

| Tool | What it does | Auth required |
|---|---|---|
| `post_linkedin_draft` | Creates an unpublished draft post on LinkedIn. | LinkedIn OAuth access token (`w_member_social` scope) + person URN |
| `generate_image` | Generates a 1024×1024 image via OpenAI gpt-image-1. | OpenAI API key |

Both tools support **mock mode** (the default). They log what they would do and
return canned successes. No credentials needed to try the workflow end-to-end.

## File layout

```
linkedin-post/
├── .claude-plugin/
│   └── plugin.json                       ← manifest with userConfig + mcpServers
├── README.md                             ← you are here
├── skills/
│   ├── post-to-linkedin/SKILL.md         ← orchestrator
│   ├── interview-for-post/SKILL.md       ← sub-skill 1
│   ├── draft-post-text/SKILL.md          ← sub-skill 2
│   └── generate-post-image/SKILL.md      ← sub-skill 3
├── agents/
│   └── post-coordinator.md               ← optional subagent orchestrator
└── mcp-server/                           ← bundled stdio server
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── server.ts                     ← server boot, tool registration
        ├── auth.ts                       ← env-var validation, mock-mode gate
        └── tools/
            ├── linkedin.ts               ← post_linkedin_draft (mock + real)
            └── images.ts                 ← generate_image (mock + real)
```

## Try it

```bash
/plugin install linkedin-post@claude-code-showcase

# The plugin will prompt you for userConfig values.
# Leave MOCK_MODE=true on first install to try the workflow without credentials.

/linkedin-post:post we just shipped public beta of our scheduling tool, want to share with founders/CTOs
```

## Going from mock to real

See [`docs/04-mcp-server-with-auth.md`](../../docs/04-mcp-server-with-auth.md)
for step-by-step credential setup (LinkedIn OAuth + OpenAI API key).

## Why a bundled MCP server vs a hosted one

This plugin runs the MCP server as a local stdio process. That's the right
choice when:
- The server is small and self-contained.
- You want one binary that ships with the plugin (no separate hosting).
- Each user provides their own credentials via `userConfig`.

For a multi-tenant API or a server with heavy dependencies, you'd typically
host the MCP server as an HTTP service (like Notion's at `https://mcp.notion.com/mcp`)
and the plugin's `.mcp.json` would just point at the URL.

See [`docs/05-mcp-function-example.md`](../../docs/05-mcp-function-example.md)
for a deeper walkthrough of the MCP server code.
