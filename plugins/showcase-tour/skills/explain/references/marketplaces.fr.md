# Concept : marketplaces

## What

Un marketplace est un dépôt GitHub (ou une URL git, ou un répertoire local)
avec un seul fichier — `.claude-plugin/marketplace.json` — listant un ou
plusieurs plugins et où aller chercher chacun. Ajouter un marketplace
enregistre le catalogue auprès de Claude Code ; les utilisateurs installent
ensuite des plugins individuels à partir de celui-ci.

## Mental model

App Store : iPhone :: Marketplace : Claude Code.

Ajouter un marketplace, c'est **s'abonner à un éditeur**. Tu parcours ce qu'il
offre ; tu installes seulement ce que tu veux. Chaque plugin est installable,
mettable à jour et désinstallable de manière indépendante.

L'éditeur met à jour le marketplace en poussant des commits. Le Claude Code
des abonnés tire automatiquement au démarrage de la session.

## Concrete example from this showcase

Ce dépôt EST un marketplace. Le catalogue est `.claude-plugin/marketplace.json` :

```json
{
  "name": "claude-code-showcase",
  "owner": { "name": "mhosavic", "url": "https://github.com/mhosavic" },
  "metadata": { "pluginRoot": "./plugins" },
  "plugins": [
    { "name": "draft-email", "source": "draft-email", ... },
    { "name": "linkedin-post", "source": "linkedin-post", ... },
    { "name": "commit-helper", "source": "commit-helper", ... },
    { "name": "showcase-tour", "source": "showcase-tour", ... }
  ]
}
```

Le `source` de chaque plugin pointe vers un répertoire sous `./plugins/` (à
cause du raccourci `metadata.pluginRoot`). Le même champ `source` peut aussi
pointer vers un autre dépôt GitHub, une URL git, un paquet npm, ou un
sous-répertoire d'un monorepo.

## Three distribution patterns

Une fois ton marketplace sur GitHub, trois façons de l'amener dans le Claude
Code de ton équipe :

### Pattern 1 — Each developer adds it manually

```
/plugin marketplace add mhosavic/claude-code-showcase
/plugin install draft-email@claude-code-showcase
```

Fonctionne sur tous les plans. Zéro infrastructure. Faut le dire à chaque
nouvelle recrue.

### Pattern 2 — Auto-prompt via project settings

Dans chaque projet où tu veux les plugins, commit un
`.claude/settings.json` :

```json
{
  "extraKnownMarketplaces": {
    "claude-code-showcase": {
      "source": { "source": "github", "repo": "mhosavic/claude-code-showcase" }
    }
  },
  "enabledPlugins": {
    "draft-email@claude-code-showcase": true,
    "linkedin-post@claude-code-showcase": true
  }
}
```

Quand tes coéquipiers clonent le dépôt et l'ouvrent avec `claude`, ils
obtiennent une invite « faire confiance et installer ». Fonctionne sur tous
les plans. **Ce dépôt-vitrine fait exactement ça** — voir
`.claude/settings.json` à la racine.

### Pattern 3 — Server-managed settings (Team / Enterprise only)

L'admin pousse les mêmes `extraKnownMarketplaces` + `enabledPlugins` depuis
la **console admin de claude.ai → Claude Code → paramètres gérés**. Le
Claude Code de chaque membre de l'équipe les ramasse à la prochaine connexion.
Zéro configuration par développeur. Les nouvelles recrues l'ont dès le jour 1.

## When to use vs alternatives

| Tu veux… | Utilise… |
|---|---|
| Partager un skill avec un coéquipier | Envoie-lui simplement le fichier SKILL.md. |
| Partager plusieurs skills avec une équipe | Un plugin dans un marketplace. |
| Imposer l'installation à l'échelle de l'organisation | Paramètres gérés par serveur (Pattern 3). |
| Distribution publique à la communauté | Soumets au marketplace officiel d'Anthropic. |

## Try this

1. Lance `/showcase-tour:inspect .claude-plugin/marketplace.json` pour
   parcourir le catalogue de ce marketplace.
2. Ensuite, lance `/showcase-tour:explain scopes` pour comprendre où vivent
   les skills de plugin par rapport aux skills personnels et de niveau projet.
