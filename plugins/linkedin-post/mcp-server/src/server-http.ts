// linkedin-post MCP server — HTTP transport (Cowork & remote clients).
//
// Same tools / prompts / resources as the stdio entry (server.ts) — the
// registration logic lives in server-builder.ts. Only the transport
// changes. This is what Cowork users register as a custom connector
// (Settings → Connectors → Add custom connector → enter URL).
//
// Runs anywhere Node.js runs: a small VM, a container, Cloudflare
// Workers (with the WebStandard transport instead — see deploy guide),
// AWS Lambda behind an API Gateway, etc.
//
// Defaults:
//   - PORT  = 3000
//   - HOST  = 127.0.0.1 (localhost-only; switch to 0.0.0.0 in prod)
//   - PATH  = /mcp
//
// Production checklist:
//   - Bind to 0.0.0.0 (or your container's interface) and put behind
//     HTTPS via your hosting platform.
//   - Set ALLOWED_HOSTS for DNS rebinding protection if not on
//     localhost.
//   - Provide credentials via environment variables or a secrets
//     manager — same as stdio mode.

import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadConfig } from "./auth.js";
import { buildServer } from "./server-builder.js";

const config = loadConfig();
const server = buildServer(config);

const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const HOST = process.env.HOST ?? "127.0.0.1";
const MCP_PATH = process.env.MCP_PATH ?? "/mcp";
const ALLOWED_HOSTS = process.env.ALLOWED_HOSTS
  ? process.env.ALLOWED_HOSTS.split(",").map((h) => h.trim()).filter(Boolean)
  : undefined;

async function main() {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await server.connect(transport);

  const app = createMcpExpressApp(
    ALLOWED_HOSTS ? { host: HOST, allowedHosts: ALLOWED_HOSTS } : { host: HOST },
  );

  app.post(MCP_PATH, (req, res) => {
    transport.handleRequest(req, res, req.body);
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      transport: "http",
      mock: config.mockMode,
      mcp_endpoint: MCP_PATH,
    });
  });

  app.listen(PORT, HOST, () => {
    // HTTP mode logs to stdout — unlike stdio, stdout isn't reserved
    // for the protocol here.
    console.log(
      `linkedin-post MCP server up (http, mock=${config.mockMode}) — http://${HOST}:${PORT}${MCP_PATH}`,
    );
  });
}

main().catch((err) => {
  console.error(`linkedin-post MCP server failed: ${err}`);
  process.exit(1);
});
