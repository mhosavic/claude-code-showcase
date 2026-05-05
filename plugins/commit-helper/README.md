# commit-helper

Mid-tier plugin showing three Claude Code features that `draft-email`
(simplest) and `linkedin-post` (most complex) don't:

1. **Dynamic context injection** — "bang-blocks" (an exclamation mark
   followed by a backtick-delimited command) in skill markdown that run
   a shell command before the prompt reaches Claude.
2. **Path-scoped skill activation** — a skill that only loads into context
   when Claude is reading certain file types.
3. **A PreToolUse hook** — a real safety guard that blocks irrecoverable
   git operations.

## Skills

| Skill | What it does | Demonstrates |
|---|---|---|
| `/commit-helper:commit-msg` | Writes a commit message from staged changes. | `!` injection of `git diff --cached`, recent commit style, branch name. |
| `/commit-helper:yesterday` | Summarizes git activity in the last 24 hours. | `!` injection of `git log --since`. Useful for stand-ups. |
| `/commit-helper:cleanup-imports` | Sorts and dedupes imports in TS/JS files. | `paths:` activation — only loads when working with `.ts/.tsx/.js/.jsx`. |

## Hook

`hooks/hooks.json` registers a PreToolUse hook on `Bash`. It runs
`scripts/guard-dangerous-git.sh` before every shell call and blocks three
things:

- `git push --force` to main/master
- `git reset --hard` with no ref
- `git clean -f / -fd / -fdx`

For everything else, the hook is invisible.

## File anatomy

```
commit-helper/
├── .claude-plugin/plugin.json
├── README.md
├── skills/
│   ├── commit-msg/SKILL.md            ← bang-injects git diff --cached
│   ├── yesterday-summary/SKILL.md     ← bang-injects git log --since
│   └── cleanup-imports/SKILL.md       ← paths: '**/*.ts' '**/*.tsx' …
├── hooks/
│   └── hooks.json                     ← declares the PreToolUse hook
└── scripts/
    └── guard-dangerous-git.sh         ← the hook implementation
```

## Try it

```bash
/plugin install commit-helper@claude-code-showcase

# stage something
echo '// test' >> some-file.ts && git add some-file.ts

# ask for a commit message — sees the live diff
/commit-helper:commit-msg

# ask what happened recently
/commit-helper:yesterday

# trip the hook
# (Claude won't actually execute this; the hook blocks it before it runs)
git push --force origin main
```

## How bang-injection works

Inside a `SKILL.md`, a "bang-block" (an exclamation mark immediately
followed by a backtick-delimited shell command, like the bang-prefixed
`git rev-parse --abbrev-ref HEAD` line in `commit-msg/SKILL.md`) gets
its stdout substituted in-place before Claude sees the skill body. So a
line that reads `Branch: <bang-block-around git rev-parse>` becomes
`Branch: main` by the time Claude reads it.

The shell command runs in the user's working directory. If it fails,
the output is its stderr — which is why the skills here use
`2>/dev/null || echo fallback` to handle "not a git repo" cleanly.

This is **preprocessing**, not a tool call. Claude doesn't choose to
run these — they're already done by the time the skill body is sent.
That's why it's safer than asking Claude to run `git diff` itself:
there's no agentic loop, no permission prompt, no risk of the model
interpreting "check the diff" as something else.

## How `paths:` activation works

`cleanup-imports/SKILL.md` declares:

```yaml
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.mjs"
```

Claude doesn't load this skill into context at session start. It's loaded
on-demand when Claude reads a file matching one of those globs. Effect:
- TypeScript/JS projects: skill is available when relevant.
- Python projects: skill never enters context, no token cost.

You can still invoke `/commit-helper:cleanup-imports` manually anywhere —
the path scope only affects automatic loading.

## Why this matters

The three features here are how you keep Claude Code performant on a real
team:

- **Bang-injection** lets you give Claude live data without an agentic
  loop per skill. Cheap, deterministic, fast.
- **`paths:` scoping** keeps your context window lean. If your team has 30
  internal skills, you don't want all of them loaded for every conversation.
- **Hooks** are how you turn "soft preferences" (CLAUDE.md, descriptions)
  into "hard guarantees" (the action does/doesn't happen).
