# Tour script — English

Loaded by `tour/SKILL.md` after Steps 0–2a (live state, mode, language).
Follow this script from Step 2b through the wrap. Apply the mode filter
from `SKILL.md` Step 1: in `quick` mode, only run topics marked
`(always)`. In `cowork` mode, skip topics marked `[cowork-skip]` and
favor the Cowork-specific framing where present.

## Step 2b — Greet and confirm mode

> "Hey — I'll walk you through the showcase. Mode: **standard** (~15
> min, all features). Want me to switch to **quick** or **deep**, or
> jump to a specific topic? Otherwise reply `go` and we'll start."

(If they passed a specific mode in `$ARGUMENTS`, swap "standard" for
the chosen mode and adjust the time estimate accordingly.)

## Step 2c — If "In showcase repo" is no, mention it

> "You're not in the showcase repo. I'll point at GitHub URLs instead
> of local paths. If you haven't installed the four plugins yet, run:"

```
/plugin marketplace add mhosavic/claude-code-showcase
/plugin install draft-email@claude-code-showcase
/plugin install commit-helper@claude-code-showcase
/plugin install linkedin-post@claude-code-showcase
/plugin install showcase-tour@claude-code-showcase
/reload-plugins
```

Wait for the user to reply before continuing.

## Step 3 — Run the tour

Do the topics below **in order**, one at a time. After each topic:

1. Give the **1-2 sentence "what."**
2. Give the **exact command** for the user to try.
3. **Wait for them to try it.** Don't dump the next topic on them.
4. Once they reply (with the result, or "next", or a question),
   **react briefly** — confirm what happened, answer their question,
   or troubleshoot if it didn't work.
5. Offer a **deeper-dive triple**: a doc, an `/showcase-tour:explain
   <concept>` lesson for the theory, and an `/showcase-tour:inspect
   <file>` walkthrough for the actual code. Don't list all three
   every time — pick the one or two most relevant.
6. Move to the next topic.

Skip a topic if they want; dwell on one if they want.

### About the deeper-dive triple

Three orthogonal learning paths besides this tour:

- **Read the docs** — `docs/01-...md` through `docs/09-...md`.
  Linear, comprehensive, ~30 min top-to-bottom.
- **Concept lesson** — `/showcase-tour:explain <concept>`. ~5 min,
  focused on one concept. Try `/showcase-tour:explain` with no args
  for the full catalog.
- **Code walkthrough** — `/showcase-tour:inspect <file-or-target>`.
  Reads the actual code with annotations.

Mention them naturally. Curious *why* something works → `explain`.
Want to see the code → `inspect`. Want comprehensive → `docs/`.

### Q-mapping (so you can navigate)

| Q | Topic | Section | Cowork mode |
|---|---|---|---|
| Q1 | Simple skill structure | B | ✓ (with Cowork distribution note) |
| Q2 | Complex orchestration | F | ✓ (HTTP connector for the MCP) |
| Q3 | Sharing in Claude Team | J | ✓ (claude.com/plugins, Project instructions, admin push) |
| Q4 | MCP server with credentials + per-skill scoping | F + G | ✓ (HTTP transport + custom connector) |
| Q5 | Example MCP function | G + H + I | ✓ (same code, HTTP transport) |
| Q6 | MCP as Claude Team connector | K | ✓ **identical** to Claude Code |
| Q7 | Cowork compatibility | L | ✓ (expanded into the full walkthrough) |
| Q8 | `CLAUDE.md` + `.claude/rules/` | L½ | `[cowork-skip]` |
| extra | Bang-blocks | C | `[cowork-skip]` |
| extra | Path-scoped activation | D | `[cowork-skip]` |
| extra | PreToolUse hooks | E | `[cowork-skip]` |

If they say "I only care about one question," jump straight to that
section, then offer to keep going.

### A. Big picture (always)

> "The showcase has 4 plugins demonstrating different complexity
> tiers: `draft-email` (simplest), `commit-helper` (mid-tier),
> `linkedin-post` (full orchestration with bundled MCP server), and
> `showcase-tour` (this tour itself — meta)."

No command to run. Just confirm the user is oriented. Reference:
`README.md` for the layout map.

### B. Simple skill — answers Q1 (always — even in quick mode)

> "A **skill** is a prompt Claude can invoke as a slash command. The
> simplest useful plugin is one skill in one file."

Have them try:

```
/draft-email:draft tell my coworker the quarterly review meeting is moved to Thursday
```

After they try it, point out: the output is grounded in the brief,
the skill leaves bracketed placeholders, the structure (Subject /
body / sign-off) comes from the SKILL.md instructions. Reference:
`docs/01-simple-skill.md`.

### C. Dynamic context injection — bang-blocks (skip in quick) `[cowork-skip]`

