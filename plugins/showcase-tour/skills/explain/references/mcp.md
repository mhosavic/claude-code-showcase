# Concept: mcp

## What

MCP — **Model Context Protocol** — is an open standard for connecting AI
agents to external tools and data sources. An "MCP server" is any
process that speaks the protocol; Claude Code is an "MCP client" that
connects to those servers.

A server can expose three primitives:

| Primitive | What it becomes in Claude Code |
|---|---|
| **Tools** | Functions Claude invokes (`mcp__server__tool`). |
| **Prompts** | Slash commands with arguments (`/mcp__server__name`). |
| **Resources** | `@`-mentionable content with URIs. |

## Mental model

Without MCP: Claude Code can read files, run shell commands, fetch web
pages — that's it. Anything else (Slack, GitHub, your database, your
internal API) requires writing custom integration each time.

With MCP: those integrations are **plug-and-play**. Notion publishes an
MCP server at `https://mcp.notion.com/mcp`. Connect it once. Now Claude
Code can search your Notion workspace, create pages, query databases —
without you writing any glue code.

It's the **standardization layer between AI agents and external systems**.
If a service speaks MCP, any MCP-aware client (Claude Code, Cowork,
Cursor, etc.) can use it.

## Concrete example from this showcase

`plugins/linkedin-post/.mcp.json` is implicit (the server is declared in
`plugin.json` under `mcpServers`). The server itself lives at
`plugins/linkedin-post/mcp-server/src/server.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "linkedin-post",
  version: "0.1.0",
});

// Tools (verbs)
server.registerTool("generate_image", { ... }, handler);
server.registerTool("post_linkedin_draft", { ... }, handler);

// Prompts (slash commands)
server.registerPrompt("compose_post", { ... }, handler);

// Resources (@-mentions)
server.registerResource("style_guide", "team-style://linkedin/voice", { ... }, handler);

await server.connect(new StdioServerTransport());
```

When this plugin is enabled, Claude Code spawns the server as a stdio
subprocess. The user can now:

- Invoke a tool: Claude calls `mcp__linkedin-post__generate_image`.
- Run a prompt: type `/mcp__linkedin-post__compose_post`.
- Reference a resource: type `@team-style://linkedin/voice`.

## Two transport types

| Transport | Run by | When to use |
|---|---|---|
| **stdio** | Local subprocess Claude Code spawns. | Self-contained tools each user provides their own credentials for. |
| **http** | Hosted server on the public internet (or internal network). | Multi-tenant services, OAuth-based auth, shared credentials. |

This showcase uses stdio (each user runs their own server with their own
keys). Notion / Slack / Sentry / etc. use http (one server everyone
connects to).

## When to use vs alternatives

| Use MCP when… | Don't when… |
|---|---|
| Claude needs to interact with a real system (API, DB, file format). | Plain instructions in a skill suffice. |
| You want the integration available across multiple AI clients. | The integration is single-use, throwaway. |
| You're integrating with a service that already publishes an MCP server. | Stick to plain HTTP if you'd never reuse the integration. |

MCP vs alternatives:

- **vs a skill that uses Bash + curl** — works for prototypes; not
  reusable, not auditable, not safely deployable to a team. MCP gives
  you typed inputs, separate auth, and per-server permissions.
- **vs custom code in CLAUDE.md** — context-only, not actionable. MCP is
  for actions.

## Try this

1. Run `/showcase-tour:explain mcp-tools` to learn about the most common
   MCP primitive.
2. Then run `/showcase-tour:explain mcp-prompts-resources` for the other
   two.
3. Then run `/showcase-tour:inspect plugins/linkedin-post/mcp-server/src/server.ts`
   to read the actual server bootstrap code.
