# Q5 — Example MCP function

> "Un exemple de fonction MCP."

This page walks through the real code in
[`plugins/linkedin-post/mcp-server/`](../plugins/linkedin-post/mcp-server/).
Each section is annotated so you can copy this pattern for your own MCP
server.

## The whole stack in one screen

```
plugins/linkedin-post/mcp-server/
├── package.json          ← @modelcontextprotocol/sdk + zod
├── tsconfig.json         ← strict, ESM, NodeNext
└── src/
    ├── server.ts         ← McpServer instance — register tools, prompts, resources
    ├── auth.ts           ← env-var loading, requireCredential helper
    ├── tools/            ← functions the model invokes (verbs that DO things)
    │   ├── linkedin.ts
    │   └── images.ts
    ├── prompts/          ← templated slash commands (don't execute)
    │   └── composer.ts
    └── resources/        ← @-mentionable content (reference material)
        └── style-guide.ts
```

## 1. Server bootstrap (`src/server.ts`)

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer(
  { name: "linkedin-post", version: "0.1.0" },
  { instructions: "Tools for drafting and publishing LinkedIn posts." },
);
```

`McpServer` is the high-level class from the official TypeScript SDK. Two
arguments:

- **Identity**: `name` shows up in `/mcp` and is what the
  `mcp__linkedin-post__*` permission patterns match against.
- **Options**: `instructions` is a short prompt the model sees alongside the
  tools. Use it to nudge tool selection ("call generate_image first, then
  post_linkedin_draft").

## 2. Tool registration (`src/server.ts`)

```ts
import { z } from "zod";
import { generateImageInputSchema, generateImage } from "./tools/images.js";

server.registerTool(
  "generate_image",
  {
    description: "Generate a square image (1024×1024) for a LinkedIn post.",
    inputSchema: generateImageInputSchema.shape,
  },
  async (input) => {
    const result = await generateImage(
      generateImageInputSchema.parse(input),
      config,
    );
    return {
      content: [
        { type: "text", text: JSON.stringify(result, null, 2) },
      ],
    };
  },
);
```

Three arguments to `registerTool`:

| Position | What it is |
|---|---|
| 1 | Tool name (lowercase, snake_case). Becomes `mcp__linkedin-post__generate_image`. |
| 2 | Tool metadata: `description` (used by the model to pick the tool) + `inputSchema` (the Zod object's `.shape`). |
| 3 | Async handler. Receives the parsed inputs, returns a `{ content: [...] }` shape. |

The `.shape` on the Zod schema is important: the SDK wants the raw shape
(map of field name → Zod type), not the wrapped `ZodObject`. The SDK
converts that to JSON Schema for transport to Claude.

The handler returns content blocks. We always return a single `text` block
with a JSON-stringified result. You can also return `image` or `resource`
blocks — see the SDK docs for the full schema.

## 3. Input schema (`src/tools/images.ts`)

```ts
import { z } from "zod";