> "A skill's markdown can include 'bang-blocks': an exclamation mark
> immediately followed by a backtick-delimited shell command. They
> run *before* the prompt reaches Claude — the output replaces the
> placeholder. Result: live data with no agentic loop."

Have them try (in any git repo with at least one staged change):

```
/commit-helper:commit-msg
```

After: point out that Claude wrote a commit message *grounded in the
actual diff*, not a generic one — because the skill embedded a
bang-injected `git diff --cached` and the diff was inlined before
Claude saw the prompt. Reference:
`plugins/commit-helper/skills/commit-msg/SKILL.md`.

### D. Path-scoped skills (skip in quick) `[cowork-skip]`

> "Skills can declare `paths:` in frontmatter. Claude only loads them
> into context when reading files matching the globs. Keeps context
> lean when a team has many internal skills."

Have them open any TypeScript file (`src/index.ts`, etc.) and ask
Claude to clean up the imports. Without naming the skill, Claude
should auto-pick `/commit-helper:cleanup-imports` because the path
matched.

If there's no TS file handy, just describe it — they can come back
to it. Reference:
`plugins/commit-helper/skills/cleanup-imports/SKILL.md`.

### E. Hooks — real safety guards (skip in quick) `[cowork-skip]`

> "Hooks are **deterministic** — unlike `CLAUDE.md` instructions
> which are soft preferences. The `commit-helper` plugin ships a
> `PreToolUse` hook that blocks force-pushes to main, bare `git
> reset --hard`, and `git clean -f`."

Ask the user to ask Claude to "force-push my branch to main."
Claude *won't* run it — the hook intercepted before the shell call.
Reference: `plugins/commit-helper/scripts/guard-dangerous-git.sh`
(~50 lines, 30 seconds to read).

### F. Complex orchestration — answers Q2 (also touches Q4)

> "Skills can orchestrate sub-skills. `linkedin-post:post` walks a
> 4-step workflow: interview → draft text → generate image → push
> draft to LinkedIn."

Have them try:

```
/linkedin-post:post we just shipped public beta of our scheduling tool
```

Claude will start the interview. They can answer briefly (or skip
with "just write something"), watch the draft come back, accept it,
and watch the MCP tools fire. **Mock mode is on by default — nothing
is actually posted.** Tell them this clearly.

After: point out (a) the orchestrator skill's body is plain prose
listing the 4 steps, (b) each sub-skill is independently invokable
(they could call `/linkedin-post:draft-text` directly), (c) the
`mocked: true` field in the tool result. Reference:
`docs/02-complex-skill-orchestration.md`.

**In Cowork mode**: also mention that this orchestration works the
same way in Cowork — with the MCP server running as HTTP instead of
stdio, registered as a custom connector. Point at
`docs/07-using-with-cowork.md#q2--complex-orchestration-in-cowork`.

### G. MCP tools — answers Q4 + part of Q5 (skip in quick)

> "The `linkedin-post` plugin bundles an MCP server with two tools:
> `generate_image` (OpenAI gpt-image-1 — mock by default) and
> `post_linkedin_draft` (LinkedIn ugcPosts — mock by default).
> `allowed-tools` in each skill's frontmatter controls which skill
> can call which tool."

Have them check:

```
/mcp
```

Look for `linkedin-post` listed and `connected`. If pending or
failed, that's the SessionStart hook still building. Reference:
`docs/04-mcp-server-with-auth.md` and `docs/05-mcp-function-example.md`.

**In Cowork mode**: the same two tools are reachable as a custom
connector. Have them open `cd plugins/linkedin-post/mcp-server &&
npm run start:http` in a terminal, then visit Settings → Connectors
→ Add custom connector with `http://127.0.0.1:3000/mcp`. The same
tools appear. Reference:
`docs/07-using-with-cowork.md#q4--mcp-server-with-credentials-and-per-skill-scoping-http-variant`.

### H. MCP prompts — slash commands from servers (skip in quick)

> "An MCP server can expose **prompts** alongside tools. Prompts
> become slash commands with named arguments. They inject a
> templated prompt into the conversation — they don't *do* anything
> themselves."

Have them try:

```
/mcp__linkedin-post__compose_post
```

Claude Code will prompt for a `topic` and `audience`. It then
injects a templated prompt with audience-specific guidance and style
rules. Reference:
`plugins/linkedin-post/mcp-server/src/prompts/composer.ts`.

### I. MCP resources — @-mentionable content (skip in quick)

> "An MCP server can expose **resources**: addressable content the
> user pulls in with `@`. Right for reference material like style
> guides or schemas."

Have them try typing `@` in a Claude prompt and looking for
`team-style://linkedin/voice` in the autocomplete. Have them attach
it and ask Claude to "summarize the forbidden phrases." Reference:
`plugins/linkedin-post/mcp-server/src/resources/style-guide.ts`.

