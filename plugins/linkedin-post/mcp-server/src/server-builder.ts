// Shared server construction. Used by both the stdio entry point
// (server.ts) and the HTTP entry point (server-http.ts). Same tools,
// same prompts, same resources — only the transport differs.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerConfig } from "./auth.js";
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

export function buildServer(config: ServerConfig): McpServer {
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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerPrompt(
    "compose_post",
    {
      description:
        "Inject a templated LinkedIn-post prompt with style requirements baked in. The user fills in topic and audience.",
      argsSchema: composePostArgsSchema,
    },
    composePostHandler,
  );

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

  return server;
}
