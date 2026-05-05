# Concept : mcp-prompts-resources

## What

Les deux primitives MCP qui ne sont pas des outils :

- **Invite (Prompt)** — un message gabarit que l'utilisateur (ou Claude)
  injecte dans la conversation en invoquant une commande slash.
  N'*exécute* rien — elle livre une invite paramétrée.
- **Ressource** — du contenu adressable par URI. Tu l'amènes dans une
  conversation en tapant `@` et en choisissant dans l'autocomplétion.

Les deux viennent du même serveur MCP que les outils. La plupart des
serveurs livrent un mélange des trois.

## Mental model

| Primitive | Devient | Cas d'usage |
|---|---|---|
| Outil | Une fonction appelable `mcp__server__name` | Verbes que Claude invoque |
| Invite | Une commande slash `/mcp__server__name <args>` | Contextes de départ réutilisables |
| Ressource | Une mention `@uri` | Matériel de référence |

Un cadrage utile : **les outils FONT des choses, les invites DISENT des
choses, les ressources SONT des choses.**

## Concrete example: prompt

`plugins/linkedin-post/mcp-server/src/prompts/composer.ts` :

```typescript
export const composePostArgsSchema = {
  topic: z.string().min(3).describe("The thing you want to post about."),
  audience: z.enum(["customers", "peers", "candidates", "investors", "general"])
    .default("general"),
};

export function composePostHandler({ topic, audience }) {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Write a LinkedIn post about: ${topic}\n\nAudience: ${audience}\n[...style requirements...]`,
        },
      },
    ],
  };
}
```

Enregistrée dans `server.ts` :

```typescript
server.registerPrompt(
  "compose_post",
  {
    description: "Inject a templated LinkedIn-post prompt with style rules baked in.",
    argsSchema: composePostArgsSchema,
  },
  composePostHandler,
);
```

Dans Claude Code, ça devient `/mcp__linkedin-post__compose_post`.
L'autocomplétion demande `topic` et `audience`. Le texte de l'invite est
injecté dans la conversation, et Claude y répond.

**Ça ne publie rien.** Ça livre juste une invite de départ structurée sur
laquelle le modèle agit ensuite. C'est ça la différence avec un outil.

## Concrete example: resource

`plugins/linkedin-post/mcp-server/src/resources/style-guide.ts` :

```typescript
export const STYLE_GUIDE = {
  uri: "team-style://linkedin/voice",
  description: "Team's LinkedIn voice and style guide.",
  mimeType: "text/markdown",
  text: `# Team voice — LinkedIn\n...`,  // multi-K of style rules
};
```

Enregistrée :

```typescript
server.registerResource(
  "style_guide",
  STYLE_GUIDE.uri,
  {
    title: "LinkedIn voice & style guide",
    description: STYLE_GUIDE.description,
    mimeType: STYLE_GUIDE.mimeType,
  },
  async () => ({
    contents: [{ uri: STYLE_GUIDE.uri, mimeType: STYLE_GUIDE.mimeType, text: STYLE_GUIDE.text }],
  }),
);
```

Dans Claude Code, tape `@` et choisis `team-style://linkedin/voice` dans
l'autocomplétion. Le contenu est attaché à la conversation comme ressource
référencée. Claude peut le lire comme n'importe quel autre contexte.

## When to use what

| Si tu veux… | Enregistre une… |
|---|---|
| Que Claude fasse quelque chose avec effets de bord (publier, récupérer, déployer). | **Outil** |
| Que l'utilisateur tape `/<chose>` et injecte une invite paramétrée. | **Invite** |
| Que l'utilisateur tape `@` et référence du contenu fixe. | **Ressource** |

Quelques patrons :

- **Gabarits de revue de code** → invites. L'utilisateur invoque
  `/mcp__server__review-pr` avec un numéro de PR ; l'invite intègre une
  liste de vérification.
- **Documentation de schéma** → ressources. L'utilisateur référence
  `@db://schema/users` pour enseigner à Claude la structure de la table.
- **Requêtes de base de données** → outils. Claude appelle
  `mcp__db__query` avec du SQL.

Un seul serveur MCP peut livrer les trois. Le serveur Notion livre :
- **Des outils** pour les actions (search, create_page, update_database).
- **Des invites** pour les gabarits (knowledge_capture, meeting_intelligence).
- **Des ressources** pour les métadonnées d'espace de travail référencées par URI.

## Why prompts aren't just skills

Un skill dans Claude Code est un fichier markdown. Une invite venant d'un
serveur MCP est un message **généré par le serveur**, avec des arguments
gérés par le validateur de schéma du serveur.

Utilise des invites quand :
- Le gabarit doit être **versionné avec la sortie du serveur MCP** (pour
  rester en phase avec les outils qui l'accompagnent).
- La logique du handler est **non-triviale** (p. ex. « consulte le tier
  du client dans notre BD avant de générer le texte de l'invite »).
- Tu veux que l'invite soit **disponible sans installation de plugin
  séparée** (l'utilisateur a déjà le serveur MCP connecté).

Sinon, un simple skill est plus simple.

## Why resources aren't just files

Les ressources sont géniales quand le contenu vit « avec » le serveur :

- Un guide de style mis à jour quand l'équipe de marque le révise.
- Un schéma de base de données qui doit correspondre au schéma vivant.
- Une arborescence de docs internes que le `list_resources` du serveur
  expose dynamiquement.

Pour des docs de projet statiques, commit-les simplement dans le dépôt et
référence-les par chemin de fichier. Les ressources se justifient quand
le contenu a une *source de vérité* ailleurs que dans le dépôt.

## Try this

1. Lance `/mcp__linkedin-post__compose_post` — essaie l'invite avec
   topic="we shipped beta" et audience="peers".
2. Dans une invite Claude, tape `@` et cherche
   `team-style://linkedin/voice`. Attache-la. Demande à Claude de
   résumer les expressions interdites.
3. Lance `/showcase-tour:inspect plugins/linkedin-post/mcp-server/src/server.ts`
   pour voir les trois enregistrements côte à côte.
4. Ensuite `/showcase-tour:explain claude-md-and-rules` pour le dernier
   concept — comment la politique restreinte au dépôt relie skills, hooks
   et MCP.
5. Une fois les 13 concepts vus, lance `/showcase-tour:tour deep` si tu
   veux les mettre en pratique de bout en bout.
