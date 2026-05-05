# Q7 — Using this showcase with Claude Cowork

> "He might want to use claude cowork with this project."

> 🇫🇷 Version française : [`07-using-with-cowork.fr.md`](07-using-with-cowork.fr.md)

Claude Cowork is the **Claude desktop app with agentic features** —
sub-agents, file access, scheduled tasks. It shares the same plugin /
connector / MCP infrastructure as Claude Code, but with a different
distribution model and surface.

This page is the **Cowork track** of the showcase. For each of
Francis's six original questions, it shows what's the same in Cowork,
what's different, and the recommended path today.

## TL;DR

| Concept | Claude Code | Claude Cowork |
|---|---|---|
| Where plugins come from | Custom GitHub marketplaces (e.g. `mhosavic/claude-code-showcase`) **OR** `claude.com/plugins` | `claude.com/plugins` only (today) |
| MCP servers | stdio (bundled) **OR** hosted HTTP (connector) | Hosted HTTP only — "Custom Connector" |
| Skill model (`SKILL.md`) | Plugin skills, project skills, user skills | Plugin skills (from `claude.com/plugins`); per-conversation custom instructions live in **Projects** |
| Per-skill scoping (`allowed-tools`) | Yes | Yes — same plugin format |
| `disable-model-invocation`, etc. | Yes | Yes (same frontmatter) |
| Hooks (`PreToolUse`, etc.) | Yes | No (Claude Code-specific) |
| Bang-injection (`!`-blocks) | Yes | No (Claude Code-specific) |
| `CLAUDE.md` / `.claude/rules/` | Yes | No (Cowork uses Project instructions) |

The single biggest enabler for Cowork is that **`claude.com/plugins`
is shared between Claude Code and Cowork** — plugins published there
can target either or both. And **any Cowork user can add a custom MCP
server URL** via Settings → Connectors → Add custom connector. So the
LinkedIn MCP server in this showcase becomes Cowork-usable simply by
running it as HTTP instead of stdio. No admin needed.

## Q1 — Simple skill, in Cowork

The `draft-email` plugin's `SKILL.md` is **identical** for Cowork. The
file format, frontmatter, `$ARGUMENTS` substitution, `description`,
`disable-model-invocation` — all the same. What changes is
distribution:

| Path | What it looks like |
|---|---|
| **A. Submit to `claude.com/plugins`** (recommended for shared use) | Plugin lives in Anthropic's catalog. Cowork users browse Settings → Plugins → install. Works in Claude Code too. |
| **B. Use Project instructions** (one-off, per-project) | Open a Project in Cowork, paste the skill body into the project's custom instructions. No `/draft-email:draft` command, but the behavior is available in that project. |
| **C. Wait for managed admin push** | Anthropic is rolling out the Claude Team admin marketplace push so a custom GitHub marketplace can land in Cowork. Today this works for Claude Code; Cowork support is in motion. |

For Francis's team: pick **A** if `draft-email` should be available
universally, **B** if it's project-specific.

## Q2 — Complex orchestration, in Cowork

`linkedin-post`'s 4-skill orchestration (`interview` → `draft-text` →
`generate-image` → `post`) works in Cowork the same way it works in
Claude Code, with two transport changes:

1. **The MCP server runs as HTTP**, not stdio. See Q4/Q5 below for the
   code.
2. **The skills come from `claude.com/plugins`** (or Project
   instructions, per Q1).

Sub-skill chaining works the same — Cowork can call sub-skills from
an orchestrator's body. The `disable-model-invocation: true` and
`allowed-tools` frontmatter are honored identically.

## Q3 — Sharing with the team

| Distribution path | Claude Code | Cowork |
|---|---|---|
| GitHub-hosted custom marketplace (`/plugin marketplace add owner/repo`) | ✅ | ❌ today |
| `claude.com/plugins` submission | ✅ (auto-available) | ✅ (auto-available) |
| Server-managed `enabledPlugins` push (Team / Enterprise admin console) | ✅ today | 🟡 rolling out |

For Cowork-first teams today: the practical answer is "submit to
`claude.com/plugins`" or use Project-level custom instructions per
project.

## Q4 — MCP server with credentials and per-skill scoping (HTTP variant)

The same TypeScript server in `plugins/linkedin-post/mcp-server/`
ships with **two transport entry points**:

| File | Transport | Where it runs |
|---|---|---|
| `src/server.ts` | stdio | Claude Code (bundled inside the plugin) |
| `src/server-http.ts` | Streamable HTTP | Cowork (custom connector), Claude Code remote, any MCP client |

Both call into the same `src/server-builder.ts` — same tools, same
prompts, same resources, same `auth.ts`, same mock mode. Switching
transport is a 3-line change at the entry point.

The HTTP server respects the same env-var contract:
- `MOCK_MODE=true` (default) — no real API calls
- `OPENAI_API_KEY` — for `generate_image` in real mode
- `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_PERSON_URN` — for `post_linkedin_draft`
- `PORT=3000` (default), `HOST=127.0.0.1` (default), `MCP_PATH=/mcp` (default)
- `ALLOWED_HOSTS` — comma-separated list for DNS rebinding protection
  on non-localhost hosts

To run locally:

```bash
cd plugins/linkedin-post/mcp-server
npm install
npm run build
MOCK_MODE=true npm run start:http
# linkedin-post MCP server up (http, mock=true) — http://127.0.0.1:3000/mcp
```

