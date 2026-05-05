# Q7 — Utiliser ce showcase avec Claude Cowork

> "Il pourrait vouloir utiliser claude cowork avec ce projet."

> 🇬🇧 English version: [`07-using-with-cowork.md`](07-using-with-cowork.md)

Claude Cowork, c'est **l'application Claude pour ordinateur avec des
fonctionnalités agentiques** — sous-agents, accès aux fichiers, tâches
planifiées. Cowork partage la même infrastructure de plugins / de
connecteurs / de MCP que Claude Code, mais avec un modèle de
distribution et une surface différents.

Cette page est la **piste Cowork** du showcase. Pour chacune des six
questions originales de Francis, elle montre ce qui est pareil dans
Cowork, ce qui change, et le chemin recommandé aujourd'hui.

## TL;DR

| Concept | Claude Code | Claude Cowork |
|---|---|---|
| D'où viennent les plugins | Marketplaces GitHub personnalisés (ex. `mhosavic/claude-code-showcase`) **OU** `claude.com/plugins` | `claude.com/plugins` seulement (aujourd'hui) |
| Serveurs MCP | stdio (embarqués) **OU** HTTP hébergé (connecteur) | HTTP hébergé uniquement — « Connecteur personnalisé » |
| Modèle de skill (`SKILL.md`) | Skills de plugin, skills de projet, skills utilisateur | Skills de plugin (depuis `claude.com/plugins`) ; les instructions personnalisées par conversation vivent dans les **Projects** |
| Restriction par skill (`allowed-tools`) | Oui | Oui — même format de plugin |
| `disable-model-invocation`, etc. | Oui | Oui (même en-tête) |
| Hooks (`PreToolUse`, etc.) | Oui | Non (spécifique à Claude Code) |
| Bang-blocks (`!`-blocs) | Oui | Non (spécifique à Claude Code) |
| `CLAUDE.md` / `.claude/rules/` | Oui | Non (Cowork utilise les instructions de Project) |

L'élément qui débloque le plus pour Cowork : **`claude.com/plugins`
est partagé entre Claude Code et Cowork** — les plugins publiés là
peuvent cibler l'un ou l'autre, ou les deux. Et **n'importe quel
utilisateur Cowork peut ajouter une URL de serveur MCP personnalisée**
via Paramètres → Connecteurs → Ajouter un connecteur personnalisé.
Donc le serveur MCP LinkedIn de ce showcase devient utilisable dans
Cowork simplement en l'exécutant en HTTP plutôt qu'en stdio. Pas
besoin d'admin.

## Q1 — Skill simple, dans Cowork

Le `SKILL.md` du plugin `draft-email` est **identique** pour Cowork.
Le format du fichier, l'en-tête, la substitution de `$ARGUMENTS`, la
`description`, `disable-model-invocation` — tout pareil. Ce qui change,
c'est la **distribution** :

| Chemin | À quoi ça ressemble |
|---|---|
| **A. Soumettre à `claude.com/plugins`** (recommandé pour un usage partagé) | Le plugin vit dans le catalogue Anthropic. Les utilisateurs Cowork parcourent Paramètres → Plugins → installer. Fonctionne aussi dans Claude Code. |
| **B. Utiliser les instructions de Project** (ponctuel, par projet) | Ouvre un Project dans Cowork, colle le corps du skill dans ses instructions personnalisées. Pas de commande `/draft-email:draft`, mais le comportement est dispo dans ce projet. |
| **C. Attendre la poussée admin gérée** | Anthropic déploie la poussée du marketplace par les admins Claude Team afin qu'un marketplace GitHub personnalisé arrive aussi dans Cowork. Aujourd'hui ça marche pour Claude Code ; le support Cowork est en cours. |

Pour l'équipe de Francis : choisis **A** si `draft-email` doit être
disponible universellement, **B** si c'est spécifique à un projet.

## Q2 — Orchestration complexe, dans Cowork

L'orchestration en 4 skills de `linkedin-post` (`interview` →
`draft-text` → `generate-image` → `post`) fonctionne dans Cowork de la
même façon que dans Claude Code, avec deux changements de transport :

1. **Le serveur MCP tourne en HTTP**, pas en stdio. Voir Q4/Q5 plus
   bas pour le code.
