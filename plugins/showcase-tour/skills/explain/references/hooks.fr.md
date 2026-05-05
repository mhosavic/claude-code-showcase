# Concept : hooks

## What

Les hooks sont des commandes shell (ou des appels HTTP, ou des
invocations d'outils MCP) que Claude Code exécute automatiquement à des
événements de cycle de vie — **avant qu'un outil s'exécute, après qu'un
outil s'exécute, quand une session démarre, quand Claude finit de
répondre**, etc. Le code de sortie du script de hook contrôle si
l'événement procède.

## Mental model

CLAUDE.md dit « *s'il te plaît, ne fais pas X* » — Claude obéit
généralement.
Les hooks disent « **X ne peut pas arriver** » — Claude n'a pas le
choix.

C'est la ligne entre **préférence molle** (instructions en markdown) et
**garantie dure** (un script qui sort avec le code 2). Les hooks, c'est
comment tu transformes la première en la seconde.

## Concrete example from this showcase

`plugins/commit-helper/hooks/hooks.json` :

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/guard-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

Ça enregistre un hook qui s'exécute **avant chaque commande Bash** que
Claude tente d'exécuter. Le script de hook
(`plugins/commit-helper/scripts/guard-dangerous-git.sh`) lit la
commande proposée depuis stdin, vérifie trois patrons dangereux
(`git push --force` vers main, `git reset --hard` nu, `git clean -fd`),
et sort avec le code 2 pour les **bloquer**. Pour tout le reste, il sort
avec 0 silencieusement.

Quand l'utilisateur dit « force-push my branch to main », Claude veut
exécuter `git push --force origin main` — le hook intercepte, bloque, et
Claude voit la raison du blocage. L'appel shell n'arrive jamais.

## The lifecycle events

| Événement | Quand il se déclenche | Peut bloquer ? |
|---|---|---|
| `SessionStart` | La session débute ou reprend. | Non. Sert à injecter du contexte. |
| `UserPromptSubmit` | L'utilisateur envoie un message. | Oui. |
| `PreToolUse` | Avant un appel d'outil. | Oui. |
| `PostToolUse` | Après qu'un appel d'outil réussit. | Non, mais ajoute du contexte. |
| `PostToolUseFailure` | Après qu'un appel d'outil échoue. | Non, mais ajoute du contexte. |
| `Stop` | Claude finit de répondre. | Oui (force la continuation). |
| `Notification` | Claude Code affiche une notification. | Non. |
| `SubagentStart` / `SubagentStop` | Cycle de vie du sous-agent. | Non. |
| `PreCompact` / `PostCompact` | Autour de la compaction du contexte. | Non. |
| `FileChanged` | Un fichier surveillé change sur le disque. | Non. |
| `SessionEnd` | La session se termine. | Non. |

(Plus une douzaine d'autres — voir la doc officielle pour la liste
complète.)

## Exit codes are the contract

- **0** — procéder silencieusement.
- **2** — BLOQUER avec le message stderr renvoyé à Claude.
- **Autre non-zéro** — erreur non-bloquante, montrée à l'utilisateur.

La simplicité, c'est la fonctionnalité. N'importe quel langage capable
de lire stdin et de sortir avec un code peut être un hook.

## When to use vs alternatives

| Utilise un hook quand… | Pas quand… |
|---|---|
| Tu as besoin qu'une action arrive *toujours* (ou jamais). | Un skill ou une instruction CLAUDE.md suffit. |
| La vérification est rapide (<500ms). | Les vérifications lentes dégradent chaque session — déplace-les en CI. |
| Tu veux le même comportement à travers toutes tes sessions/projets. | La vérification est spécifique au projet — utilise plutôt une règle au niveau du projet. |

Hooks vs alternatives :

- **vs CLAUDE.md** — CLAUDE.md est chargé dans le contexte ; le modèle
  décide s'il le suit. Les hooks sont déterministes.
- **vs liste noire `allowed-tools`** — refuser un outil est une
  restriction de *capacité*. Les hooks te laissent permettre l'outil
  mais bloquer des *usages* spécifiques (ex : permettre `Bash` mais
  bloquer `rm -rf`).
- **vs sandbox** — le sandboxing est de l'isolation au niveau OS
  (système de fichiers et réseau). Les hooks sont de la logique de
  vérification par événement. Utilise les deux pour de la défense en
  profondeur.

## Where hooks live

| Emplacement | Portée |
|---|---|
| Champ `hooks` dans `~/.claude/settings.json` | Personnel, tous les projets. |
| Champ `hooks` dans `<repo>/.claude/settings.json` | Projet, partagé via git. |
| `<plugin>/hooks/hooks.json` | Livré avec un plugin. |
| Paramètres gérés par serveur (admin) | À l'échelle de l'organisation, ne peut pas être surchargé. |

Le showcase livre un hook au niveau plugin — facile à installer, facile
à désinstaller, suit le cycle de vie du marketplace.

## Try this

1. Lance `/showcase-tour:inspect plugins/commit-helper/scripts/guard-dangerous-git.sh`
   pour lire le vrai script de hook (~50 lignes, parcourt trois patrons
   de cas).
2. Ensuite, essaie de faire faire un force-push vers main par Claude.
   Regarde le hook se déclencher.
3. Ensuite, lance `/showcase-tour:explain mcp` pour apprendre comment
   les outils externes s'intègrent.