export const generateImageInputSchema = z.object({
  prompt: z.string().min(5).describe(
    "Visual description of the image. Be specific.",
  ),
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).default("1024x1024"),
  quality: z.enum(["low", "medium", "high"]).default("medium"),
});
export type GenerateImageInput = z.infer<typeof generateImageInputSchema>;
```

Every field has:

- A **type** (string, enum, number, etc.).
- A **constraint** (`.min(5)`, `.max(3000)`).
- A **description** — Claude reads this to understand how to fill the field.
- A **default** where useful — Claude doesn't have to think about it.

`z.infer<typeof X>` gives you a TypeScript type for free.

## 4. Tool implementation (`src/tools/images.ts`)

```ts
export async function generateImage(
  input: GenerateImageInput,
  config: ServerConfig,
): Promise<GenerateImageResult> {
  if (config.mockMode) {
    return mockResult(input);
  }

  const apiKey = requireCredential(
    config.openaiApiKey,
    "OPENAI_API_KEY",
    "Set it via /plugin → linkedin-post → Configure",
  );

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: input.prompt,
      size: input.size,
      quality: input.quality,
      n: 1,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenAI image generation failed: ${response.status} — ${body.slice(0, 500)}`,
    );
  }

  const data = await response.json();
  return {
    url: data.data[0].url,
    mocked: false,
    /* ... */
  };
}
```

Pattern:

1. **Mock-mode short-circuit first.** No credentials needed for a developer
   to try the workflow.
2. **`requireCredential` for each secret.** It throws a clear error if
   missing — Claude shows that error to the user, who can fix it via
   `/plugin → Configure`.
3. **Plain `fetch`** to the upstream API. No client library to debug.
4. **Surface upstream errors.** A 401 from OpenAI should reach the user with
   a recognizable message — don't swallow it into a generic "tool failed".
5. **Return a structured result.** Always include `mocked: boolean` so the
   caller knows whether the action really happened.

## 5. The mock implementation

```ts
function mockResult(input: GenerateImageInput): GenerateImageResult {
  const slug = input.prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return {
    url: `https://example.com/mock-image/${slug || "image"}.png`,
    mocked: true,
    prompt_used: input.prompt,
    size: input.size,
    quality: input.quality,
    cost_usd_estimate: 0,
  };
}
```

Two design choices that pay off:

- **Same return shape** as the real implementation. The skill that consumes
  the result doesn't care whether it's real.
- **Deterministic from input.** Same prompt → same mock URL within a
  session. Makes testing and debugging much easier than random IDs.

## 6. Stdio transport (`src/server.ts`, end of file)

```ts
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`linkedin-post MCP server up (mock=${config.mockMode})\n`);
}

main().catch((err) => {
  process.stderr.write(`linkedin-post MCP server failed: ${err}\n`);
  process.exit(1);
});
```

A few small but important details:

- **Never `console.log` anything from a stdio MCP server.** stdout is
  reserved for the MCP protocol. Diagnostic output goes to **stderr**.
- The "ready" message on stderr shows up in Claude Code's debug output
  (`claude --debug`), which is invaluable when something doesn't work.
- The `main().catch()` ensures startup errors exit non-zero so the user sees
  a clear failure in `/plugin → Errors`.

## Adding a third tool

Copy `src/tools/images.ts`, rename, change the schema and handler. In
`src/server.ts`, add another `server.registerTool(...)` block. Run `npm run
build`, run `/reload-plugins` in Claude Code. That's the whole loop.

## Beyond tools — prompts and resources

The MCP spec has three primitives. Tools are the most common, but the
other two are useful for different jobs.

### Prompts — slash commands with arguments

A **prompt** is a templated message that the user (or Claude) injects
into the conversation by invoking it. It doesn't *do* anything — it just
delivers a structured starting prompt.

```ts
// src/prompts/composer.ts
import { z } from "zod";

export const composePostArgsSchema = {
  topic: z.string().min(3).describe("The thing you want to post about."),
  audience: z.enum(["customers", "peers", "candidates", "investors", "general"]).default("general"),
};

