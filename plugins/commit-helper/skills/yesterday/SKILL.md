---
name: yesterday
description: Summarize what changed in this repo over the last 24 hours. Use when the user asks "what did I do yesterday", needs a daily standup update, or wants to recap recent work.
disable-model-invocation: true
allowed-tools: Bash(git log *), Bash(git diff *), Bash(git rev-parse *)
---

# Yesterday's summary

Live data, fetched before this prompt reaches Claude:

- **Branch:** !`git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?"`
- **Commits in last 24h:** !`git log --since="24 hours ago" --oneline 2>/dev/null | wc -l | tr -d ' '`
- **Files changed in last 24h:** !`git log --since="24 hours ago" --name-only --pretty=format: 2>/dev/null | sort -u | grep -v '^$' | wc -l | tr -d ' '`

## Commits

```
!`git log --since="24 hours ago" --pretty=format:'%h %s (%an, %ar)' 2>/dev/null || echo "no recent commits"`
```

## Diff stats

```
!`git diff --stat HEAD@{24.hours.ago} HEAD 2>/dev/null || echo "(no comparable history)"`
```

## Your task

Write a **stand-up-style summary** of what happened in the last 24 hours.

- **3–5 bullets max.** This is a status update, not a changelog.
- **Plain English, not commit hashes.** Translate `eeec624` into "hardened
  the auth flow."
- **Group by theme.** If three commits all touch the dashboard, write one
  bullet about the dashboard, not three about each commit.
- **Flag anything risky** — schema changes, new dependencies, anything that
  touched terraform or migrations.
- **End with one line on what's next** if it's obvious from the work.

## Example output

```
Yesterday on `feature/billing`:

- Wired up Stripe webhooks for subscription lifecycle events.
- Migrated org_billing table to use bigint IDs (heads-up: this needs a
  follow-up backfill in staging before prod).
- Cleaned up 200 lines of duplicated error handling in api routes.

Up next: replay the staged webhook events in dev to verify the new
handlers don't double-fire.
```

If "Commits in last 24h" is 0, just say "No commits in the last 24 hours
on this branch." Don't pad.
