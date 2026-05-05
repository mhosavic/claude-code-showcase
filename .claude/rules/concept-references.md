# Concept-reference rule

How to add or edit a concept lesson under
`plugins/showcase-tour/skills/explain/references/`. Loaded by
`CLAUDE.md`; applies whenever you touch a file in that directory.

## The template — non-negotiable

Every concept file follows the same five-section template. Do not
reorder, rename, or skip sections. The dispatcher in
`skills/explain/SKILL.md` and the tour both depend on this shape.

```markdown
# Concept: <name>

## What

One- or two-sentence definition. Written for someone who has never seen
the concept. No jargon without unpacking.

## Mental model

The analogy or framing that makes it click. One paragraph. The goal is
to give the reader a *handle* — something they can carry into other
contexts.

## Concrete example from this showcase

A specific file path. A real code snippet (5-15 lines). What that
snippet demonstrates about the concept. Cross-reference any related
concept by name.

## When to use vs alternatives

A short table or list contrasting this concept with the closest
alternatives. Clarifies the trade-off, not just the definition.

## Try this

One or two specific commands the reader can run right now to see this
concept in action. Each command should be copy-pasteable.
```

## Length

~400-700 words. Short enough to read in five minutes, long enough to
have substance. If you're going past 700, the concept is probably two
concepts — split it.

## Tone

- Conversational but tight. Aim for "the smartest colleague explaining
  over coffee."
- One idea per paragraph.
- Use second person ("you") for instructions, third person for
  definitions.
- No emoji.

## When to add a new concept

Add a new reference file when:

- A new Claude Code primitive has shipped (e.g., resource templates).
- An existing concept has accumulated enough sub-concepts that it
  deserves its own page.
- Users repeatedly ask the same question that no current concept
  answers.

Do *not* add a concept just because a feature was added — many features
fit inside an existing concept (e.g., a new MCP transport doesn't need
a new concept; it goes inside `mcp.md`).

## Wiring a new concept in

After creating `references/<concept>.md`:

1. **Update `skills/explain/SKILL.md`** — add a row to the catalog
   table with the one-line definition, increment the count in the
   description if needed, add the concept to the curriculum-order list
   at the bottom.
2. **Update `plugins/showcase-tour/README.md`** — add a numbered entry
   in the concept catalog section.
3. **Update the top-level `README.md`** — only if you're adding the
   *first* example of a major category. Don't update for each new
   concept.
4. **Update `skills/tour/SKILL.md`** — only if the new concept warrants
   a section in the tour. Most new concepts don't; the tour stays
   stable.

## Good vs bad concept examples

**Good:** `dynamic-injection.md`. Definition in two sentences, the
mental model is "string-replacement before Claude even sees the
prompt," the example points at `commit-helper`'s `commit-msg` SKILL.md,
the comparison contrasts with letting Claude run the command itself.

**Bad** (hypothetical): A "skills-best-practices.md" that catalogues
every recommendation. Reason: not a concept, it's a checklist. That
content belongs in `.claude/rules/skill-writing.md`.

## Cross-referencing other concepts

Use the form: `/showcase-tour:explain <name>`. Don't link with
`<a href="...">` — concept files render in many contexts (terminal,
GitHub, IDE preview).

## Verifying

After editing:

1. `/showcase-tour:explain` (no args) — confirm the catalog table
   reflects your changes.
2. `/showcase-tour:explain <new-concept>` — confirm the lesson loads
   end-to-end and the "Try this" commands actually work.
