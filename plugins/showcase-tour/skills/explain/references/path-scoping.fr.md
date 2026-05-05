# Concept : path-scoping

## What

Le champ `paths:` dans l'en-tête (frontmatter) d'un skill est une liste de
patrons glob. Claude **charge automatiquement le skill dans le contexte**
seulement lorsqu'il lit un fichier qui correspond à un de ces patrons. Le
skill demeure invocable manuellement, mais il reste invisible tant qu'il
n'est pas pertinent.

## Mental model

Le path-scoping, c'est un **chargement paresseux** pour les skills. Sans
ça, la description de chaque skill se charge dans le contexte du modèle
au démarrage de la session. Avec plein de skills internes, c'est du
gaspillage — la plupart ne sont pas pertinents pour une tâche donnée.

Le scoping dit : *« ne montre pas ça à Claude à moins que l'utilisateur
travaille avec des fichiers qui m'intéressent. »*

Le bénéfice côté budget de tokens devient flagrant quand ton équipe a 30
skills internes et qu'une seule conversation n'en a besoin que de 2.

## Concrete example from this showcase

`plugins/commit-helper/skills/cleanup-imports/SKILL.md` :

```yaml
---
name: cleanup-imports
description: Sort and dedupe import statements in TypeScript / JavaScript files...
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.mjs"
---
```

Quand Claude travaille dans un dépôt Python, ce skill n'entre jamais
dans le contexte. Quand Claude lit un fichier `.ts` ou `.tsx`, il se
charge automatiquement et Claude devient conscient qu'il peut nettoyer
les imports dans ce type de fichier.

Si l'utilisateur tape explicitement `/commit-helper:cleanup-imports`
dans un projet Python, ça fonctionne quand même — `paths:` n'affecte
que la découverte *automatique*.

## Glob syntax cheat sheet

| Patron | Correspond à |
|---|---|
| `**/*.ts` | Tous les fichiers `.ts` n'importe où dans l'arbre de travail. |
| `src/**/*` | Tout ce qui se trouve sous `src/`. |
| `*.md` | Les fichiers markdown à la racine du projet seulement. |
| `src/components/*.tsx` | Les fichiers TSX dans exactement ce répertoire. |
| `**/*.{ts,tsx}` | TS ou TSX, n'importe où. |

Même syntaxe que les champs `paths:` de `.claude/rules/`.

## When to use vs alternatives

| Utilise `paths:` quand… | Laisse tomber quand… |
|---|---|
| Le skill n'est pertinent que pour certains types de fichiers ou répertoires. | Le skill s'applique partout (messages de commit, courriels, etc.). |
| Ton équipe a beaucoup de skills internes et tu veux garder le contexte léger. | Tu n'as qu'une poignée de skills. |
| Le skill réfère à des conventions spécifiques à un type de fichier (imports JS, règles CSS, typage Python). | Le skill est générique. |

À comparer avec les mécanismes apparentés :

- **vs `.claude/rules/`** — Les règles utilisent la même syntaxe `paths:`
  mais ne sont *pas* invocables. C'est du contexte inerte qui se charge
  quand Claude lit des fichiers correspondants. Utilise les règles pour
  des faits du genre « voici comment on fait X dans src/api/ ». Utilise
  les skills restreints par chemin pour les *actions* que l'utilisateur
  pourrait poser sur ces fichiers. Concept au complet :
  `/showcase-tour:explain claude-md-and-rules`.
- **vs `disable-model-invocation`** — `paths:` contrôle la *découverte
  automatique*. `disable-model-invocation` contrôle si Claude peut
  *invoquer* le skill du tout. Les deux se composent : un skill peut
  être restreint par chemin ET réservé à l'utilisateur.

## Things to watch out for

- **Les globs sont vérifiés au moment de la lecture du fichier, pas au
  démarrage de la session.** Si tu as `paths: ["src/**"]` et que Claude
  ne lit jamais rien sous `src/` durant une session, le skill ne se
  charge jamais. C'est le comportement souhaité — mais ça signifie que
  pour tester ton skill, il faut réellement exercer le chemin.
- **Les skills restreints par chemin apparaissent quand même dans le
  menu d'autocomplétion `/`** quand l'utilisateur tape — l'auto-load
  n'affecte que le contexte du modèle, pas la découvrabilité côté
  utilisateur.

## Try this

1. Lance `/showcase-tour:inspect plugins/commit-helper/skills/cleanup-imports/SKILL.md`
   pour voir le skill au complet incluant le bloc `paths:`.
2. Ouvre n'importe quel fichier TypeScript dans ce dépôt et demande à
   Claude « clean up the imports here » sans nommer le skill. Il devrait
   choisir automatiquement `cleanup-imports`. (Essaie la même chose dans
   un fichier markdown — il ne devrait pas le faire.)
3. Ensuite, lance `/showcase-tour:explain skill-controls` pour le reste
   de la surface de contrôle de l'en-tête des skills.
