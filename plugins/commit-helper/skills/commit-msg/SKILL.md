---
name: commit-msg
description: Write a clean, focused commit message from the currently staged changes. Use when the user asks for a commit message, has staged changes ready, or runs git status and there are unstaged or staged files.
disable-model-invocation: true
allowed-tools: Bash(git status *), Bash(git diff *), Bash(git log *), Bash(git rev-parse *)
---

# Write commit message

This skill demonstrates **dynamic context injection**: the `` !`cmd` `` blocks
below run BEFORE the prompt reaches Claude. The output replaces the placeholder,
so Claude sees actual diffs, not "go look at the diff."

## Repo state

- **Branch:** !`git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "not a git repo"`
- **Staged file count:** !`git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' '`
- **Unstaged file count:** !`git diff --name-only 2>/dev/null | wc -l | tr -d ' '`

## Recent commit style (last 10)

```
!`git log --oneline -10 2>/dev/null || echo "no commit history yet"`
```

## What's actually staged

```
!`git diff --cached --stat 2>/dev/null || echo "nothing staged"`
```

```
!`git diff --cached 2>/dev/null | head -300 || echo "nothing staged"`
```

(Diff above is truncated to ~300 lines. If the staged change is larger, ask
the user before writing — large commits usually need to be split.)

## Your task

1. **If "Staged file count" is 0:** tell the user there's nothing staged
   and stop. Don't invent a commit message.

2. **Match the existing style.** Read the last 10 commits above. If they're
   imperative ("Add X", "Fix Y", "Refactor Z"), match that. If they use
   conventional commits (`feat:`, `fix:`, `chore:`), match that. If they're
   sentence-style with periods, match that.

3. **Lead with the why, not the what.** A good commit message answers
   *"why was this change needed"*, not *"what bytes changed."* The diff
   above already shows the what.

4. **Format:**
   - **Subject line:** under 72 characters, imperative mood, no period.
   - **Optional body:** blank line, then 1–3 short paragraphs wrapped at
     ~80 chars. Skip the body for trivial changes (typo fixes, single-line
     bumps).
   - **No "Generated with Claude Code" footer** unless the user's recent
     commits have one.

5. **Output the message ready to paste:**

   ````
   ```
   <subject line>

   <body, if needed>
   ```
   ````

   Then offer to run `git commit -m "..."` if the user wants. Don't run it
   without asking.

## What NOT to do

- Don't summarize line-by-line. The diff is for the reader of the commit;
  the message is the why.
- Don't invent context that isn't in the diff. If the diff is "rename `foo`
  to `bar`", say "Rename foo to bar"; don't claim it's "Refactor for
  clarity" without evidence.
- If the staged change crosses 3+ unrelated concerns, flag it: suggest the
  user `git reset` and stage the changes in smaller commits. Don't write
  one commit message that papers over three things.
