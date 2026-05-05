# Troubleshooting

If something doesn't work the way [`08-verify.md`](08-verify.md) expects,
find the symptom below and follow the fix. Worst-case, the **debug
command** at the bottom dumps everything.

## Quick triage

```
/plugin
```

Press Tab to **Errors**. Anything broken shows up there with a reason.
9 times out of 10 the answer is in that tab.

---

## "Plugin command not recognized" / `/plugin` does nothing

You're on an old Claude Code version. Update:

```bash
# Homebrew
brew upgrade claude-code

# npm
npm install -g @anthropic-ai/claude-code@latest
```

Verify:

```bash
claude --version
# expect 2.1.x or higher
```

Restart Claude Code after updating.

---

## Marketplace won't load

Symptom: `/plugin marketplace list` doesn't show `claude-code-showcase`,
or it shows but in `error` state.

### Cause 1: typo in the GitHub path

```
/plugin marketplace remove claude-code-showcase
/plugin marketplace add mhosavic/claude-code-showcase
```

### Cause 2: GitHub auth needed (private repo)

If you forked the repo and made it private, Claude Code needs GitHub
credentials to clone it.

```bash
# For interactive use
gh auth login

# For background auto-update
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxx
```

Add the export to your shell rc file so it persists.

### Cause 3: stale marketplace clone

```
/plugin marketplace update claude-code-showcase
```

Or, nuclear option:

```bash
rm -rf ~/.claude/plugins/cache/claude-code-showcase*
```

Then `/plugin marketplace add mhosavic/claude-code-showcase` again.

---

## Plugin installed but skill not appearing

Symptom: `/plugin` shows the plugin as enabled, but `/draft-email:draft`
isn't an autocomplete option.

```
/reload-plugins
```

If still missing, restart Claude Code (`/exit` then `claude`).

If still missing, the plugin's `SKILL.md` frontmatter is probably
malformed. Run:

```
/plugin validate ~/.claude/plugins/cache/claude-code-showcase*/draft-email-*
```

Read the validation errors — usually a missing `---`, an invalid YAML
field, or a frontmatter `paths:` glob that excludes everything.

---

## MCP server not starting

Symptom: `/mcp` shows `linkedin-post` as `failed` or `pending`.

### Cause 1: Node.js not installed

```bash
node --version
```

If missing or below v20:

```bash
# macOS
brew install node

# Anywhere — nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
```

Restart Claude Code so it picks up the updated PATH.

### Cause 2: `npm install` failed during the first-session hook

Run with debug to see the actual error:

```bash
claude --debug 2>&1 | grep -A 20 -i 'plugin\|mcp\|linkedin-post'
```

Look for an error message from the SessionStart hook. Common causes:

- **Network blocked**: `npm install` couldn't reach `registry.npmjs.org`.
  Fix your proxy / firewall, then run `/reload-plugins`.
- **Permission denied** on `~/.claude/plugins/data/`: check directory
  permissions. Should be writable by your user.
- **Disk full**: `npm install` needs ~50 MB.

Manually install for the linkedin-post plugin:

```bash
cd ~/.claude/plugins/cache/claude-code-showcase*/linkedin-post-*/mcp-server
npm install --omit=dev
npm run build
```

Then `/reload-plugins`.

### Cause 3: TypeScript build failed

If the bundled `dist/` is stale or the build hook didn't fire:

```bash
cd ~/.claude/plugins/cache/claude-code-showcase*/linkedin-post-*/mcp-server
ls dist/
# expect: server.js, auth.js, tools/, prompts/, resources/

# if missing or empty:
npm run build
```

### Cause 4: User configuration not provided

The plugin prompts for `userConfig` (`MOCK_MODE`, `OPENAI_API_KEY`, etc.)
on first install. If you skipped the dialog or hit cancel:

```
/plugin
→ Installed → linkedin-post → Configure
```

Set `MOCK_MODE: true` if you just want to try the workflow without real
credentials. The MCP server won't start without at least `MOCK_MODE`.

---

## Hook never fires

Symptom: dangerous git command isn't blocked by `commit-helper`.

### Check 1: hook script is executable

```bash
ls -l ~/.claude/plugins/cache/claude-code-showcase*/commit-helper-*/scripts/guard-dangerous-git.sh
# expect: -rwxr-xr-x
```

If not executable:

```bash
chmod +x ~/.claude/plugins/cache/claude-code-showcase*/commit-helper-*/scripts/guard-dangerous-git.sh
```

