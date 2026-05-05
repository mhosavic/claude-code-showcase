// linkedin-post MCP server — stdio transport, two tools.
//
// Started by Claude Code via the plugin's mcpServers config. Reads
// MOCK_MODE / OPENAI_API_KEY / LINKEDIN_ACCESS_TOKEN / LINKEDIN_PERSON_URN
// from the environment (injected from plugin userConfig).

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./auth.js";
import {
  generateImage,
  generateImageInputSchema,
} from "./tools/images.js";
import {
  postLinkedinDraft,
  postLinkedinDraftInputSchema,
} from "./tools/linkedin.js";
import {
  composePostArgsSchema,
  composePostHandler,
} from "./prompts/composer.js";
import { STYLE_GUIDE, STYLE_GUIDE_URI } from "./resources/style-guide.js";

const config = loadConfig();

const server = new McpServer(
  {
    name: "linkedin-post",
    version: "0.1.0",
  },
  {
    instructions: [
      "Tools for drafting and publishing LinkedIn posts.",
      config.mockMode
        ? "Currently running in MOCK MODE — no real API calls happen."
        : "Running in REAL mode — calls hit OpenAI and LinkedIn.",
      "Use generate_image to produce an image, then post_linkedin_draft to publish.",
    ].join(" "),
  },
);

server.registerTool(
  "generate_image",
  {
    description:
      "Generate a square image (default 1024×1024) for a LinkedIn post via OpenAI gpt-image-1. Returns a URL. In MOCK_MODE returns a placeholder URL.",
    inputSchema: generateImageInputSchema.shape,
  },
  async (input) => {
    const result = await generateImage(
      generateImageInputSchema.parse(input),
      config,
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "post_linkedin_draft",
  {
    description:
      "Post a draft to LinkedIn via the ugcPosts API. Returns the post URN. In MOCK_MODE logs the call and returns a fake URN. The user finalizes/publishes from LinkedIn.",
    inputSchema: postLinkedinDraftInputSchema.shape,
  },
  async (input) => {
    const result = await postLinkedinDraft(
      postLinkedinDraftInputSchema.parse(input),
      config,
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// === Prompts ===
//
// Prompts become slash commands in Claude Code:
//   /mcp__linkedin-post__compose_post <topic> <audience>
// They don't *do* anything — they inject a templated prompt into the
// conversation. Useful for "starting points" the user (or Claude) parameterizes.

server.registerPrompt(
  "compose_post",
  {
    description:
      "Inject a templated LinkedIn-post prompt with style requirements baked in. The user fills in topic and audience.",
    argsSchema: composePostArgsSchema,
  },
  composePostHandler,
);

// === Resources ===
//
// Resources are addressable content the user can pull into the conversation
// with @ in Claude Code. We expose a writing style guide here.

server.registerResource(
  "style_guide",
  STYLE_GUIDE_URI,
  {
    title: "LinkedIn voice & style guide",
    description: STYLE_GUIDE.description,
    mimeType: STYLE_GUIDE.mimeType,
  },
  async () => ({
    contents: [
      {
        uri: STYLE_GUIDE.uri,
        mimeType: STYLE_GUIDE.mimeType,
        text: STYLE_GUIDE.text,
      },
    ],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Don't log anything to stdout — stdio is reserved for the MCP protocol.
  // Diagnostic info goes to stderr.
  process.stderr.write(
    `linkedin-post MCP server up (mock=${config.mockMode})\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`linkedin-post MCP server failed: ${err}\n`);
  process.exit(1);
});
