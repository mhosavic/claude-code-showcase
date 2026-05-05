#!/usr/bin/env bash
# PreToolUse(Bash) hook — bundled with the commit-helper plugin.
#
# Catches a small set of git operations that delete work irrecoverably:
#   - git push --force / -f to main / master
#   - git reset --hard with no argument (would discard staged + unstaged)
#   - git clean -fd / -fdx (would delete untracked files)
#
# Exits 2 with a stderr message to BLOCK the call. Claude sees the message
# and can either ask the user, suggest a safer alternative, or stop.
#
# Returns 0 (no opinion) for everything else, so this hook is invisible
# during normal use.

set -euo pipefail

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')

# Bail if no command — let Claude Code handle it.
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Force push to main/master is the prototypical "destroyed shared history".
if printf '%s' "$COMMAND" | grep -qE 'git[[:space:]]+push[[:space:]]+(.*[[:space:]])?(--force|-f|--force-with-lease)([[:space:]]+|.*)?(main|master|origin/main|origin/master)\b'; then
  cat >&2 <<EOF
Blocked: force-push to main/master.
This rewrites shared history and is almost never what you want.
If you really mean it, run the command yourself in a terminal — this hook
only blocks Claude.
EOF
  exit 2
fi

# Bare 'git reset --hard' with no commit ref will discard staged + unstaged.
if printf '%s' "$COMMAND" | grep -qE '(^|[[:space:]&;|])git[[:space:]]+reset[[:space:]]+--hard[[:space:]]*$'; then
  cat >&2 <<'EOF'
Blocked: 'git reset --hard' with no ref.
This silently discards every staged and unstaged change.
If you want to discard, be explicit: 'git reset --hard HEAD' or 'git reset
--hard <commit>'. Or use 'git stash' if you might want it back.
EOF
  exit 2
fi

# Clean with -f and -d will delete untracked files / directories. We allow
# 'git clean -n' (dry run) to pass through; only the destructive forms are
# blocked.
if printf '%s' "$COMMAND" | grep -qE '(^|[[:space:]&;|])git[[:space:]]+clean[[:space:]]+(-[a-zA-Z]*[fdx][a-zA-Z]*|--force)([[:space:]]|$)'; then
  cat >&2 <<'EOF'
Blocked: 'git clean -fd' (or similar).
This deletes untracked files — including anything you forgot to 'git add',
local notes, .env files, build artifacts. Run 'git clean -n' first to
preview.
EOF
  exit 2
fi

# Anything else: no opinion.
exit 0
