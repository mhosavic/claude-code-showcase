# Concept : mcp

## What

MCP — **Model Context Protocol** — est un standard ouvert pour
connecter des agents IA à des outils et sources de données externes. Un
« serveur MCP » est tout processus qui parle le protocole ; Claude Code
est un « client MCP » qui se connecte à ces serveurs.

Un serveur peut exposer trois primitives :

| Primitive | Ce que ça devient dans Claude Code |
|---|---|
| **Outils** | Fonctions que Claude invoque (`mcp__server__tool`). |
| **Invites** | Commandes slash avec arguments (`/mcp__server__name`). |
| **Ressources** | Contenu mentionnable avec `@` et des URI. |

## Mental model

Sans MCP : Claude Code peut lire des fichiers, exécuter des commandes
shell, récupérer des pages web — c'est tout. N'importe quoi d'autre
(Slack, GitHub, ta base de données, ton API interne) demande d'écrire
une intégration personnalisée à chaque fois.

Avec MCP : ces intégrations sont **plug-and-play**. Notion publie un
serveur MCP à `https://mcp.notion.com/mcp`. Tu le connectes une fois.
Maintenant Claude Code peut chercher dans ton espace Notion, créer des
pages, interroger des bases de données — sans que tu écrives de code de
liaison.

C'est la **couche de standardisation entre les agents IA et les
systèmes externes**. Si un service parle MCP, n'importe quel client
compatible MCP (Claude Code, Cowork, Cursor, etc.) peut l'utiliser.

## Concrete example from this showcase

`plugins/linkedin-post/.mcp.json` est implicite (le serveur est déclaré
dans `plugin.json` sous `mcpServers`). Le serveur lui-même vit à
`plugins/linkedin-post/mcp-server/src/server.ts` :

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "linkedin-post",
  version: "0.1.0",
});

// Tools (verbs)
server.registerTool("generate_image", { ... }, handler);
server.registerTool("post_linkedin_draft", { ... }, handler);

// Prompts (slash commands)
server.registerPrompt("compose_post", { ... }, handler);

// Resources (@-mentions)
server.registerResource("style_guide", "team-style://linkedin/voice", { ... }, handler);

await server.connect(new StdioServerTransport());
```

Quand ce plugin est activé, Claude Code lance le serveur comme
sous-processus stdio. L'utilisateur peut maintenant :

- Invoquer un outil : Claude appelle `mcp__linkedin-post__generate_image`.
- Lancer une invite : tape `/mcp__linkedin-post__compose_post`.
- Référencer une ressource : tape `@team-style://linkedin/voice`.

## Two transport types

| Transport | Lancé par | Quand l'utiliser |
|---|---|---|
| **stdio** | Sous-processus local lancé par Claude Code. | Outils autonomes pour lesquels chaque utilisateur fournit ses propres identifiants. |
| **http** | Serveur hébergé sur l'internet public (ou un réseau interne). | Services multi-tenant, authentification basée sur OAuth, identifiants partagés. |

Ce showcase utilise stdio (chaque utilisateur fait rouler son propre
serveur avec ses propres clés). Notion / Slack / Sentry / etc.
utilisent http (un serveur auquel tout le monde se connecte).

## When to use vs alternatives

| Utilise MCP quand… | Pas quand… |
|---|---|
| Claude doit interagir avec un vrai système (API, BD, format de fichier). | Des instructions ordinaires dans un skill suffisent. |
| Tu veux que l'intégration soit disponible à travers plusieurs clients IA. | L'intégration est à usage unique, jetable. |
| Tu intègres un service qui publie déjà un serveur MCP. | Reste sur du HTTP simple si tu ne réutiliserais jamais l'intégration. |

MCP vs alternatives :

- **vs un skill qui utilise Bash + curl** — fonctionne pour des
  prototypes ; pas réutilisable, pas auditable, pas déployable de façon
  sécuritaire à une équipe. MCP te donne des entrées typées, une auth
  séparée, et des permissions par serveur.
- **vs du code personnalisé dans CLAUDE.md** — c'est du contexte
  seulement, pas actionnable. MCP, c'est pour les actions.

## Try this

1. Lance `/showcase-tour:explain mcp-tools` pour apprendre la primitive
   MCP la plus courante.
2. Ensuite, lance `/showcase-tour:explain mcp-prompts-resources` pour
   les deux autres.
3. Ensuite, lance `/showcase-tour:inspect plugins/linkedin-post/mcp-server/src/server.ts`
   pour lire le vrai code de bootstrap du serveur.