### J. Distribution to the team — answers Q3 (always)

> "Three patterns to distribute. Each developer adds the marketplace
> manually. Or commit `extraKnownMarketplaces` in a project's
> `.claude/settings.json`. Or — Team / Enterprise plans — push it via
> server-managed settings from the admin console."

No command to run; reference: `docs/03-team-distribution.md`. In
quick mode, just mention this exists and that the docs have details.

**In Cowork mode**: the three patterns are different —
`claude.com/plugins` submission, Project custom instructions, or
managed admin push (rolling out). Point at
`docs/07-using-with-cowork.md#q3--sharing-with-the-team`.

### K. Claude Team connectors — answers Q6 (skip in quick)

> "For org-wide MCP, two paths: a **hosted HTTP MCP server** →
> register in the Claude.ai admin Connectors UI; a **bundled stdio
> MCP server** → ship via a plugin marketplace pushed by
> server-managed settings."

Reference: `docs/06-claude-team-connectors.md`.

**In Cowork mode**: explicitly call out that **Path A is identical
between Claude Code and Cowork** — once the HTTP MCP is registered as
an org connector, every user in both surfaces sees it without
manual setup. This is the convergence point of the two products.

### L. Cowork compatibility — answers Q7 (always)

> "Cowork is the Claude desktop app. Hosted-HTTP MCP connectors work
> natively. Custom plugin distribution to Cowork specifically is
> being unified with Claude Code; the recommended path today is to
> host the MCP server as HTTP and register it as a connector for
> Cowork users."

Reference: `docs/07-using-with-cowork.md`.

**In Cowork mode**: expand this from the brief blurb above into a
walk-through of the deploy options. Mention `cloudflare/README.md`
specifically — that's the cheapest, fastest path. Walk through
adding the URL in Settings → Connectors.

### L½. CLAUDE.md and rules — answers Q8 / bonus (skip in quick) `[cowork-skip]`

> "Two layers of 'house style' that apply repo-wide on every turn:
> a single `CLAUDE.md` at repo root for durable policy, plus
> `.claude/rules/` for topic-specific deep-dives loaded only when
> relevant. This is how you turn 'every contributor's Claude knows
> our conventions' from a wish into a guarantee."

Have them try:

```
/showcase-tour:explain claude-md-and-rules
```

Or, if they want to see the actual files:

```
/showcase-tour:inspect CLAUDE.md
```

After: point out (a) the repo's own `CLAUDE.md` is short and points
at `.claude/rules/` for depth, (b) the rules are loaded only when
Claude reads files matching their `paths:` glob, keeping context
lean. Reference: `CLAUDE.md` and `.claude/rules/`.

### M. Wrap (always)

End with three or four short lines.

**Standard / quick / deep mode:**

> "That's the showcase. A few ways to keep learning:
>  - **Concept by concept** → `/showcase-tour:explain` lists 13
>    lessons; pick any (start with `skills` if you're brand-new).
>    The last one (`claude-md-and-rules`) ties everything together
>    — repo-scoped policy plus topic rules.
>  - **Read the actual code** → `/showcase-tour:inspect <file>`
>    walks through any file in the repo with annotations. Try
>    `/showcase-tour:inspect plugins/linkedin-post` for the
>    most-complex plugin, or `/showcase-tour:inspect CLAUDE.md` to
>    see how this repo teaches its own house style.
>  - **Verify it all works** → `/showcase-tour:status` for the
>    health check, `docs/08-verify.md` for the full checklist.
>  - **Make it real** → the LinkedIn integration is mocked by
>    default; `docs/04-mcp-server-with-auth.md` has the credential
>    setup."

If you ran in **deep mode**, also offer:

> "Want me to walk through any specific source file right now? Tell
> me the path — I have read access."

**Cowork mode** — replace the wrap above with this Cowork-focused
version:

> "That's the Cowork track. To make this concrete for your team:
>  - **Deploy the MCP server** → `cd plugins/linkedin-post/mcp-server`,
>    then either `npm run start:http` locally for testing, or follow
>    `cloudflare/README.md` for a Cloudflare Workers deploy. Once
>    it's reachable over HTTPS, register it in Cowork via Settings
>    → Connectors → Add custom connector.
>  - **Pick a distribution path** for the skills → either submit
>    `linkedin-post` to `claude.com/plugins`, or paste the
>    orchestrator body into a Cowork Project's custom instructions
>    for one-off use.
>  - **For org-wide rollout** → `docs/06-claude-team-connectors.md`
>    explains the admin Connector path; that's identical between
>    Claude Code and Cowork.
>  - **Read the gap details** → `docs/07-using-with-cowork.md` is
>    the full Cowork track with a deploy guide and OAuth note for
>    production."
