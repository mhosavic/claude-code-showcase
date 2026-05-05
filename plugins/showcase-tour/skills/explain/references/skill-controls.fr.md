# Concept : skill-controls

## What

L'ensemble de champs d'en-tête (frontmatter) qui régissent le
**comportement d'un skill, qui peut l'invoquer, et quels outils il peut
utiliser sans demander la permission** :

| Champ | Ce qu'il fait |
|---|---|
| `disable-model-invocation: true` | Skill réservé à l'utilisateur — Claude ne peut pas le choisir automatiquement. |
| `user-invocable: false` | Skill réservé à Claude — caché du menu `/`. |
| `allowed-tools: <list>` | Pré-approuve les outils nommés pour ce skill (pas d'invite de permission). |
| `argument-hint: <text>` | Indication d'autocomplétion affichée après la commande slash. |
| `model: sonnet|opus|haiku` | Remplace le modèle pour le tour de ce skill. |
| `effort: low|medium|high|xhigh|max` | Remplace l'effort de raisonnement pour ce skill. |

Ensemble, c'est comme ça que tu exprimes précisément « **ce skill est
pour les situations X, devrait être invoqué par Y, et peut utiliser Z** ».

## Mental model

L'en-tête (frontmatter), c'est le **contrat** entre le skill et le reste
du système. Le corps dit quoi faire ; l'en-tête dit dans quelles
conditions ça peut s'exécuter.

La plupart des skills n'ont besoin que de `name`, `description`, et
peut-être `argument-hint`. Les champs de contrôle entrent en jeu dès
qu'un skill a des *effets de bord* (déploiements, publications, envois
de messages) ou a besoin d'*outils spécifiques* (Bash, MCP, Edit).

## Concrete example from this showcase

`plugins/linkedin-post/skills/post/SKILL.md` :

```yaml
---
name: post
description: Orchestrate a complete LinkedIn post...
disable-model-invocation: true
allowed-tools: mcp__linkedin-post__post_linkedin_draft
---
```

Trois choix délibérés :

1. **`disable-model-invocation: true`** — ce skill *publie sur LinkedIn*.
   Tu ne veux pas que Claude décide de l'appeler parce que quelque chose
   a l'air prêt. Seul l'utilisateur peut le déclencher.
2. **`allowed-tools: mcp__linkedin-post__post_linkedin_draft`** — ce
   skill a besoin d'exactement un outil. Le pré-approuver fait que
   l'utilisateur ne reçoit pas d'invite de permission en plein milieu
   du flux.
3. **Pas de `mcp__linkedin-post__generate_image` dans `allowed-tools`** —
   cet orchestrateur sert à *publier*. La génération d'images appartient
   à un skill différent (`generate-post-image`). Le scoping par skill
   fait respecter ça.

À comparer avec `plugins/linkedin-post/skills/interview-for-post/SKILL.md` :

```yaml
---
name: interview
description: Interview the user...
argument-hint: <optional brief from the user>
---
```

Pas de `disable-model-invocation` (Claude peut le prendre si
l'utilisateur dit « help me write a linkedin post »). Pas de
`allowed-tools` (c'est une invite pure, pas besoin d'outils).

## The control matrix

| Frontmatter | L'utilisateur invoque ? | Claude invoque ? | Quand chargé dans le contexte |
|---|---|---|---|
| (par défaut) | Oui | Oui | Description toujours ; skill complet à l'invocation. |
| `disable-model-invocation: true` | Oui | Non | Description PAS chargée ; skill complet se charge quand TU l'invoques. |
| `user-invocable: false` | Non | Oui | Description toujours ; skill complet à l'auto-invocation. |

Donc `disable-model-invocation: true` est aussi une **optimisation de
contexte** — la description du skill ne prend pas de place quand seul
l'utilisateur peut le déclencher de toute façon.

## When to use what

- **A des effets de bord** (déploiement, publication, envoi, écriture en
  BD) → `disable-model-invocation: true`.
- **Invite pure sans outils** → pas besoin de `allowed-tools`.
- **Appelle un outil MCP spécifique** → `allowed-tools: mcp__server__tool`.
- **Appelle Bash pour un patron de commande fixe** →
  `allowed-tools: Bash(git diff *)`.
- **Tâche de raisonnement lourd** → `model: opus` et/ou `effort: high`.

## `allowed-tools` syntax

Pareil aux règles de permission ailleurs :

```yaml
allowed-tools: Read, Grep, Glob, Bash(git status *), mcp__github__*
```

`mcp__server__*` correspond à n'importe quel outil de ce serveur.
`Bash(prefix *)` correspond à n'importe quelle commande qui débute par
ce préfixe.

## Try this

1. Lance `/showcase-tour:inspect plugins/linkedin-post/skills/post/SKILL.md`
   pour voir comment ces champs se combinent dans un vrai orchestrateur.
2. Compare avec `/showcase-tour:inspect plugins/linkedin-post/skills/interview-for-post/SKILL.md`
   pour voir les mêmes champs utilisés différemment dans un skill
   d'invite pure.
3. Ensuite, lance `/showcase-tour:explain subagents` si tu veux des
   contextes isolés, ou `/showcase-tour:explain hooks` pour de
   l'application déterministe.
