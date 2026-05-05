// linkedin-post MCP server — Cloudflare Workers entry point.
//
// Uses the Web-standard variant of the Streamable HTTP transport so it
// runs on any V8-isolate runtime: Cloudflare Workers, Deno, Bun, etc.
// Same `buildServer()`, same tools / prompts / resources as the stdio
// (server.ts) and Node-HTTP (server-http.ts) entry points.
//
// Bundled and deployed by Wrangler (not by tsc) — see
// `cloudflare/README.md` and `cloudflare/wrangler.toml.example`.
//
// This file is intentionally excluded from the main `tsc` build
// because it imports types only available at the Wrangler bundler
// level. Wrangler bundles it independently.

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { ServerConfig } from "./auth.js";
import { buildServer } from "./server-builder.js";

export interface Env {
  MOCK_MODE?: string;
  OPENAI_API_KEY?: string;
  LINKEDIN_ACCESS_TOKEN?: string;
  LINKEDIN_PERSON_URN?: string;
  // Comma-separated allowed hostnames for DNS rebinding protection.
  // Set this to your worker's deployed hostname in production.
  ALLOWED_HOSTS?: string;
}

function configFromEnv(env: Env): ServerConfig {
  const mockRaw = (env.MOCK_MODE ?? "true").trim().toLowerCase();
  const mockMode = mockRaw !== "false" && mockRaw !== "0";
  const trim = (v?: string) => {
    const t = v?.trim();
    return t && t.length > 0 ? t : undefined;
  };
  return {
    mockMode,
    openaiApiKey: trim(env.OPENAI_API_KEY),
    linkedinAccessToken: trim(env.LINKEDIN_ACCESS_TOKEN),
    linkedinPersonUrn: trim(env.LINKEDIN_PERSON_URN),
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const config = configFromEnv(env);

    if (url.pathname === "/health" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ok",
          transport: "http",
          runtime: "cloudflare-workers",
          mock: config.mockMode,
          mcp_endpoint: "/mcp",
        }),
        { headers: { "content-type": "application/json" } },
      );
    }

    if (url.pathname !== "/mcp") {
      return new Response("Not Found", { status: 404 });
    }

    // Stateless mode: each request is independent. For stateful sessions
    // across requests, wrap this in a Durable Object that holds the
    // transport across HTTP calls. The showcase uses stateless because
    // it composes well with Cowork's connector model and avoids the
    // Durable-Objects setup for a teaching example.
    const allowedHosts = env.ALLOWED_HOSTS
      ? env.ALLOWED_HOSTS.split(",").map((h) => h.trim()).filter(Boolean)
      : undefined;

    const server = buildServer(config);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      ...(allowedHosts ? { allowedHosts } : {}),
    });

    await server.connect(transport);
    return transport.handleRequest(request);
  },
};
