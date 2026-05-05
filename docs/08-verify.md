# Verification — does everything actually work?

A copy-pasteable checklist. Run each command, check the expected output,
mark the box. If something fails, jump to
[`09-troubleshooting.md`](09-troubleshooting.md).

## Before you start

- [ ] You ran through [`prerequisites.md`](prerequisites.md) and all the
  required tools are installed.
- [ ] You either cloned this repo and opened it with Claude Code, or you
  added the marketplace via `/plugin marketplace add mhosavic/claude-code-showcase`.

---

## Step 1 — Marketplace registered

```
/plugin marketplace list
```

**Expect** to see a row like:

```
claude-code-showcase  github:mhosavic/claude-code-showcase  ok
```

- [ ] Marketplace is listed.
- [ ] Status is `ok`. If it says `error`, check
  [`09-troubleshooting.md` → "Marketplace won't load"](09-troubleshooting.md#marketplace-wont-load).

---

## Step 2 — Plugins installed

```
/plugin
```

Tab over to **Installed**. **Expect** to see:

- [ ] `draft-email@claude-code-showcase` — enabled
- [ ] `linkedin-post@claude-code-showcase` — enabled
- [ ] `commit-helper@claude-code-showcase` — enabled

If any are missing, install them:

```
/plugin install draft-email@claude-code-showcase
/plugin install linkedin-post@claude-code-showcase
/plugin install commit-helper@claude-code-showcase
/reload-plugins
```

---

## Step 3 — `draft-email` works

```
/draft-email:draft thank my mentor for last week's coffee chat
```

**Expect** Claude to produce a 100-150 word email with a Subject line, a
greeting, a 2-paragraph body, and a sign-off. It should leave bracketed
placeholders for things you didn't specify (mentor's name, your name).

- [ ] Skill invoked successfully.
- [ ] Output looks like an actual email, not "I'll help you write an email."

---

## Step 4 — `commit-helper` works (dynamic context injection)

In a git repo (this one is fine), make sure something is staged:

```bash
echo "// test" >> /tmp/test.txt
cd /tmp && git init -q && git add test.txt
```

Back in Claude Code (in the same project root):

```
/commit-helper:commit-msg
```

**Expect** Claude to write a commit message that *references the actual
content of the staged change*. If it says something generic like "Update
files", the dynamic context injection didn't work — see troubleshooting.

- [ ] The commit message references the actual staged content.

Quick way to test if `!` injection ran: read what Claude says about
"Staged file count". If it's a real number (e.g. `1`), injection worked.
If it's the literal string `` !`git diff --cached --name-only | wc -l` ``,
it didn't.

---

## Step 5 — `commit-helper` hook blocks dangerous git

Try (Claude won't actually run this; the hook intercepts):

```
Push my current branch to main with --force
```

**Expect** Claude to either:
- Decline because the hook blocked the call, with a reason.
- Or interpret your request and propose a safer alternative.

- [ ] The hook fires (you'll see it in `claude --debug` output too).

Smoke-test the hook script directly:

```bash
echo '{"tool_input":{"command":"git push --force origin main"}}' | \
  ~/.claude/plugins/cache/*/commit-helper-*/scripts/guard-dangerous-git.sh
echo "exit: $?"
```

**Expect** exit code `2` and a message like *"Blocked: force-push to
main/master."* (The path under `~/.claude/plugins/cache/` will have a
version suffix; tab-complete works.)

---

## Step 6 — `linkedin-post` MCP server is running

```
/mcp
```

**Expect** to see `linkedin-post` in the list with status `connected`.

- [ ] `linkedin-post` MCP server is connected.

If status is `failed` or `pending`, the most likely cause is:
- Node.js isn't installed → see [prerequisites](prerequisites.md).
- The first-session build hook didn't run → run `/reload-plugins`.
- See [`09-troubleshooting.md` → "MCP server not starting"](09-troubleshooting.md#mcp-server-not-starting).

---

## Step 7 — MCP tools are registered

```
What tools does the linkedin-post MCP server expose?
```

**Expect** Claude to list:

- [ ] `mcp__linkedin-post__generate_image`
- [ ] `mcp__linkedin-post__post_linkedin_draft`

---

## Step 8 — MCP prompt works

```
/mcp__linkedin-post__compose_post
```

This is an MCP-provided slash command. Claude Code will prompt you for
the `topic` and `audience` arguments. Try:

- topic: `we just shipped public beta`
- audience: `peers`

**Expect** a templated prompt to be injected, instructing Claude to write
a LinkedIn post matching the audience guidance and style requirements.
Claude then drafts the post.

- [ ] The MCP prompt slash command worked and a draft was produced.

---

## Step 9 — MCP resource works

In your prompt, type `@` and look for the style guide. It should appear
in the autocomplete menu under `team-style://linkedin/voice` (or similar
naming).

```
Read @team-style://linkedin/voice and tell me what tone to avoid.
```

**Expect** Claude to summarize the forbidden phrases, hashtag rules, etc.
from the style guide resource.

- [ ] The `@`-mention found and pulled in the resource.

---

## Step 10 — End-to-end orchestration (the big one)

```
/linkedin-post:post we just shipped public beta of our scheduling tool
```

**Expect**:

1. **Interview** — Claude asks about audience, goal, tone, image preference.
2. **Draft** — once you've answered (or skipped), it writes a ~150-word
   post and shows it to you.
3. **Image** (optional) — if you said yes to an image, the
   `generate_image` tool runs (mock mode by default) and shows a
   placeholder URL like `https://example.com/mock-image/<slug>.png`.
4. **Push** — calls `post_linkedin_draft`, returns a fake URN
   `urn:li:share:mock-<id>` with a clear note that it's mocked.

- [ ] Each of the 4 steps happened.
- [ ] The output explicitly noted "mock mode" — you should never wonder
  whether something real was posted.

---

## All boxes checked?

You're set. The showcase is fully operational on your machine. Choose your
next move:

- **Make it real** → [`04-mcp-server-with-auth.md`](04-mcp-server-with-auth.md)
  walks through getting OpenAI + LinkedIn credentials.
- **Distribute to your team** → [`03-team-distribution.md`](03-team-distribution.md).
- **Something didn't pass** → [`09-troubleshooting.md`](09-troubleshooting.md).