2. **Les skills viennent de `claude.com/plugins`** (ou des
   instructions de Project, voir Q1).

Le chaînage des sous-skills marche pareil — Cowork peut appeler des
sous-skills depuis le corps d'un orchestrateur. Les en-têtes
`disable-model-invocation: true` et `allowed-tools` sont honorés à
l'identique.

## Q3 — Partager avec l'équipe

| Chemin de distribution | Claude Code | Cowork |
|---|---|---|
| Marketplace GitHub personnalisé (`/plugin marketplace add owner/repo`) | ✅ | ❌ aujourd'hui |
| Soumission à `claude.com/plugins` | ✅ (auto-disponible) | ✅ (auto-disponible) |
| Poussée d'`enabledPlugins` gérée par serveur (console admin Team / Enterprise) | ✅ aujourd'hui | 🟡 en cours de déploiement |

Pour les équipes Cowork-d'abord aujourd'hui : la réponse pratique est
« soumettre à `claude.com/plugins` » ou utiliser les instructions
personnalisées au niveau du Project.

## Q4 — Serveur MCP avec identifiants et restriction par skill (variante HTTP)

Le même serveur TypeScript dans `plugins/linkedin-post/mcp-server/`
expose **deux points d'entrée de transport** :

| Fichier | Transport | Où ça tourne |
|---|---|---|
| `src/server.ts` | stdio | Claude Code (embarqué dans le plugin) |
| `src/server-http.ts` | Streamable HTTP | Cowork (connecteur personnalisé), Claude Code distant, n'importe quel client MCP |

Les deux passent par `src/server-builder.ts` — mêmes outils, mêmes
invites, mêmes ressources, même `auth.ts`, même mode simulation.
Changer de transport, c'est 3 lignes au point d'entrée.

Le serveur HTTP respecte le même contrat de variables d'environnement :
- `MOCK_MODE=true` (par défaut) — pas de vrai appel d'API
- `OPENAI_API_KEY` — pour `generate_image` en mode réel
- `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_PERSON_URN` — pour `post_linkedin_draft`
- `PORT=3000` (par défaut), `HOST=127.0.0.1` (par défaut), `MCP_PATH=/mcp` (par défaut)
- `ALLOWED_HOSTS` — liste séparée par virgules pour la protection DNS rebinding sur des hôtes non-localhost

Pour lancer en local :

```bash
cd plugins/linkedin-post/mcp-server
npm install
npm run build
MOCK_MODE=true npm run start:http
# linkedin-post MCP server up (http, mock=true) — http://127.0.0.1:3000/mcp
```

**Restriction par skill dans Cowork** : quand Francis ajoute le
serveur HTTP comme connecteur personnalisé, l'interface de Cowork lui
permet d'**activer ou de désactiver chaque outil individuellement** par
connecteur (Paramètres → Connecteurs → clique sur le connecteur →
liste des outils). Équivalent à `allowed-tools` dans un skill Claude
Code, juste appliqué au niveau du connecteur plutôt qu'au niveau du
skill.

## Q5 — Exemple de fonction MCP, dans Cowork

Le protocole MCP est identique entre stdio et HTTP — mêmes `tools/`,
mêmes `prompts/`, mêmes `resources/`, mêmes schémas Zod. Le seul
fichier qui dépend du transport, c'est le point d'entrée.

`src/server-builder.ts` :

```typescript
// Imports + construction du serveur (identique pour les deux transports).
const server = new McpServer({ name: "linkedin-post", version: "0.1.0" }, {...});
server.registerTool("generate_image", {...}, handler);
server.registerTool("post_linkedin_draft", {...}, handler);
server.registerPrompt("compose_post", {...}, handler);
server.registerResource("style_guide", STYLE_GUIDE_URI, {...}, handler);
return server;
```

`src/server.ts` (stdio) :
```typescript
const transport = new StdioServerTransport();
await server.connect(transport);
```

`src/server-http.ts` (HTTP) :
```typescript
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});
await server.connect(transport);
const app = createMcpExpressApp({ host: HOST });
app.post("/mcp", (req, res) => transport.handleRequest(req, res, req.body));
app.listen(PORT, HOST);
```

C'est tout l'écart de transport. Toute la logique métier — génération
d'image, création du post LinkedIn, court-circuit du mode simulation,
validation de schéma, gestion d'erreur — est partagée.