(This shouldn't happen — git preserves the executable bit when cloned —
but worth checking.)

### Check 2: `jq` is installed

```bash
jq --version
```

The hook script reads JSON from stdin via `jq`. If `jq` is missing the
hook silently exits 0 (no opinion).

```bash
brew install jq        # macOS
sudo apt install jq    # Debian/Ubuntu
```

### Check 3: hook is registered

```bash
claude --debug 2>&1 | grep -i 'PreToolUse\|commit-helper'
```

Look for a line saying the hook was registered. If not, the plugin's
`hooks/hooks.json` didn't load — usually a JSON syntax error. Validate:

```bash
jq empty ~/.claude/plugins/cache/claude-code-showcase*/commit-helper-*/hooks/hooks.json
```

---

## Dynamic context injection (`!`) doesn't work

Symptom: a `commit-helper` skill outputs the literal string
`` !`git diff --cached` `` instead of the actual diff.

### Cause: skill parser issues

This is rare. Most likely you're on an older Claude Code that doesn't
support `!` blocks. Check version:

```bash
claude --version
# need 2.1.x or higher
```

If the version is current, the skill file might have a stray character
breaking the parser. Validate:

```bash
/plugin validate ~/.claude/plugins/cache/claude-code-showcase*/commit-helper-*
```

---

## "Mock mode" output when I expected real

Symptom: `post_linkedin_draft` returned `urn:li:share:mock-<id>` and you
have credentials configured.

```
/plugin
→ Installed → linkedin-post → Configure
```

Set `MOCK_MODE: false` and re-run `/reload-plugins`. The plugin's MCP
server reads env vars on startup, so a config change requires a reload.

If `MOCK_MODE` is already `false` but you still see mock output, the
env var isn't being read. Check:

```bash
claude --debug 2>&1 | grep 'mock='
```

The line should say `mock=false`. If it says `mock=true`, the userConfig
isn't being injected into the subprocess — most likely because you
clicked "skip" on the config dialog. Re-run Configure.

---

## OAuth / auth errors from real-mode LinkedIn or OpenAI

Symptom: real-mode call returns `401 Unauthorized`, `403 Forbidden`, or
`invalid_token`.

### LinkedIn

- **Token expired.** LinkedIn access tokens last 60 days. Regenerate via
  the [token generator](https://www.linkedin.com/developers/tools/oauth/token-generator).
- **Wrong scope.** The token must include `w_member_social`. Verify with:
  ```bash
  curl https://api.linkedin.com/v2/userinfo \
    -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN"
  ```
  If this 403s, your token doesn't have the right scope or your
  developer app doesn't have the "Share on LinkedIn" product enabled.
- **Wrong URN format.** Must be `urn:li:person:<id>` exactly. Not
  `urn:li:member:<id>`, not just `<id>`.

### OpenAI

- **Invalid API key.** Check it on
  [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
- **No billing.** gpt-image-1 needs an active billing setup; trial
  credits don't cover it. Check your usage tab.
- **Rate limited.** Slow down or upgrade your tier.

---

## Workspace trust warnings

When you open this repo with `claude` for the first time, you'll see
trust prompts:

1. **"Trust this workspace?"** — yes, it's your own clone.
2. **"This project wants to install N plugins"** — yes, that's the
   showcase.
3. **"Plugin includes hooks / shell commands. Allow?"** — yes, the hook
   is `commit-helper`'s git guard. The script lives at
   `plugins/commit-helper/scripts/guard-dangerous-git.sh` and is short
   enough to read in 30 seconds.
4. **"Plugin includes MCP server"** — yes, that's the linkedin-post
   server.

Decline any of these and the corresponding feature won't work, but
nothing breaks elsewhere.

---

## Last resort — full debug dump

```bash
claude --debug "test" > /tmp/claude-debug.log 2>&1
```

Then grep for the part that's broken:

```bash
grep -i -A 5 'error\|fail\|warn' /tmp/claude-debug.log | head -100
```

Or share the file with whoever's helping you. (It contains the project
path and your prompt — sensitive content stays out by default, but
double-check before sharing externally.)

---

## Still stuck?

- **Plugin issues**: open `/plugin` → Errors tab.
- **MCP issues**: `claude --debug` and look for `mcp` lines.
- **Cowork issues**: see [`07-using-with-cowork.md`](07-using-with-cowork.md);
  it lists known gaps.
- **Anthropic-side issues**: [status.claude.com](https://status.claude.com).
