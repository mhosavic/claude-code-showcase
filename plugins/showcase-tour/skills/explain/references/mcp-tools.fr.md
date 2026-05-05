# Concept : mcp-tools

## What

Les outils MCP sont des fonctions exposées par un serveur MCP. Claude les
appelle exactement comme il appelle ses outils intégrés (Read, Bash, Edit,
etc.) — sauf que l'implémentation vit dans le serveur, pas dans Claude Code.

Un outil a un **nom**, un **schéma d'entrée** (Zod / JSON Schema) et un
**handler** qui s'exécute quand on l'invoque.

## Mental model

Un outil, c'est **un appel de fonction où le LLM choisit les arguments**.
Claude voit la description de l'outil et son schéma d'entrée, décide si
l'appeler aide la tâche de l'utilisateur, remplit les arguments, et
l'invoque. Le serveur exécute le handler, le résultat revient, et Claude
poursuit.

Les outils sont des **verbes**. Tout ce que Claude *fait* dans le monde
(publier, récupérer, générer, interroger, déployer, envoyer) passe par un
appel d'outil.

## Concrete example from this showcase

`plugins/linkedin-post/mcp-server/src/tools/images.ts` :

```typescript
export const generateImageInputSchema = z.object({
  prompt: z.string().min(5).describe(
    "Visual description of the image. Be specific."
  ),
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).default("1024x1024"),
  quality: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function generateImage(input, config) {
  if (config.mockMode) return mockResult(input);

  const apiKey = requireCredential(config.openaiApiKey, "OPENAI_API_KEY", "...");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-image-1", prompt: input.prompt, ... }),
  });

  // ... parse response, return { url, mocked: false, ... }
}
```

Et l'enregistrement dans `server.ts` :

```typescript
server.registerTool(
  "generate_image",
  {
    description: "Generate a square image (1024×1024) for a LinkedIn post via gpt-image-1.",
    inputSchema: generateImageInputSchema.shape,
  },
  async (input) => {
    const result = await generateImage(generateImageInputSchema.parse(input), config);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);
```

Quand Claude Code est connecté, cet outil apparaît sous le nom
`mcp__linkedin-post__generate_image`. Claude peut l'appeler dès que la
description correspond à l'intention de l'utilisateur. Le court-circuit du
mode simulation fait que ça fonctionne même sans identifiants.

## The naming convention

`mcp__<server-name>__<tool-name>` — doubles tirets bas. Utilisé dans :

- L'en-tête (frontmatter) `allowed-tools:` des skills.
- `permissions.allow / deny` dans les paramètres.
- Les messages d'erreur et la sortie de `claude --debug`.

## Anatomy of a good tool definition

1. **Nom en `snake_case`**, en minuscules. Verbe en premier s'il fait
   quelque chose.
2. **Une description qui inclut QUAND l'utiliser.** Même conseil que pour
   les descriptions de skill — Claude lit ça pour décider d'appeler ou non.
3. **Un schéma d'entrée avec `.describe()` sur chaque champ.** Le modèle
   utilise ces descriptions pour remplir les arguments.
4. **Des valeurs par défaut sur chaque champ optionnel.** Le modèle n'a
   pas à se casser la tête avec des paramètres dont il se fiche.
5. **Retourne `{ content: [...] }`** avec `type: text`, `image`, ou
   `resource`. La plupart des outils retournent du texte (souvent du JSON).
6. **Les erreurs lancées deviennent des erreurs d'outil** que Claude voit.
   Rends-les utiles à l'utilisateur — "Missing OPENAI_API_KEY. Set via
   /plugin Configure."

## When to use vs alternatives

| Utilise un outil MCP quand… | Utilise un skill quand… |
|---|---|
| Tu as besoin de vraies E/S — HTTP, fichiers, BD. | Des instructions textuelles suffisent. |
| Tu veux des entrées typées validées par un schéma. | L'« entrée » est de la prose libre. |
| L'action a des effets de bord à auditer. | L'action est une invite pure. |
| Tu veux la même capacité dispo dans plusieurs clients d'IA. | C'est spécifique à Claude Code. |

## Try this

1. Lance `/showcase-tour:inspect plugins/linkedin-post/mcp-server/src/tools/images.ts`
   pour parcourir le code source complet avec des annotations sur le rôle
   de chaque partie.
2. Ensuite, lance `/showcase-tour:explain mcp-prompts-resources` pour les
   deux autres primitives MCP.
