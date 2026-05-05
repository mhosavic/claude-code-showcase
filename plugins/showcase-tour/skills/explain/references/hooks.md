# Concept: hooks

## What

Hooks are shell commands (or HTTP calls, or MCP tool invocations) that
Claude Code runs automatically at lifecycle events — **before a tool
runs, after a tool runs, when a session starts, when Claude finishes
responding**, etc. The hook script's exit code controls whether the
event proceeds.

## Mental model

CLAUDE.md says "*please don't do X*" — Claude usually obeys.
Hooks say "**X cannot happen**" — Claude has no choice.

That's the line between **soft preference** (instructions in markdown)
and **hard guarantee** (a script that exits with code 2). Hooks are how
you turn the former into the latter.

## Concrete example from this showcase

`plugins/commit-helper/hooks/hooks.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/guard-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

This registers a hook that runs **before every Bash command** Claude
tries to execute. The hook script
(`plugins/commit-helper/scripts/guard-dangerous-git.sh`) reads the
proposed command from stdin, checks for three dangerous patterns
(`git push --force` to main, bare `git reset --hard`, `git clean -fd`),
and exits with code 2 to **block** them. For everything else, it exits 0
silently.

When the user says "force-push my branch to main," Claude wants to run
`git push --force origin main` — the hook intercepts, blocks, and Claude
sees the block reason. The shell call never happens.

## The lifecycle events

| Event | When it fires | Can it block? |
|---|---|---|
| `SessionStart` | Session begins or resumes. | No. Used to inject context. |
| `UserPromptSubmit` | User sends a message. | Yes. |
| `PreToolUse` | Before a tool call. | Yes. |
| `PostToolUse` | After a tool call succeeds. | No, but adds context. |
| `PostToolUseFailure` | After a tool call fails. | No, but adds context. |
| `Stop` | Claude finishes responding. | Yes (forces continuation). |
| `Notification` | Claude Code shows a notification. | No. |
| `SubagentStart` / `SubagentStop` | Subagent lifecycle. | No. |
| `PreCompact` / `PostCompact` | Around context compaction. | No. |
| `FileChanged` | Watched file changes on disk. | No. |
| `SessionEnd` | Session terminates. | No. |

(Plus a dozen more — see official docs for the full list.)

## Exit codes are the contract

- **0** — proceed silently.
- **2** — BLOCK with the stderr message fed back to Claude.
- **Other non-zero** — non-blocking error, shown to the user.

The simplicity is the feature. Any language that can read stdin and exit
with a code can be a hook.

## When to use vs alternatives

| Use a hook when… | Don't when… |
|---|---|
| You need an action to *always* happen (or never happen). | A skill or CLAUDE.md instruction is enough. |
| The check is fast (<500ms). | Slow checks degrade every session — move them to CI. |
| You want the same behavior across all your sessions/projects. | The check is project-specific — use a project-level rule instead. |

Hooks vs alternatives:

- **vs CLAUDE.md** — CLAUDE.md is loaded into context; the model decides
  whether to follow it. Hooks are deterministic.
- **vs `allowed-tools` denylist** — denying a tool is a *capability*
  restriction. Hooks let you allow the tool but block specific *uses*
  (e.g. allow `Bash` but block `rm -rf`).
- **vs sandbox** — sandboxing is OS-level isolation (filesystem and
  network). Hooks are per-event logic checks. Use both for defense in
  depth.

## Where hooks live

| Location | Scope |
|---|---|
| `~/.claude/settings.json` `hooks` field | Personal, all projects. |
| `<repo>/.claude/settings.json` `hooks` field | Project, shared via git. |
| `<plugin>/hooks/hooks.json` | Plugin-bundled. |
| Server-managed settings (admin) | Org-wide, can't be overridden. |

The showcase ships a plugin-scoped hook — easy to install, easy to
uninstall, follows the marketplace lifecycle.

## Try this

1. Run `/showcase-tour:inspect plugins/commit-helper/scripts/guard-dangerous-git.sh`
   to read the actual hook script (~50 lines, walks through three case
   patterns).
2. Then try to make Claude force-push to main. Watch the hook fire.
3. Then run `/showcase-tour:explain mcp` to learn how external tools
   integrate.
