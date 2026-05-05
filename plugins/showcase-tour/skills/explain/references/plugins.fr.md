# Concept : plugins

## What

Un plugin est un répertoire qui regroupe des extensions Claude Code reliées —
skills, agents, hooks, serveurs MCP, serveurs LSP — en une seule unité
installable avec un manifeste à `.claude-plugin/plugin.json`.

## Mental model

Un skill, c'est une chanson. Un plugin, c'est l'**album** : une collection
soignée qui se livre, se versionne et se met à jour ensemble. Dès que tu as
plus d'un skill relié, ou un skill plus un hook, ou n'importe quoi qui
nécessite de la configuration, tu sors le plugin.

Le compromis face aux skills autonomes (dans `~/.claude/skills/` ou
`.claude/skills/`) : les plugins obtiennent du **versionnage**, des **mises à
jour automatiques depuis un marketplace**, et des **slash commands avec espace
de noms** (`/<plugin>:<skill>`) qui empêchent les collisions. Les skills
autonomes ont des noms plus courts mais perdent ces choses-là.

## Concrete example from this showcase

`plugins/linkedin-post/.claude-plugin/plugin.json` :

```json
{
  "name": "linkedin-post",
  "version": "0.1.0",
  "description": "Orchestrated LinkedIn post workflow...",
  "author": { "name": "mhosavic" },
  "license": "MIT",

  "userConfig": {
    "MOCK_MODE": {
      "type": "boolean",
      "title": "Mock mode",
      "default": true
    },
    "OPENAI_API_KEY": {
      "type": "string",
      "title": "OpenAI API key",
      "sensitive": true
    },
    "LINKEDIN_ACCESS_TOKEN": { ..., "sensitive": true }
  },

  "mcpServers": {
    "linkedin-post": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/server.js"],
      "env": {
        "MOCK_MODE": "${user_config.MOCK_MODE}",
        "OPENAI_API_KEY": "${user_config.OPENAI_API_KEY}",
        ...
      }
    }
  }
}
```

Deux patrons à remarquer ici :

1. **`userConfig`** — quand le plugin est installé, Claude Code demande à
   l'utilisateur ces valeurs. Les sensibles vont dans le trousseau du système ;
   les non-sensibles vont dans `settings.json`. L'auteur du plugin obtient une
   collecte sécuritaire d'identifiants sans avoir à écrire d'interface.
2. **Interpolation `${user_config.X}`** — ces valeurs collectées sont injectées
   dans le `env` du serveur MCP (ou les commandes de hook, ou les configs LSP).
   Le code du plugin ne voit jamais le trousseau — Claude Code déverrouille et
   transmet par tube.

## When to use vs alternatives

| Utilise un plugin quand… | Utilise un skill autonome (`.claude/skills/`) quand… |
|---|---|
| Tu veux partager avec une équipe. | Le skill est spécifique au projet ou expérimental. |
| Tu dois regrouper plusieurs morceaux reliés. | Un seul skill suffit. |
| Tu veux des versions livrées. | Tu itères vite et tu te fous des versions. |
| Tu as besoin d'inviter à fournir des identifiants. | Aucun secret nécessaire. |
| Les slash commands avec espace de noms te conviennent. | Tu veux une slash command courte. |

Le cycle de vie typique : prototyper en `~/.claude/skills/foo/SKILL.md` →
quand c'est stable, copier vers `<plugin>/skills/foo/SKILL.md` et ajouter un
`plugin.json` → pousser vers un marketplace.

## Plugin directory structure

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json           ← manifest (only required file)
├── README.md                 ← human docs
├── skills/<name>/SKILL.md    ← skills
├── agents/<name>.md          ← subagents
├── hooks/hooks.json          ← hook configs
├── .mcp.json                 ← MCP servers (or inline in plugin.json)
└── scripts/                  ← hook scripts, MCP server bin, etc.
```

Seul `.claude-plugin/plugin.json` est strictement requis. Tout le reste est
optionnel — et Claude Code les découvre automatiquement aux chemins par défaut.

## Try this

1. Lance `/showcase-tour:inspect plugins/linkedin-post/.claude-plugin/plugin.json`
   pour lire ce manifeste en détail avec des annotations.
2. Ensuite, lance `/showcase-tour:explain marketplaces` pour apprendre comment
   les plugins se distribuent réellement.
