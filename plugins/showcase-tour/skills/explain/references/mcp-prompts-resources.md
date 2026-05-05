# Concept: mcp-prompts-resources

## What

The two MCP primitives that aren't tools:

- **Prompt** — a templated message the user (or Claude) injects into the
  conversation by invoking a slash command. Doesn't *execute* — it
  delivers a parameterized prompt.
- **Resource** — addressable content with a URI. Pulled into a
  conversation by typing `@` and picking from autocomplete.

Both come from the same MCP server as the tools. Most servers ship some
mix of all three.

## Mental model

| Primitive | Becomes | Use case |
|---|---|---|
| Tool | `mcp__server__name` callable function | Verbs Claude invokes |
| Prompt | `/mcp__server__name <args>` slash command | Reusable starting contexts |
| Resource | `@uri` mention | Reference material |

A useful framing: **tools DO things, prompts SAY things, resources ARE
things.**

## Concrete example: prompt

`plugins/linkedin-post/mcp-server/src/prompts/composer.ts`:

```typescript
export const composePostArgsSchema = {
  topic: z.string().min(3).describe("The thing you want to post about."),
  audience: z.enum(["customers", "peers", "candidates", "investors", "general"])
    .default("general"),
};

export function composePostHandler({ topic, audience }) {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Write a LinkedIn post about: ${topic}\n\nAudience: ${audience}\n[...style requirements...]`,
        },
      },
    ],
  };
}
```

Registered in `server.ts`:

```typescript
server.registerPrompt(
  "compose_post",
  {
    description: "Inject a templated LinkedIn-post prompt with style rules baked in.",
    argsSchema: composePostArgsSchema,
  },
  composePostHandler,
);
```

In Claude Code, this becomes `/mcp__linkedin-post__compose_post`. The
typeahead prompts for `topic` and `audience`. The prompt's text gets
injected into the conversation; Claude responds to it.

**This doesn't post anything.** It just delivers a structured starting
prompt the model then acts on. That's the difference from a tool.

## Concrete example: resource

`plugins/linkedin-post/mcp-server/src/resources/style-guide.ts`:

```typescript
export const STYLE_GUIDE = {
  uri: "team-style://linkedin/voice",
  description: "Team's LinkedIn voice and style guide.",
  mimeType: "text/markdown",
  text: `# Team voice — LinkedIn\n...`,  // multi-K of style rules
};
```

Registered:

```typescript
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

In Claude Code, type `@` and pick `team-style://linkedin/voice` from the
autocomplete. The content gets attached to the conversation as a
referenced resource. Claude can read it like any other context.

## When to use what

| If you want… | Register a… |
|---|---|
| Claude to do something with side effects (post, fetch, deploy). | **Tool** |
| The user to type `/<thing>` and inject a parameterized prompt. | **Prompt** |
| The user to type `@` and reference fixed content. | **Resource** |

A few patterns:

- **Code review templates** → prompts. The user invokes
  `/mcp__server__review-pr` with PR number; the prompt inlines a
  checklist.
- **Schema documentation** → resources. The user references
  `@db://schema/users` to teach Claude the table layout.
- **Database queries** → tools. Claude calls `mcp__db__query` with SQL.

A single MCP server can ship all three. The Notion server ships:
- **Tools** for actions (search, create_page, update_database).
- **Prompts** for templates (knowledge_capture, meeting_intelligence).
- **Resources** for workspace metadata referenced by URI.

## Why prompts aren't just skills

A skill in Claude Code is a markdown file. A prompt from an MCP server
is a **server-generated** message, with arguments handled by the
server's schema validator.

Use prompts when:
- The template should be **versioned with the MCP server's release** (so
  it stays in sync with the tools that go alongside it).
- The handler logic is **non-trivial** (e.g. "look up the customer's
  tier from our DB before generating the prompt text").
- You want the prompt to **be available without a separate plugin
  install** (the user already has the MCP server connected).

Otherwise, a plain skill is simpler.

## Why resources aren't just files

Resources are great when the content lives "with" the server:

- A style guide that gets updated when the brand team revises it.
- A database schema that should match the live schema.
- An internal doc tree that the server's `list_resources` exposes
  dynamically.

For static project docs, just commit them to the repo and reference by
file path. Resources earn their keep when the content has a *source of
truth* somewhere other than the repo.

## Try this

1. Run `/mcp__linkedin-post__compose_post` — try the prompt with
   topic="we shipped beta" and audience="peers".
2. In a Claude prompt, type `@` and look for
   `team-style://linkedin/voice`. Attach it. Ask Claude to summarize the
   forbidden phrases.
3. Run `/showcase-tour:inspect plugins/linkedin-post/mcp-server/src/server.ts`
   to see all three registrations side by side.
4. You've now seen all 12 concepts. Run `/showcase-tour:tour deep` if
   you want to put them together end-to-end.
