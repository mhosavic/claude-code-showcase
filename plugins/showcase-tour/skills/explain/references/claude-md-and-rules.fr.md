# Concept : claude-md-and-rules

## What

`CLAUDE.md` est un fichier markdown à la racine du dépôt (ou dans
`~/.claude/`, `<repo>/.claude/`, ou n'importe où en remontant l'arbre)
qui est automatiquement chargé dans le contexte de Claude chaque fois
qu'il travaille dans cette portée. Le répertoire `.claude/rules/` est
l'emplacement conventionnel pour les directives plus longues et
spécifiques à un sujet, référencées par — mais pas dupliquées dans —
`CLAUDE.md`.

Ensemble, ils forment le « style de la maison » du projet : des
instructions durables qu'on ne devrait pas avoir à répéter à chaque
conversation.

## Mental model

`CLAUDE.md` est à un projet Claude Code ce qu'un `CONTRIBUTING.md` est à
un projet open-source géré par des humains. Il dit au prochain
contributeur (qui est parfois ton toi futur, parfois Claude) : « voici
comment on fait les choses ici. » Contrairement à `CONTRIBUTING.md`,
Claude le lit vraiment à chaque fois — donc tu peux compter qu'il sera
suivi.

Le dossier rules est la **bibliographie référencée**. Garde `CLAUDE.md`
court et lisible ; pousse le contenu pratique en profondeur dans des
fichiers de règles qui ne se chargent que quand ils sont pertinents.

Hiérarchie d'autorité (la plus haute en premier) :

1. Le message explicite de l'utilisateur dans le tour courant.
2. Les fichiers `CLAUDE.md` (la portée la plus proche gagne — le dépôt
   l'emporte sur le global utilisateur).
3. Les skills, plugins, serveurs MCP — ils décrivent *comment* faire des
   tâches précises, mais ne supplantent pas la politique du dépôt.
4. L'entraînement par défaut de Claude.

Autrement dit, `CLAUDE.md` n'est pas une suggestion molle — c'est la
deuxième voix la plus autoritaire dans la pièce.

## Concrete example from this showcase

Le `CLAUDE.md` du showcase lui-même :

```markdown
## House rules — code

1. **Do not change a plugin's `version` without a reason.** The number is
   how downstream users decide whether to update. Bumping it casually
   churns everyone's settings.
2. **Mock-mode is the default.** `linkedin-post`'s MCP server defaults to
   `MOCK_MODE=true`. Never remove the mock branch when adding a real-mode
   path — the mock is what makes this repo demoable without credentials.
...
```

Et les règles qu'il référence :

```
.claude/rules/
├── skill-writing.md       — frontmatter checklist + tone for SKILL.md
├── mcp-server.md          — how to add an MCP tool, naming, mock mode
└── concept-references.md  — the strict template every concept follows
```

`CLAUDE.md` liste les *règles*. Le *comment* vit dans les fichiers de
règles. Les conversations qui ne touchent pas au code du serveur MCP
n'ont pas besoin de charger `mcp-server.md` — ce qui garde le contexte
mince.

## When to use vs alternatives

| Situation | Utilise |
|---|---|
| Politique transversale qui s'applique à *chaque* modification de ce dépôt. | `CLAUDE.md` à la racine du dépôt. |
| Approfondissement spécifique à un sujet (comment ajouter un outil, comment écrire un doc). | `.claude/rules/<sujet>.md` référencé depuis `CLAUDE.md`. |
| Préférences personnelles de l'utilisateur, tous projets confondus. | `~/.claude/CLAUDE.md`. |
| Comportement qui doit s'exécuter à chaque événement, de façon déterministe. | Un **hook** — voir `/showcase-tour:explain hooks`. |
| Connaissance propre à un seul flux de travail, pas à tout le projet. | Un **skill** — voir `/showcase-tour:explain skills`. |

`CLAUDE.md` est *consultatif* — Claude va le respecter, mais aucun code
de sortie ne l'impose. Si quelque chose doit être bloqué à 100 % (comme
une commande shell destructrice), fais-en un hook, pas une règle dans
CLAUDE.md.

## Try this

1. Ouvre le `CLAUDE.md` de ce dépôt et remarque comme il est court — il
   liste la politique et pointe vers le dossier rules pour la profondeur.
2. Lance `/showcase-tour:inspect CLAUDE.md` pour parcourir tout le
   fichier avec des annotations.
3. Ensuite `/showcase-tour:explain hooks` — pour voir la différence
   entre une application consultative (`CLAUDE.md`) et déterministe
   (les hooks).
