# Q4 — MCP server with credentials and per-skill scoping

> "La structure d'un serveur MCP avec clés d'accès/identifiants pour gérer
> quelles fonctions peuvent être appelées par quels skills."

The `linkedin-post` plugin bundles a real, working MCP server. This page
covers:

1. How the server is structured.
2. How credentials flow from the user → keychain → server env vars.
3. How per-skill scoping is enforced.
4. How to switch from mock mode to real mode (LinkedIn + OpenAI keys).

## File layout

```
plugins/linkedin-post/mcp-server/
├── package.json                    ← deps + npm scripts
├── tsconfig.json                   ← strict TS, ESM, NodeNext
└── src/
    ├── server.ts                   ← McpServer setup; registers tools + prompts + resources
    ├── auth.ts                     ← env-var loading, mock-mode gate, credential checks
    ├── tools/
    │   ├── linkedin.ts             ← post_linkedin_draft (mock + real)
    │   └── images.ts               ← generate_image (mock + real)
    ├── prompts/
    │   └── composer.ts             ← MCP prompt → /mcp__linkedin-post__compose_post
    └── resources/
        └── style-guide.ts          ← MCP resource → @-mention
```

An MCP server can register **three different things**, each with a
different user-facing surface:

| What | What it becomes | When to use |
|---|---|---|
| **Tool** | Callable function the model can invoke (`mcp__server__name`). Side effects, auth, returns structured output. | Verbs: post, generate, fetch, query, deploy. |
| **Prompt** | Slash command (`/mcp__server__name`) with named arguments. Inserts a templated prompt — does NOT execute. | Reusable starting contexts the user (or model) parameterizes. |
| **Resource** | `@`-mentionable content addressable by URI. | Reference material — schemas, style guides, internal docs. |

This server registers all three:

