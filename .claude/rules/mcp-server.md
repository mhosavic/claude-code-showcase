# MCP server rule

How to add or modify the bundled MCP server in `plugins/linkedin-post/
mcp-server/`. Loaded by `CLAUDE.md`; applies whenever you touch any
file under `mcp-server/src/`.

## Architecture in one paragraph

Stdio MCP server. Built with `@modelcontextprotocol/sdk`. Exposes three
primitives — **tools** (`generate_image`, `post_linkedin_draft`),
**prompts** (`compose_post`), and **resources** (`team-style://linkedin/
voice`). Authentication and configuration are loaded from environment
variables in `auth.ts`. Mock mode is the default and short-circuits
every external call.

## Adding a new tool

1. **Create a file under `src/tools/`.** One file per tool. Mirror the
   shape of `images.ts`:

   ```ts
   export const myToolInputSchema = z.object({
     arg: z.string().describe("Plain-language description, used by the model."),
   });

   export async function myTool(input, config) {
     if (config.mockMode) return mockResult(input);
     const apiKey = requireCredential(config.X, "X", "Hint to fix.");
     // ... real call
     return { ok: true, /* shape consistent with other tools */ };
   }
   ```

2. **Register in `server.ts`** with `registerTool(name, { description,
   inputSchema }, handler)`. Wrap the handler so it returns
   `{ content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }`.

3. **Update the skill that calls it.** Add `mcp__linkedin-post__my_tool`
   to the skill's `allowed-tools:` frontmatter — otherwise the model
   cannot invoke it even if connected.

4. **Always implement the mock branch first.** Tests run in mock mode by
   default. Mock branch should return data shaped identically to the
   real branch.

5. **Add a unit test** under `mcp-server/src/__tests__/`. Cover: mock
   mode short-circuit, missing-credential failure, schema validation
   failure.

## Naming conventions

- Tool name: `snake_case`, verb-first (`generate_image`,
  `post_linkedin_draft`). Lowercase.
- Public client name: `mcp__<server>__<tool>` — double underscores.
- Resource URI scheme: `<topic>://<path>` — pick a non-`http(s)` scheme
  to avoid implying it's fetchable from a browser. We use
  `team-style://linkedin/voice`.

## Credentials

- All secrets come from environment variables — never hardcode.
- `auth.ts` exports a `requireCredential` helper that throws a
  user-facing error if the env var is missing. Always use it.
- The plugin manifest's `userConfig` is what prompts the user at install
  time and stores values in keychain. The MCP-server `env` block in
  `mcpServers` interpolates them: `"OPENAI_API_KEY": "${user_config.openai_api_key}"`.
- New secret? Add to `userConfig`, add to `mcpServers.linkedin-post.env`,
  add to `auth.ts`. All three.

## Mock mode

`MOCK_MODE=true` is the default. Behavior in mock mode:

- No network calls.
- Return canned-but-realistic data — same JSON shape as the real path,
  with a `mocked: true` field for clarity.
- Log what *would* have happened to stderr so the demo is observable.

Never write code that requires real credentials to *load*. The server
must boot and answer `tools/list` cleanly with no env vars set.

## Errors

- Errors thrown from tool handlers become tool errors that Claude sees.
  Make them user-actionable — "Missing OPENAI_API_KEY. Run
  `/plugin Configure` to set it." beats "Auth failed."
- Don't `console.log` to stdout — stdio MCP uses stdout for the protocol
  itself. Use `console.error` for diagnostics.

## Build and run

From `plugins/linkedin-post/mcp-server/`:

```
npm install
npm run build      # tsc → dist/
npm test           # vitest
```

The plugin's `SessionStart` hook does `npm install` and `npm run build`
on first launch automatically. Don't commit `dist/`.
