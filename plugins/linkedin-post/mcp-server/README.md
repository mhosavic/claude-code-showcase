# linkedin-post MCP server

Stdio MCP server bundled with the `linkedin-post` plugin. Two tools:

| Tool | Inputs | What it does |
|---|---|---|
| `generate_image` | `prompt`, `size`, `quality` | Generates an image via OpenAI gpt-image-1. |
| `post_linkedin_draft` | `text`, `image_url?`, `visibility` | Creates a post on LinkedIn via the ugcPosts API. |

Both default to **mock mode** — no real API calls.

## How it runs

The plugin's `plugin.json` declares the server under `mcpServers`. When the
plugin is enabled, Claude Code:

1. Runs the `SessionStart` hook, which copies `package.json` into
   `${CLAUDE_PLUGIN_DATA}` (a persistent dir that survives plugin updates),
   runs `npm install --omit=dev` there, then `npm run build` in
   `${CLAUDE_PLUGIN_ROOT}/mcp-server/`.
2. Spawns the server with `node ${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/server.js`.
3. Pipes the user's `userConfig` values in as environment variables.

The reason for the dance: plugin caches are read-only-ish (you don't want to
write `node_modules` into them on every install), and `${CLAUDE_PLUGIN_DATA}`
is the right place for installed dependencies.

## Building locally (for development)

```bash
cd plugins/linkedin-post/mcp-server
npm install
npm run build
MOCK_MODE=true node dist/server.js
```

You should see `linkedin-post MCP server up (mock=true)` on stderr. Stdin/stdout
speak the MCP protocol.

## Tests

```bash
npm test            # vitest run — unit tests for tools and auth
npm run test:watch  # iterative TDD mode
```

Tests live in `src/__tests__/` and cover mock-mode short-circuiting,
schema validation, and missing-credential error paths. The default
`tsc` build excludes them so they never end up in `dist/`.

## Going from mock to real

The auth model is intentionally simple:

- **OpenAI**: `OPENAI_API_KEY` env var. Bearer auth on the API request.
- **LinkedIn**: 3-legged OAuth access token in `LINKEDIN_ACCESS_TOKEN` (scope
  `w_member_social`) plus `LINKEDIN_PERSON_URN`. The plugin's `userConfig`
  prompts for both at install time and stores them in the system keychain.

See [`../../../docs/04-mcp-server-with-auth.md`](../../../docs/04-mcp-server-with-auth.md)
for the full setup walkthrough.

## Per-skill scoping

The plugin uses `allowed-tools` in each skill's frontmatter to control which
MCP functions that skill can call:

| Skill | Allowed MCP tools |
|---|---|
| `/linkedin-post:post` (orchestrator) | `mcp__linkedin-post__post_linkedin_draft` |
| `/linkedin-post:generate-image` | `mcp__linkedin-post__generate_image` |
| `/linkedin-post:interview` | (none) |
| `/linkedin-post:draft-text` | (none) |

So the orchestrator can publish, the image skill can generate, and the
interview/draft skills can't touch the MCP server at all. This is the
mechanism behind the question "how do I control which functions can be called
by which skills."

## Why `legacy ugcPosts` and not the new `posts` API

The newer `/rest/posts` endpoint requires a `LinkedIn-Version` header, supports
true drafts (`isReshareDisabledByAuthor`, lifecycle `DRAFT`), and is the
recommended path for production. We use ugcPosts here because:

- It works with a single OAuth scope (`w_member_social`) — no extra approval.
- The request shape is simpler and easier to teach.
- For a showcase repo, the goal is "show how MCP tools call external APIs",
  not "be a polished LinkedIn integration".

To migrate to the newer API: swap the URL to `https://api.linkedin.com/rest/posts`,
add the `LinkedIn-Version: 202410` header, and adjust the body shape (the new
schema is documented at https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api).
