# Concept: mcp-tools

## What

MCP tools are functions an MCP server exposes. Claude calls them just
like it calls built-in tools (Read, Bash, Edit, etc.) — but the
implementation lives in the server, not in Claude Code.

A tool has a **name**, an **input schema** (Zod / JSON Schema), and a
**handler** that runs when invoked.

## Mental model

A tool is **a function call where the LLM picks the arguments**. Claude
sees the tool's description and input schema, decides if calling it
helps the user's task, fills in the arguments, and invokes it. The
server runs the handler; the result comes back; Claude continues.

Tools are **verbs**. Anything Claude *does* in the world (post, fetch,
generate, query, deploy, send) is a tool call.

## Concrete example from this showcase

`plugins/linkedin-post/mcp-server/src/tools/images.ts`:

```typescript
export const generateImageInputSchema = z.object({
  prompt: z.string().min(5).describe(
    "Visual description of the image. Be specific."
  ),
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).default("1024x1024"),
  quality: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function generateImage(input, config) {
  if (config.mockMode) return mockResult(input);

  const apiKey = requireCredential(config.openaiApiKey, "OPENAI_API_KEY", "...");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-image-1", prompt: input.prompt, ... }),
  });

  // ... parse response, return { url, mocked: false, ... }
}
```

And the registration in `server.ts`:

```typescript
server.registerTool(
  "generate_image",
  {
    description: "Generate a square image (1024×1024) for a LinkedIn post via gpt-image-1.",
    inputSchema: generateImageInputSchema.shape,
  },
  async (input) => {
    const result = await generateImage(generateImageInputSchema.parse(input), config);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);
```

When Claude Code is connected, this tool shows up as
`mcp__linkedin-post__generate_image`. Claude can call it whenever the
description matches the user's intent. The mock-mode short-circuit means
it works even without credentials.

## The naming convention

`mcp__<server-name>__<tool-name>` — double underscores. Used in:

- `allowed-tools:` frontmatter on skills.
- `permissions.allow / deny` in settings.
- Error messages and `claude --debug` output.

## Anatomy of a good tool definition

1. **Name in `snake_case`**, lowercase. Verb-first if it does something.
2. **Description that includes WHEN to use it.** Same advice as skill
   descriptions — Claude reads this to decide whether to call.
3. **Input schema with `.describe()` on every field.** The model uses
   these descriptions when filling arguments.
4. **Defaults on every optional field.** The model doesn't have to think
   about parameters it doesn't care about.
5. **Returns `{ content: [...] }`** with `type: text`, `image`, or
   `resource`. Most tools return text (often JSON).
6. **Errors thrown become tool errors** that Claude sees. Make them
   user-facing — "Missing OPENAI_API_KEY. Set via /plugin Configure."

## When to use vs alternatives

| Use an MCP tool when… | Use a skill when… |
|---|---|
| You need real I/O — HTTP, files, DB. | Text instructions are enough. |
| You want typed inputs validated by a schema. | The "input" is free-form prose. |
| The action has side effects you want to audit. | The action is a pure prompt. |
| You want the same capability available across AI clients. | This is Claude Code-specific. |

## Try this

1. Run `/showcase-tour:inspect plugins/linkedin-post/mcp-server/src/tools/images.ts`
   to walk through the full source with annotations on what every part
   does.
2. Then run `/showcase-tour:explain mcp-prompts-resources` for the
   other two MCP primitives.