Per-skill scoping in Cowork: when Francis adds the HTTP server as a
custom connector, Cowork's UI lets him **enable or disable individual
tools** per connector (Settings → Connectors → click the connector →
Tools list). Equivalent to `allowed-tools` in a Claude Code skill, just
applied at the connector level instead of the skill level.

## Q5 — Example MCP function, in Cowork

The MCP protocol is identical across stdio and HTTP — same `tools/`,
same `prompts/`, same `resources/`, same Zod schemas. The only file
that's transport-specific is the entry point.

`src/server-builder.ts`:

```typescript
// Imports + server construction (identical for both transports).
const server = new McpServer({ name: "linkedin-post", version: "0.1.0" }, {...});
server.registerTool("generate_image", {...}, handler);
server.registerTool("post_linkedin_draft", {...}, handler);
server.registerPrompt("compose_post", {...}, handler);
server.registerResource("style_guide", STYLE_GUIDE_URI, {...}, handler);
return server;
```

`src/server.ts` (stdio):
```typescript
const transport = new StdioServerTransport();
await server.connect(transport);
```

`src/server-http.ts` (HTTP):
```typescript
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});
await server.connect(transport);
const app = createMcpExpressApp({ host: HOST });
app.post("/mcp", (req, res) => transport.handleRequest(req, res, req.body));
app.listen(PORT, HOST);
```

That's the full transport delta. All the business logic — image
generation, LinkedIn post creation, mock-mode short-circuit, schema
validation, error handling — is shared.

## Q6 — Adding the MCP server to Cowork

For an individual Cowork user (no admin needed):

1. Deploy the HTTP server somewhere reachable (see [Deploy guide](#deploy-guide) below).
2. In Cowork: **Settings → Connectors → Add custom connector**.
3. Enter the deployed URL (e.g. `https://linkedin-post.example.com/mcp`).
4. Authenticate (if the deployment uses OAuth — see auth note below).
5. The two tools, one prompt, and one resource appear in Cowork.

For an org rollout: the same HTTP URL can be registered as an
**organization connector** through Anthropic support. Once
registered, every user in the org sees it without manual setup. This
is Path A from [Q6](06-claude-team-connectors.md) and works in Cowork
identically.

## Deploy guide

### Option 1 — A small VM (simplest)

```bash
# On a server (Linode / DigitalOcean / Hetzner / EC2):
git clone https://github.com/mhosavic/claude-code-showcase.git
cd claude-code-showcase/plugins/linkedin-post/mcp-server
npm install
npm run build

# Run behind systemd / pm2 / etc. — bind to localhost and put nginx in front:
HOST=127.0.0.1 PORT=3000 \
  MOCK_MODE=false \
  OPENAI_API_KEY=... LINKEDIN_ACCESS_TOKEN=... LINKEDIN_PERSON_URN=... \
  npm run start:http
```

Front it with nginx + Let's Encrypt for HTTPS. Cowork requires HTTPS
for non-localhost connectors.

### Option 2 — Cloudflare Workers (cheapest, fastest)

The Streamable HTTP transport has a Web-standard variant
(`WebStandardStreamableHTTPServerTransport`) designed for Workers /
Deno / Bun. Wrap `buildServer()` in a Workers `fetch` handler:

```typescript
// worker.ts (sketch — full version in a follow-up commit)
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildServer } from "./server-builder.js";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname !== "/mcp") {
      return new Response("Not Found", { status: 404 });
    }
    const config = { mockMode: env.MOCK_MODE === "true", openaiApiKey: env.OPENAI_API_KEY, ... };
    const server = buildServer(config);
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
    await server.connect(transport);
    return transport.handleRequest(request);
  },
};
```

Deploy with `wrangler deploy`. Set credentials via `wrangler secret put`.

### Option 3 — Vercel / Lambda

Wrap the Express app from `server-http.ts` as a serverless handler.
For Vercel, drop the file in `api/mcp.ts` and export the Express app
as the default. For Lambda, use `serverless-http` to adapt.

## Authentication (real mode)

The current showcase uses environment variables for credentials. For a
production Cowork connector, the recommended path is **OAuth**: have
the connector itself act as an OAuth provider so each Cowork user
authenticates with their own LinkedIn / OpenAI account, and tokens
land server-side keyed by Cowork user ID. The MCP SDK has built-in
OAuth helpers under `@modelcontextprotocol/sdk/server/auth/`. That's
beyond this showcase's pedagogy, but the auth.ts module is structured
so you can swap env-var loading for a per-request token lookup.

## What about Cowork-specific features that aren't in Claude Code?

Cowork offers some capabilities Claude Code doesn't (file picker UI,
scheduled tasks, mobile delegation). They're not part of this
showcase's scope, but if Francis uses them, the LinkedIn MCP server
runs underneath them identically — Cowork is just another MCP client.

## Where to go for help

- **Cowork issues**: support tab in the desktop app, or
  <https://support.claude.com>.
- **Custom connector setup**: <https://modelcontextprotocol.io/docs/develop/connect-remote-servers>
- **Plugin / MCP issues**: `claude --debug` from the Claude Code CLI
  is the fastest way to surface load errors that affect both
  surfaces.
- **Submitting to `claude.com/plugins`**: <https://claude.ai/settings/plugins/submit>
