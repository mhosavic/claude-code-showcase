---
name: cleanup-imports
description: Sort and dedupe import statements in TypeScript / JavaScript files. Use when the user asks to clean up imports, organize imports, or after a refactor that left imports in random order.
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.mjs"
---

# Cleanup imports

**Language.** Respond in the language the user is using (English /
Français). Code, identifiers, and import paths stay verbatim.

This skill demonstrates **path-scoped activation** — the `paths:` frontmatter
above means Claude only loads this skill into context when reading files
matching one of those globs. If you're working in a Python repo, this skill
is invisible. That keeps context usage low when you have many path-scoped
skills.

## What to do

For each `.ts/.tsx/.js/.jsx/.mjs` file the user mentions:

1. Read the file.
2. **Sort imports** in this order, with a blank line between groups:
   - **Node built-ins** (`node:fs`, `node:path`, etc.)
   - **External packages** (anything not starting with `.` or `node:`)
   - **Internal absolute imports** (`@/lib/foo`, `~/utils/bar`)
   - **Relative imports** (`./foo`, `../bar`)
3. Within each group, sort alphabetically by module name.
4. **Dedupe**: if the same module is imported twice, merge them. If a
   default import and named imports come from the same module, keep them
   on one line: `import Foo, { bar, baz } from 'foo'`.
5. **Drop unused imports** ONLY if you're confident they're unused. If
   there's any chance the import is used in a side-effect (e.g. CSS
   imports, polyfills, decorator metadata), keep it.

## Things to watch for

- **Side-effect imports** — `import './styles.css'` or
  `import 'reflect-metadata'` are NOT unused even if no symbol is
  referenced. Keep them in their original group/position.
- **Type-only imports** — TypeScript's `import type { Foo }` should stay
  as `import type` (don't merge with value imports of the same module).
- **Re-exports** — `export { foo } from 'bar'` are not imports. Don't move
  them.

## When NOT to apply this

If the file uses a custom import order (e.g. enforced by an `eslintrc` with
`import/order` configured differently), match the file's actual order
instead of the default above. Read the linter config first if there is one.

## Output

Show a unified diff of the change:

```diff
- import { foo } from 'bar';
- import './styles.css';
- import { baz } from 'bar';
+ import './styles.css';
+
+ import { baz, foo } from 'bar';
```

Then ask the user to approve before applying.
