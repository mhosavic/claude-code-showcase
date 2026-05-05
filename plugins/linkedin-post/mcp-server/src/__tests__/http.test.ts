import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { ServerConfig } from "../auth.js";
import { buildServer } from "../server-builder.js";

const MOCK_CONFIG: ServerConfig = {
  mockMode: true,
  openaiApiKey: undefined,
  linkedinAccessToken: undefined,
  linkedinPersonUrn: undefined,
};

async function startTestServer() {
  const server = buildServer(MOCK_CONFIG);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  await server.connect(transport);

  const app = createMcpExpressApp({ host: "127.0.0.1" });
  app.post("/mcp", (req, res) => {
    transport.handleRequest(req, res, req.body);
  });

  const httpServer = await new Promise<import("node:http").Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const { port } = httpServer.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/mcp`,
    close: async () => {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      await transport.close();
      await server.close();
    },
  };
}

async function postMcp(
  url: string,
  payload: Record<string, unknown>,
  sessionId?: string,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  return res;
}

function parseSseFrame(body: string): unknown {
  // Streamable HTTP returns SSE frames; pull the first `data:` line out.
  const dataLine = body.split("\n").find((l) => l.startsWith("data: "));
  if (!dataLine) throw new Error(`No data frame in body: ${body}`);
  return JSON.parse(dataLine.slice("data: ".length));
}

describe("HTTP transport — end-to-end protocol", () => {
  let server: Awaited<ReturnType<typeof startTestServer>>;

  beforeEach(async () => {
    server = await startTestServer();
  });

  afterEach(async () => {
    await server.close();
  });

  it("responds to initialize with all three primitive capabilities", async () => {
    const res = await postMcp(server.url, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "test", version: "0.0.0" },
      },
    });
    expect(res.ok).toBe(true);
    const sessionId = res.headers.get("mcp-session-id");
    expect(sessionId).toBeTruthy();

    const frame = parseSseFrame(await res.text()) as {
      result: {
        capabilities: Record<string, unknown>;
        serverInfo: { name: string; version: string };
      };
    };
    expect(frame.result.serverInfo.name).toBe("linkedin-post");
    expect(frame.result.capabilities.tools).toBeDefined();
    expect(frame.result.capabilities.prompts).toBeDefined();
    expect(frame.result.capabilities.resources).toBeDefined();
  });

  it("lists both registered tools after initialize", async () => {
    const initRes = await postMcp(server.url, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "test", version: "0.0.0" },
      },
    });
    const sessionId = initRes.headers.get("mcp-session-id")!;
    await initRes.text(); // drain

    // The notifications/initialized notification is required before
    // most clients send tools/list, but Streamable HTTP doesn't
    // strictly enforce order — just send it for protocol cleanliness.
    await postMcp(
      server.url,
      { jsonrpc: "2.0", method: "notifications/initialized" },
      sessionId,
    );

    const toolsRes = await postMcp(
      server.url,
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      sessionId,
    );
    expect(toolsRes.ok).toBe(true);
    const frame = parseSseFrame(await toolsRes.text()) as {
      result: { tools: Array<{ name: string }> };
    };
    const names = frame.result.tools.map((t) => t.name).sort();
    expect(names).toEqual(["generate_image", "post_linkedin_draft"]);
  });

  it("rejects requests without a session id (after first init)", async () => {
    // Send a non-initialize request with no session header — should 400.
    const res = await postMcp(server.url, {
      jsonrpc: "2.0",
      id: 99,
      method: "tools/list",
      params: {},
    });
    expect(res.status).toBe(400);
  });
});