- `generate_image`, `post_linkedin_draft` — tools (verbs that do things).
- `compose_post` — prompt (templated starting context for writing posts).
- `style_guide` — resource (the team's voice rules).

The server runs as a **stdio process** spawned by Claude Code. When the
plugin is enabled, Claude Code launches it via:

```
node ${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/server.js
```

with environment variables piped in from the user's `userConfig` answers.

## Credential flow — user → keychain → env vars

The plugin's `plugin.json` declares `userConfig`:

```json
{
  "userConfig": {
    "MOCK_MODE": {
      "type": "boolean",
      "title": "Mock mode",
      "description": "When true, MCP tools log what they would do instead of calling real APIs.",
      "default": true
    },
    "OPENAI_API_KEY": {
      "type": "string",
      "title": "OpenAI API key",
      "description": "Used by generate_image when MOCK_MODE is off.",
      "sensitive": true
    },
    "LINKEDIN_ACCESS_TOKEN": {
      "type": "string",
      "title": "LinkedIn access token",
      "description": "3-legged OAuth token with the w_member_social scope.",
      "sensitive": true
    },
    "LINKEDIN_PERSON_URN": {
      "type": "string",
      "title": "LinkedIn person URN",
      "description": "urn:li:person:<your-id>"
    }
  }
}
```

When a user installs the plugin:

1. Claude Code shows a config dialog with these fields.
2. Sensitive values (`sensitive: true`) go to the system keychain (macOS
   Keychain or `~/.claude/.credentials.json` on Linux/Windows). Non-sensitive
   values go to `settings.json` under `pluginConfigs[<plugin>].options`.
3. When the MCP server starts, the values get injected as env vars via the
   `${user_config.<KEY>}` interpolation in `mcpServers`:

   ```json
   "mcpServers": {
     "linkedin-post": {
       "command": "node",
       "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/server.js"],
       "env": {
         "MOCK_MODE": "${user_config.MOCK_MODE}",
         "OPENAI_API_KEY": "${user_config.OPENAI_API_KEY}",
         "LINKEDIN_ACCESS_TOKEN": "${user_config.LINKEDIN_ACCESS_TOKEN}",
         "LINKEDIN_PERSON_URN": "${user_config.LINKEDIN_PERSON_URN}"
       }
     }
   }
   ```

4. The server reads them with `process.env.OPENAI_API_KEY` etc. Look at
   [`src/auth.ts`](../plugins/linkedin-post/mcp-server/src/auth.ts) — it's
   a thin wrapper that defaults `MOCK_MODE` to true and trims empty strings
   to `undefined`.

The point: the server never opens the keychain itself. Claude Code does the
unlocking and passes plaintext to the subprocess. That keeps the server's
attack surface tiny.

## Per-skill scoping

Each skill declares the MCP tools it's allowed to call:

```yaml
# plugins/linkedin-post/skills/post/SKILL.md
---
name: post
disable-model-invocation: true
allowed-tools: mcp__linkedin-post__post_linkedin_draft
---
```

```yaml
# plugins/linkedin-post/skills/generate-post-image/SKILL.md
---
name: generate-image
allowed-tools: mcp__linkedin-post__generate_image
---
```

When a skill is active and asks to call a tool, Claude Code checks
`allowed-tools` against the requested tool name. If it's not listed, the user
gets prompted (or the call is denied, depending on the user's permission
mode).

The naming format is `mcp__<server-name>__<tool-name>`:

| Frontmatter snippet | What it allows |
|---|---|
| `mcp__linkedin-post__post_linkedin_draft` | This one tool. |
| `mcp__linkedin-post__*` | Every tool from this server. |
| `mcp__linkedin-post` | Same as above (any tool from the named server). |

You can also enforce scoping at the **settings level** for the whole project,
in `.claude/settings.json`:

```json
{
  "permissions": {
    "deny": ["mcp__linkedin-post__post_linkedin_draft"]
  }
}
```

That blocks publishing entirely for everyone working in the repo, regardless
of which skill is active. Useful for "no one publishes from CI" rules.

## Mock mode → real mode

Default is mock. To go real:

### OpenAI (for image generation)

1. Get a key at <https://platform.openai.com/api-keys>.
2. In Claude Code, run `/plugin`, find `linkedin-post` in **Installed**,
   choose **Configure**.
3. Paste the key into `OPENAI_API_KEY`. Set `MOCK_MODE` to false.
4. `/reload-plugins` to restart the MCP server with the new env.

### LinkedIn (for posting)

LinkedIn requires 3-legged OAuth — there's no "personal access token" the way
GitHub has. The one-time setup:

1. **Create a LinkedIn developer app**: <https://www.linkedin.com/developers/apps/new>.
   Fill in the basics, list your app's "Products" and request **Share on
   LinkedIn**. That product grants the `w_member_social` scope.
2. **Configure OAuth redirect URL**: in the app's *Auth* tab, add a redirect
   like `http://localhost:8000/callback` (any URL you control during the
   one-time auth flow).
3. **Run the OAuth dance once** to get an access token. The simplest path is
   the LinkedIn Developer Portal's built-in [token generator](https://www.linkedin.com/developers/tools/oauth/token-generator)
   — pick the scope `w_member_social`, sign in, and the portal hands you a
   token (valid for 60 days).
4. **Get your person URN**:
   ```bash
   curl -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
        https://api.linkedin.com/v2/userinfo
   ```
   The `sub` field in the response is your member id. Your URN is
   `urn:li:person:<sub>`.
5. **Configure the plugin**: paste the access token into
   `LINKEDIN_ACCESS_TOKEN`, the URN into `LINKEDIN_PERSON_URN`, and turn
   `MOCK_MODE` off.

For longer-lived tokens (production use), implement the full 3-legged flow
in your own app. Microsoft Learn has the [authoritative guide](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow).

## How the server installs its dependencies

Plugins are copied to a read-only-ish cache when installed, so the server's
`node_modules` can't live inside the plugin directory. The plugin uses a
`SessionStart` hook (in `plugin.json`) to install deps into
`${CLAUDE_PLUGIN_DATA}` — a per-plugin persistent dir that survives updates.

```json
"hooks": {
  "SessionStart": [{
    "hooks": [{
      "type": "command",
      "command": "diff -q \"${CLAUDE_PLUGIN_ROOT}/mcp-server/package.json\" \"${CLAUDE_PLUGIN_DATA}/package.json\" >/dev/null 2>&1 || (mkdir -p \"${CLAUDE_PLUGIN_DATA}\" && cp \"${CLAUDE_PLUGIN_ROOT}/mcp-server/package.json\" \"${CLAUDE_PLUGIN_DATA}/package.json\" && cd \"${CLAUDE_PLUGIN_DATA}\" && npm install --omit=dev --silent && (cd \"${CLAUDE_PLUGIN_ROOT}/mcp-server\" && npm run build --silent)) || rm -f \"${CLAUDE_PLUGIN_DATA}/package.json\""
    }]
  }]
}
```

What this does, step by step:
1. `diff` the bundled `package.json` against the cached one.
2. If they match, do nothing — deps are already installed.
3. If they don't match (first run, or a plugin update bumped a dep), copy
   the new manifest, run `npm install --omit=dev` in
   `${CLAUDE_PLUGIN_DATA}`, then run `npm run build` in
   `${CLAUDE_PLUGIN_ROOT}/mcp-server` to compile the TypeScript.
4. If anything fails, delete the cached `package.json` so the next session
   tries again.

The MCP server's `mcpServers.env.NODE_PATH` is set to
`${CLAUDE_PLUGIN_DATA}/node_modules` so the compiled server picks up the
installed deps at runtime.

## Next

[`05-mcp-function-example.md`](05-mcp-function-example.md) — an annotated
walkthrough of the actual TypeScript, so you can write your own tools.