export function composePostHandler({ topic, audience }) {
  return {
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Write a LinkedIn post about: ${topic}\n\nAudience: ${audience}\n[...style requirements...]`,
        },
      },
    ],
  };
}
```

Then in `server.ts`:

```ts
server.registerPrompt(
  "compose_post",
  {
    description: "Inject a templated LinkedIn-post prompt with style rules baked in.",
    argsSchema: composePostArgsSchema,
  },
  composePostHandler,
);
```

In Claude Code this becomes the slash command:

```
/mcp__linkedin-post__compose_post <topic> <audience>
```

The arguments are auto-prompted in the typeahead. The prompt's text gets
injected into the conversation and Claude responds to it.

**Use prompts** when you have a reusable "starting context" the user (or
model) parameterizes — code-review templates, post composers, query
generators. Anything where you want to deliver consistent instructions
without rewriting them every time.

### Resources — @-mentionable content

A **resource** is addressable content with a URI. Users pull it into the
conversation by typing `@` and picking it from the menu.

```ts
// src/resources/style-guide.ts
export const STYLE_GUIDE = {
  uri: "team-style://linkedin/voice",
  description: "Team's LinkedIn voice and style guide.",
  mimeType: "text/markdown",
  text: `# Team voice — LinkedIn\n...`,
};
```

In `server.ts`:

```ts
server.registerResource(
  "style_guide",
  STYLE_GUIDE.uri,
  {
    title: "LinkedIn voice & style guide",
    description: STYLE_GUIDE.description,
    mimeType: STYLE_GUIDE.mimeType,
  },
  async () => ({
    contents: [{ uri: STYLE_GUIDE.uri, mimeType: STYLE_GUIDE.mimeType, text: STYLE_GUIDE.text }],
  }),
);
```

In Claude Code, type `@` and pick `team-style://linkedin/voice`. The
content gets attached to the conversation as a referenced resource.

**Use resources** for reference material that lives "with" the MCP
server — schemas, internal docs, style guides, configuration snapshots.
Anything the user might want to reference but shouldn't have to copy
manually.

### Decision quick-reference

| If you want… | Register a… |
|---|---|
| Claude to *do* something with side effects (post, fetch, deploy, query). | **Tool** (`registerTool`) |
| The user to type `/<something>` and inject a parameterized prompt. | **Prompt** (`registerPrompt`) |
| The user to type `@` and reference fixed content. | **Resource** (`registerResource`) |

## What an HTTP MCP server would look like instead

This server is stdio because we ship the binary inside the plugin. If you
have a hosted service, you skip all of `node`/`npm`/build steps and just
declare an HTTP endpoint in `.mcp.json`:

```json
{
  "mcpServers": {
    "linkedin-post-hosted": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${user_config.API_KEY}"
      }
    }
  }
}
```

Notion's plugin (`makenotion/claude-code-notion-plugin`) is exactly this
pattern: their `.mcp.json` is one line pointing at `https://mcp.notion.com/mcp`,
and the OAuth flow happens via Claude Code's MCP OAuth handler.

Use HTTP when:
- The server has heavy dependencies that don't ship cleanly.
- You want centralized observability and rate limiting.
- You're already running a multi-tenant API.

Use stdio (like this showcase) when:
- The server is small.
- Each user provides their own credentials.
- You want one-binary distribution.

## In Cowork

The MCP protocol itself is identical across transports — same tools,
same prompts, same resources, same Zod schemas. Only the entry-point
changes. This showcase already structures the code that way:

```typescript
// src/server-builder.ts — shared across both transports
const server = new McpServer({ name: "linkedin-post", version: "..." }, {...});
server.registerTool("generate_image", {...}, handler);
server.registerTool("post_linkedin_draft", {...}, handler);
server.registerPrompt("compose_post", {...}, handler);
server.registerResource("style_guide", STYLE_GUIDE_URI, {...}, handler);
return server;

// src/server.ts (stdio, Claude Code)
const transport = new StdioServerTransport();
await server.connect(transport);

// src/server-http.ts (Streamable HTTP, Cowork)
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});
await server.connect(transport);
const app = createMcpExpressApp({ host: HOST });
app.post("/mcp", (req, res) => transport.handleRequest(req, res, req.body));
app.listen(PORT, HOST);
```

Three lines of transport setup are the entire Cowork delta. All the
business logic — image generation, LinkedIn post creation, mock-mode
short-circuit, schema validation, error handling — is shared. The
test suite covers both: 25 unit tests against the shared modules + 3
end-to-end protocol tests against the HTTP transport.

For Cloudflare Workers / Deno / Bun environments, swap
`StreamableHTTPServerTransport` for
`WebStandardStreamableHTTPServerTransport` (the SDK provides both).

Full Cowork answer for Q5: see
[`07-using-with-cowork.md`](07-using-with-cowork.md#q5--example-mcp-function-in-cowork).

## Next

[`06-claude-team-connectors.md`](06-claude-team-connectors.md) — making MCP
servers org-wide so individual workstations don't need to set them up.
