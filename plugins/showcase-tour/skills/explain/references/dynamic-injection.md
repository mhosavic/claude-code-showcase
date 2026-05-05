# Concept: dynamic-injection

## What

The `` !`shell-command` `` syntax inside a skill's body. The shell command
runs **before** the skill's content reaches Claude — its output replaces
the placeholder. Claude sees real data, not "go run this command."

## Mental model

It's the skill equivalent of `f"<value: {x}>"` in Python. You're
**templating with live shell output** at the moment of invocation.

The crucial property: this is **preprocessing, not a tool call**. There's
no agentic loop, no permission prompt, no chance for the model to
reinterpret what you meant. The shell runs once, the output is there,
Claude reads.

That makes `!` injection **cheaper and more deterministic** than asking
Claude to run the same command itself via the Bash tool.

## Concrete example from this showcase

`plugins/commit-helper/skills/commit-msg/SKILL.md` opens with:

```markdown
## Repo state

- **Branch:** !`git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "not a git repo"`
- **Staged file count:** !`git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' '`

## What's actually staged

```
!`git diff --cached --stat 2>/dev/null || echo "nothing staged"`
```

```
!`git diff --cached 2>/dev/null | head -300 || echo "nothing staged"`
```
```

When the user runs `/commit-helper:commit-msg`, what Claude actually
receives is something like:

```markdown
## Repo state

- **Branch:** main
- **Staged file count:** 3

## What's actually staged

```
 src/auth.ts | 12 ++++++++++--
 src/login.ts | 4 +++-
 ...
```

```
diff --git a/src/auth.ts b/src/auth.ts
index abc..def 100644
...
```
```

Claude writes the commit message **grounded in the actual diff**. Without
`!` injection, you'd have to either paste the diff manually every time,
or ask Claude to run `git diff` itself — which is slower and adds an
opportunity for the model to do something unexpected.

## Two forms

**Inline:**

```markdown
- Current branch: !`git rev-parse --abbrev-ref HEAD`
```

**Multi-line fenced block** (use this for commands that produce
several lines):

````markdown
```!
git status --short
git diff --stat HEAD
```
````

## When to use vs alternatives

| Use `!` injection when… | Don't when… |
|---|---|
| You need live data every time the skill runs (git state, file contents, env). | The data is static — just paste it. |
| The command is fast (<1s) and deterministic. | The command is slow or might prompt for input. |
| You want Claude to react to fresh data without a tool call. | You need Claude to *decide* whether to fetch the data based on context — then use Bash. |

A common pattern: `!` injection at the top of the skill for "what's the
current state?" + skill body that tells Claude what to do with that
state. See `plugins/commit-helper/skills/yesterday-summary/SKILL.md` for
another example.

## Things to watch out for

- **Quote your `2>/dev/null`** — if the command might fail, swallow
  stderr or it leaks into the prompt and confuses Claude.
- **Cap output size** — `git diff` with no head can return tens of
  thousands of lines. Pipe through `head -N` or `wc -l` to keep skill
  size manageable.
- **Don't put secrets in `!` blocks.** The output enters the prompt; if
  you `cat .env`, those secrets go to Claude.

## Try this

1. Run `/showcase-tour:inspect plugins/commit-helper/skills/commit-msg/SKILL.md`
   to see the `!` blocks in context with the surrounding instructions.
2. Then run `/showcase-tour:explain path-scoping` for another pattern
   that makes skills perform well in real projects.