## Q6 — Ajouter le serveur MCP à Cowork

Pour un utilisateur Cowork individuel (sans admin) :

1. Déploie le serveur HTTP quelque part de joignable (voir [Guide de déploiement](#guide-de-déploiement) plus bas).
2. Dans Cowork : **Paramètres → Connecteurs → Ajouter un connecteur personnalisé**.
3. Saisis l'URL déployée (ex. `https://linkedin-post.example.com/mcp`).
4. Authentifie-toi (si le déploiement utilise OAuth — voir la note d'auth plus bas).
5. Les deux outils, l'invite, et la ressource apparaissent dans Cowork.

Pour un déploiement organisationnel : la même URL HTTP peut être
enregistrée comme **connecteur d'organisation** via le support
Anthropic. Une fois enregistré, chaque utilisateur de l'organisation
le voit sans configuration manuelle. C'est le chemin A de
[Q6](06-claude-team-connectors.md) et ça marche identiquement dans
Cowork.

## Guide de déploiement

### Option 1 — Une petite VM (le plus simple)

```bash
# Sur un serveur (Linode / DigitalOcean / Hetzner / EC2) :
git clone https://github.com/mhosavic/claude-code-showcase.git
cd claude-code-showcase/plugins/linkedin-post/mcp-server
npm install
npm run build

# Tourne derrière systemd / pm2 / etc. — bind sur localhost et mets nginx devant :
HOST=127.0.0.1 PORT=3000 \
  MOCK_MODE=false \
  OPENAI_API_KEY=... LINKEDIN_ACCESS_TOKEN=... LINKEDIN_PERSON_URN=... \
  npm run start:http
```

Mets nginx + Let's Encrypt devant pour HTTPS. Cowork exige HTTPS pour
les connecteurs non-localhost.

### Option 2 — Cloudflare Workers (le moins cher, le plus rapide)

Voir le guide complet dans
[`plugins/linkedin-post/mcp-server/cloudflare/README.md`](../plugins/linkedin-post/mcp-server/cloudflare/README.md).
Niveau gratuit : 100 000 requêtes/jour. Pour la plupart des équipes
qui utilisent ce serveur de temps en temps, tu ne sortiras jamais du
gratuit.

### Option 3 — Vercel / Lambda

Encapsule l'app Express de `server-http.ts` comme handler serverless.
Pour Vercel, dépose le fichier dans `api/mcp.ts` et exporte l'app
Express en défaut. Pour Lambda, utilise `serverless-http` pour
adapter.

## Authentification (mode réel)

Le showcase actuel utilise des variables d'environnement pour les
identifiants. Pour un connecteur Cowork de production, le chemin
recommandé est **OAuth** : faire en sorte que le connecteur lui-même
agisse comme un fournisseur OAuth pour que chaque utilisateur Cowork
s'authentifie avec son propre compte LinkedIn / OpenAI, et que les
tokens atterrissent côté serveur indexés par identifiant utilisateur
Cowork. Le SDK MCP a des aides intégrées sous
`@modelcontextprotocol/sdk/server/auth/`. C'est au-delà de la
pédagogie de ce showcase, mais le module `auth.ts` est structuré pour
qu'on puisse remplacer le chargement par variables d'environnement par
un lookup de token par requête.

## Et les fonctionnalités Cowork qui n'existent pas dans Claude Code ?

Cowork offre des capacités que Claude Code n'a pas (UI de sélection de
fichiers, tâches planifiées, délégation mobile). Elles ne font pas
partie du périmètre de ce showcase, mais si Francis les utilise, le
serveur MCP LinkedIn tourne dessous à l'identique — Cowork est juste
un autre client MCP.

## Où trouver de l'aide

- **Problèmes Cowork** : onglet support dans l'app, ou
  <https://support.claude.com>.
- **Configuration de connecteur personnalisé** :
  <https://modelcontextprotocol.io/docs/develop/connect-remote-servers>
- **Problèmes plugins / MCP** : `claude --debug` depuis le CLI Claude
  Code est le moyen le plus rapide de faire remonter les erreurs de
  chargement qui affectent les deux surfaces.
- **Soumission à `claude.com/plugins`** :
  <https://claude.ai/settings/plugins/submit>
