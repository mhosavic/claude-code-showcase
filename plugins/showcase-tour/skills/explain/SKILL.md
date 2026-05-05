---
name: explain
description: Concept curriculum for the claude-code-showcase. Pass a concept name (skills, plugins, mcp, hooks, subagents, scopes, dynamic-injection, path-scoping, skill-controls, marketplaces, mcp-tools, mcp-prompts-resources) and get a focused ~5-minute lesson grounded in this repo's actual code. With no args, lists all 12 concepts with one-line definitions — usable as a glossary. Use as a follow-up to /showcase-tour:tour to dig into one concept thoroughly.
disable-model-invocation: true
argument-hint: [concept-name | empty for catalog]
allowed-tools: Read, Glob
---

# Explain a Claude Code concept

The user invoked `/showcase-tour:explain $ARGUMENTS`. They want either a
**glossary** (no args) or a **focused lesson** on one concept.

## Concept catalog

| # | Concept | One-line definition | Reference file |
|---|---|---|---|
| 1 | **skills** | A markdown prompt that becomes a slash command. The atomic unit of "save a workflow once, run it anywhere." | `references/skills.md` |
| 2 | **plugins** | The bundling unit — packages skills, agents, hooks, and MCP servers together for distribution. Includes credential prompting via `userConfig`. | `references/plugins.md` |
| 3 | **marketplaces** | A catalog of plugins published as a GitHub repo. Three distribution patterns: per-developer, per-project, server-managed. | `references/marketplaces.md` |
| 4 | **scopes** | Where skills physically live: personal (`~/.claude/skills/`), project (`<repo>/.claude/skills/`), or plugin. Each has different sharing semantics. | `references/scopes.md` |
| 5 | **dynamic-injection** | `` !`shell command` `` blocks in skill bodies. The output is inlined *before* Claude sees the prompt — live data with no agentic loop. | `references/dynamic-injection.md` |
| 6 | **path-scoping** | `paths:` frontmatter glob that lazy-loads a skill only when Claude reads matching files. Keeps context lean. | `references/path-scoping.md` |
| 7 | **skill-controls** | Per-skill frontmatter that gates behavior: `allowed-tools`, `disable-model-invocation`, `argument-hint`. The control surface for skill safety. | `references/skill-controls.md` |
| 8 | **subagents** | Isolated context workers with their own tools and system prompt. Use when you want work to happen *off the main thread*. | `references/subagents.md` |
| 9 | **hooks** | Shell commands that run on lifecycle events. Deterministic, unlike CLAUDE.md which is advisory. The way you turn "soft preferences" into "hard guarantees." | `references/hooks.md` |
| 10 | **mcp** | Model Context Protocol — the open standard for AI-tool integration. Servers expose three primitives: tools, prompts, resources. | `references/mcp.md` |
| 11 | **mcp-tools** | Functions Claude can invoke (`mcp__server__name`). Verbs that *do* things: post, fetch, query, deploy. The most common MCP primitive. | `references/mcp-tools.md` |
| 12 | **mcp-prompts-resources** | Two MCP primitives that aren't tools. Prompts → parameterized slash commands. Resources → `@`-mentionable content like style guides or schemas. | `references/mcp-prompts-resources.md` |

## How to handle the request

### Case 1: `$ARGUMENTS` is empty

Show the catalog above, then end with:

> "Which concept? Type `/showcase-tour:explain <name>` for a full lesson.
> Or `/showcase-tour:tour` if you'd rather walk through everything in
> order, or `/showcase-tour:inspect <path>` to read actual code instead
> of theory."

That's it. Don't over-explain.

### Case 2: `$ARGUMENTS` matches a concept exactly

Read the corresponding `references/<concept>.md` file and follow its
structure. Each reference file follows the same teaching template:

1. **What** — one-sentence definition
2. **Mental model** — the analogy or framing that makes it click
3. **Concrete example from this showcase** — file path + actual content
4. **When to use vs alternatives** — trade-offs against related concepts
5. **Try this** — exact next step

Walk the user through the file. Be conversational, not a markdown reader —
say "the key insight is X" rather than "Section 2 says X."

After the lesson, end with the **Try this** section's command and a
suggested *next concept* — for example, if they just learned about skills,
suggest `plugins` next.

### Case 3: `$ARGUMENTS` is close but not exact

If they typed something like `mcp tools`, `mcp-tool`, `tool`, or
`mcp_tools`, they probably mean `mcp-tools`. Treat as Case 2 with the
correct name.

If genuinely unclear (e.g. `skill stuff`), list the 2-3 closest matches
from the catalog and ask which.

## Curriculum order (for reference)

If the user asks "what should I learn first?", recommend this order — it
builds on itself:

1. **skills** → 2. **plugins** → 3. **marketplaces** (the foundation)
4. **scopes** → 5. **dynamic-injection** → 6. **path-scoping** → 7. **skill-controls** (skill ergonomics)
8. **subagents** → 9. **hooks** (advanced control)
10. **mcp** → 11. **mcp-tools** → 12. **mcp-prompts-resources** (external integration)

You don't have to drill them through this order. But if they're picking
randomly and you sense they're confused, suggest starting at **skills**
and working forward.

## What you do NOT do

- Don't dump entire reference files verbatim. Walk through them
  conversationally.
- Don't skip the "Try this" suggestion at the end — it's the bridge from
  concept to practice.
- Don't read MULTIPLE reference files in one invocation unless the user
  explicitly asked for several. Each `/showcase-tour:explain X` is one
  lesson.
