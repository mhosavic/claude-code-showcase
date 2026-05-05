# Deploy to Cloudflare Workers

The cheapest, fastest way to host the linkedin-post MCP server so
Cowork users can register it as a custom connector. Free tier covers
~100k requests/day, which is more than enough for this workload.

## What gets deployed

The Worker bundles `src/cloudflare-worker.ts` (and its imports — `auth.ts`,
`server-builder.ts`, `tools/`, `prompts/`, `resources/`). All the same
business logic the stdio + Node-HTTP entry points use. Wrangler does
the bundling itself; you do **not** need to run `npm run build` first.

## One-time setup

1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/):
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. Copy the example config:
   ```bash
   cd plugins/linkedin-post/mcp-server/cloudflare
   cp wrangler.toml.example wrangler.toml
   ```

3. Edit `wrangler.toml`:
   - Change `name` to something unique (e.g. `linkedin-post-mcp-acme`).
   - Optionally configure a custom route if you have a domain.

## Deploy in mock mode (no credentials)

Mock mode is the default — `wrangler.toml` sets `MOCK_MODE = "true"`.
First deploy:

```bash
wrangler deploy
```

Wrangler prints a `https://<name>.<account>.workers.dev` URL. Test it:

```bash
curl https://<your-worker-url>/health
# {"status":"ok","transport":"http","runtime":"cloudflare-workers","mock":true,"mcp_endpoint":"/mcp"}
```

## Switch to real mode

1. Set the secrets (Wrangler stores them encrypted, never in the repo):
   ```bash
   wrangler secret put OPENAI_API_KEY
   wrangler secret put LINKEDIN_ACCESS_TOKEN
   wrangler secret put LINKEDIN_PERSON_URN
   ```

2. Override `MOCK_MODE` for the production environment in
   `wrangler.toml`:
   ```toml
   [env.production.vars]
   MOCK_MODE = "false"
   ```

3. Deploy with the production environment:
   ```bash
   wrangler deploy --env production
   ```

## Add as a custom connector in Cowork

1. Open Claude Cowork.
2. **Settings → Connectors → Add custom connector**.
3. Paste the worker URL with the `/mcp` path:
   `https://<your-worker-url>/mcp`
4. Cowork connects, lists `generate_image` and `post_linkedin_draft`,
   plus the `compose_post` prompt and the `style_guide` resource.

(Same flow works in Claude Code: `claude mcp add linkedin-post-cf https://<your-worker-url>/mcp` or the equivalent UI.)

## Monitoring

Tail logs in real time:

```bash
wrangler tail
```

Cloudflare dashboard → Workers & Pages → your worker → Logs / Metrics.

## Cost

Free plan: 100,000 requests/day, 10ms CPU per request. The MCP server
typically uses <1ms CPU per request (in mock mode); real-mode calls
are dominated by the upstream LLM/LinkedIn latency, which doesn't
count against CPU time.

For most teams using this server occasionally for LinkedIn posts,
you'll never leave the free tier.

## Limitations of this reference impl

- **Stateless mode only.** Each request is independent. For
  cross-request session state (longer agent loops), wrap the
  transport in a [Durable Object](https://developers.cloudflare.com/durable-objects/).
  Not done here to keep the showcase simple.
- **No OAuth flow.** Production-quality multi-user deployments should
  expose an OAuth endpoint and key tokens by Cowork user. The MCP SDK
  has helpers under `@modelcontextprotocol/sdk/server/auth/`. For a
  single-team workload, env-var credentials via
  `wrangler secret put` are usually sufficient.
- **Cold starts.** Workers cold-start in 5–50ms — fine for this
  workload but worth knowing.
