// linkedin-post MCP server — STDIO transport (Claude Code).
//
// Started by Claude Code via the plugin's mcpServers config. Reads
// MOCK_MODE / OPENAI_API_KEY / LINKEDIN_ACCESS_TOKEN / LINKEDIN_PERSON_URN
// from the environment (injected from plugin userConfig).
//
// Tool / prompt / resource registrations live in server-builder.ts so
// the HTTP entry point (server-http.ts) can reuse them verbatim. Same
// code, two transports.

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./auth.js";
import { buildServer } from "./server-builder.js";

const config = loadConfig();
const server = buildServer(config);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Don't log anything to stdout — stdio is reserved for the MCP protocol.
  // Diagnostic info goes to stderr.
  process.stderr.write(
    `linkedin-post MCP server up (stdio, mock=${config.mockMode})\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`linkedin-post MCP server failed: ${err}\n`);
  process.exit(1);
});
