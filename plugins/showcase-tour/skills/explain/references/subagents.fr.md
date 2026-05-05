# Concept : subagents

## What

Un sous-agent est un travailleur IA spécialisé qui s'exécute dans **sa
propre fenêtre de contexte** avec une invite système ciblée et
(optionnellement) un ensemble d'outils restreint. La conversation
principale lui délègue une tâche autonome ; il travaille
indépendamment ; seul le résumé revient.

## Mental model

Un sous-agent, c'est comme **confier un mandat de recherche à un
collègue**. Tu lui dis ce dont tu as besoin ; il s'en va faire les
lectures ; il revient avec un résumé d'une page. Les piles d'articles
qu'il a consultés n'encombrent jamais ton bureau.

C'est l'inverse des skills. Les skills s'exécutent **en ligne** dans ta
conversation principale. Les sous-agents s'exécutent **à part** dans
leur propre fenêtre.

## Concrete example from this showcase

`plugins/linkedin-post/agents/post-coordinator.md` :

```yaml
---
name: post-coordinator
description: Use to run an end-to-end LinkedIn post workflow in an isolated
              context (interview → draft → image → push to LinkedIn). Invoke
              when the user wants to delegate the whole flow rather than steer
              it themselves.
tools: Read, Grep, Glob, Bash
model: sonnet
color: blue
---

You coordinate a complete LinkedIn post creation workflow. You run in
your own context window — the user's main conversation stays clean.
...
```

Deux façons de l'invoquer :

```text
Use the post-coordinator subagent to make a LinkedIn post about our launch.
@post-coordinator make a linkedin post about our launch
```

Le sous-agent :
1. Exécute les mêmes skills `/linkedin-post:*` que tu pourrais exécuter
   toi-même.
2. Pose à l'utilisateur des questions de clarification et attend les
   réponses (ces échanges se passent dans la fenêtre du sous-agent).
3. Rapporte le résultat final — texte, URL d'image, URN du brouillon —
   à ta conversation principale sous forme de résumé.

## When to use a subagent vs alternatives

| Utilise un sous-agent quand… | Utilise le fil principal (skills) quand… |
|---|---|
| Le travail produit beaucoup d'extrants intermédiaires dont tu n'as pas besoin à long terme. | Tu veux que chaque étape soit visible et pilotable. |
| Tu fais rouler plusieurs choses en parallèle (chaque sous-agent a sa propre fenêtre). | Le travail est une seule action rapide. |
| La tâche a besoin d'une *invite système* différente (réviseur sécurité, éditeur de code, personnalité de data scientist). | Tu es à l'aise avec le comportement par défaut de Claude Code. |
| Tu veux des restrictions strictes sur les outils (ex : lecture seule). | Le `allowed-tools` du skill suffit. |

Sous-agent vs skill, en une phrase : **même conversation = skill ;
conversation séparée = sous-agent.**

## Built-in vs custom subagents

Claude Code livre des sous-agents intégrés que tu n'as pas à définir :

- **Explore** — recherche rapide en lecture seule dans le code (modèle
  Haiku).
- **Plan** — mode de recherche pour les flux planifier-avant-coder.
- **general-purpose** — tâches générales à plusieurs étapes.
- **statusline-setup**, **Claude Code Guide** — petits utilitaires
  ciblés.

Les sous-agents personnalisés vivent dans `.claude/agents/<name>.md`
(projet) ou `~/.claude/agents/` (personnel) ou
`<plugin>/agents/<name>.md` (plugin). Le `post-coordinator` ci-dessus
est un sous-agent de plugin.

## Frontmatter cheat sheet

| Champ | Effet |
|---|---|
| `name` | Requis. Le nom slash et le nom de mention `@`. |
| `description` | Requis. Ce que Claude lit pour décider quand déléguer. |
| `tools` | Liste blanche (ex : `Read, Grep, Glob`). Hérite de tout si omis. |
| `disallowedTools` | Liste noire appliquée en premier, puis `tools` se résout sur le reste. |
| `model` | `sonnet` / `opus` / `haiku` / `inherit`. |
| `permissionMode` | `default`, `plan`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`. |
| `memory` | `user` / `project` / `local` pour l'apprentissage entre sessions. |
| `isolation: worktree` | S'exécute dans un git worktree temporaire (checkout isolé). |
| `background: true` | S'exécute en parallèle de la conversation principale. |

## Subagents can't spawn subagents

Les sous-agents sont **à un seul niveau de profondeur**. Si tu as besoin
de délégation imbriquée, utilise des skills à l'intérieur d'un
sous-agent, ou enchaîne des sous-agents depuis la conversation
principale.

## Try this

1. Lance `/showcase-tour:inspect plugins/linkedin-post/agents/post-coordinator.md`
   pour lire la définition complète de ce sous-agent.
2. Ensuite, essaie de l'invoquer : `Use the post-coordinator subagent to
   draft a LinkedIn post about <topic>`. Observe comment les
   allers-retours se déroulent dans un panneau séparé sous ton invite.
3. Ensuite, lance `/showcase-tour:explain hooks` pour la contrepartie
   déterministe des skills/sous-agents.
