# Script de visite — Français

Chargé par `tour/SKILL.md` après les Étapes 0–2a (état en direct,
mode, langue). Suis ce script de l'Étape 2b jusqu'à la conclusion.
Applique le filtre de mode (Étape 1 du `SKILL.md`) : en mode `quick`,
fais seulement les sections marquées `(toujours)`. En mode `cowork`,
saute les sections marquées `[cowork-skip]` et privilégie le cadrage
spécifique à Cowork là où il est présent.

## Étape 2b — Salutation et confirmation du mode

> "Salut — je vais te faire visiter le showcase. Mode : **standard**
> (~15 min, toutes les fonctionnalités). Tu préfères passer à
> **quick** ou **deep**, ou aller directement à un sujet précis ?
> Sinon, réponds `go` et on commence."

(Si l'utilisateur a passé un mode précis dans `$ARGUMENTS`, remplace
"standard" par le mode choisi et ajuste l'estimation de temps.)

## Étape 2c — Si « In showcase repo » est non, mentionne-le

> "Tu n'es pas dans le dépôt showcase. Je vais te montrer des URLs
> GitHub plutôt que des chemins locaux. Si tu n'as pas encore
> installé les quatre plugins, exécute :"

```
/plugin marketplace add mhosavic/claude-code-showcase
/plugin install draft-email@claude-code-showcase
/plugin install commit-helper@claude-code-showcase
/plugin install linkedin-post@claude-code-showcase
/plugin install showcase-tour@claude-code-showcase
/reload-plugins
```

Attends que l'utilisateur réponde avant de continuer.

## Étape 3 — Faire la visite

Fais les sections ci-dessous **dans l'ordre**, une à la fois. Après
chaque section :

1. Donne le **« quoi » en 1 ou 2 phrases**.
2. Donne la **commande exacte** à essayer.
3. **Attends qu'il l'essaie.** Ne lui balance pas le sujet suivant.
4. Quand il répond (avec le résultat, ou « next », ou une question),
   **réagis brièvement** — confirme ce qui s'est passé, réponds à
   sa question, ou dépanne si ça n'a pas fonctionné.
5. Propose un **triplé d'approfondissement** : un doc, une leçon
   `/showcase-tour:explain <concept>` pour la théorie, et une
   marche-arrière de code `/showcase-tour:inspect <fichier>`. Ne
   liste pas les trois à chaque fois — choisis le ou les plus
   pertinents.
6. Passe à la section suivante.

S'il veut sauter une section, saute-la. S'il veut s'attarder sur
une, attarde-toi.

### À propos du triplé d'approfondissement

Le showcase a trois parcours d'apprentissage orthogonaux en plus de
cette visite :

- **Lire les docs** — `docs/01-...md` à `docs/09-...md`. Linéaire,
  complet, ~30 min de bout en bout.
- **Leçon de concept** — `/showcase-tour:explain <concept>`. ~5 min,
  centré sur un concept. Essaie `/showcase-tour:explain` sans
  argument pour le catalogue complet.
- **Marche-arrière de code** — `/showcase-tour:inspect
  <fichier-ou-cible>`. Lit le vrai code avec annotations.

Mentionne-les naturellement. S'il est curieux du *pourquoi* →
`explain`. S'il veut voir le code → `inspect`. S'il veut du
complet → `docs/`.

### Carte des questions (pour naviguer)

| Q | Sujet | Section | Mode cowork |
|---|---|---|---|
| Q1 | Structure d'un skill simple | B | ✓ (avec note de distribution Cowork) |
| Q2 | Orchestration complexe | F | ✓ (connecteur HTTP pour le MCP) |
| Q3 | Partage dans Claude Team | J | ✓ (claude.com/plugins, instructions de Project, push admin) |
| Q4 | Serveur MCP avec identifiants + restriction par skill | F + G | ✓ (transport HTTP + connecteur perso) |
| Q5 | Exemple de fonction MCP | G + H + I | ✓ (même code, transport HTTP) |
| Q6 | MCP comme connecteur Claude Team | K | ✓ **identique** à Claude Code |
| Q7 | Compatibilité Cowork | L | ✓ (étendu en visite complète) |
| Q8 | `CLAUDE.md` + `.claude/rules/` | L½ | `[cowork-skip]` |
| extra | Bang-blocks | C | `[cowork-skip]` |
| extra | Activation restreinte par chemin | D | `[cowork-skip]` |
| extra | Hooks PreToolUse | E | `[cowork-skip]` |

S'il dit « je ne m'intéresse qu'à une seule question », saute
directement à cette section, puis offre de continuer.

### A. Vue d'ensemble (toujours)

> "Le showcase contient 4 plugins, du plus simple au plus complexe :
> `draft-email` (le plus simple), `commit-helper` (intermédiaire),
> `linkedin-post` (orchestration complète avec serveur MCP intégré),
> et `showcase-tour` (cette visite elle-même — méta)."

Pas de commande à exécuter. Confirme juste que l'utilisateur est
orienté. Référence : `README.md` pour la carte de la structure.

### B. Skill simple — répond à Q1 (toujours — même en mode quick)

> "Un **skill** est une invite (prompt) que Claude peut déclencher
> comme une commande slash. Le plugin utile le plus simple, c'est un
> skill dans un seul fichier."

Fais-le essayer :

```
/draft-email:draft dis à mon collègue que la revue trimestrielle est déplacée à jeudi
```

Après l'essai, fais-lui remarquer : la sortie est ancrée dans le
brief, le skill laisse des placeholders entre crochets, et la
structure (Sujet / corps / signature) vient des instructions de
SKILL.md. Référence : `docs/01-simple-skill.md`.

### C. Injection de contexte dynamique — bang-blocks (sauter en quick) `[cowork-skip]`

> "Le markdown d'un skill peut contenir des « bang-blocks » : un
> point d'exclamation suivi immédiatement d'une commande shell entre
> backticks. Ils s'exécutent *avant* que l'invite n'atteigne Claude
> — la sortie remplace le placeholder. Résultat : des données en
> direct, sans boucle agentique."

Fais-le essayer (dans n'importe quel dépôt git avec au moins un
changement indexé) :

```
/commit-helper:commit-msg
```

Après : fais-lui remarquer que Claude a écrit un message de commit
*ancré dans le vrai diff*, pas un message générique — parce que le
skill a embarqué une bang-injection de `git diff --cached` et le
diff a été inliné avant que Claude ne voie l'invite. Référence :
`plugins/commit-helper/skills/commit-msg/SKILL.md`.

### D. Skills restreints par chemin (sauter en quick) `[cowork-skip]`

> "Les skills peuvent déclarer un champ `paths:` dans leur en-tête.
> Claude ne les charge dans le contexte que lorsqu'il lit des
> fichiers correspondant aux globs. Ça garde le contexte léger
> quand une équipe a beaucoup de skills internes."

Fais-le ouvrir n'importe quel fichier TypeScript (`src/index.ts`,
etc.) et demander à Claude de nettoyer les imports. Sans nommer le
skill, Claude devrait choisir automatiquement
`/commit-helper:cleanup-imports` parce que le chemin a fait match.

S'il n'y a pas de fichier TS sous la main, décris-le seulement —
il pourra y revenir. Référence :
`plugins/commit-helper/skills/cleanup-imports/SKILL.md`.

### E. Hooks — vraies barrières de sécurité (sauter en quick) `[cowork-skip]`

> "Les hooks sont **déterministes** — contrairement aux instructions
> de `CLAUDE.md` qui sont des préférences. Le plugin
> `commit-helper` embarque un hook `PreToolUse` qui bloque les
> force-push vers main, `git reset --hard` brut, et `git clean -f`."

Demande-lui de demander à Claude de « force-push ma branche vers
main ». Claude *ne va pas* l'exécuter — le hook a intercepté avant
l'appel shell. Référence :
`plugins/commit-helper/scripts/guard-dangerous-git.sh` (~50 lignes,
30 secondes à lire).

### F. Orchestration complexe — répond à Q2 (touche aussi à Q4)

> "Les skills peuvent en orchestrer d'autres. `linkedin-post:post`
> suit un déroulement en 4 étapes : entrevue → rédaction du texte →
> génération d'image → publication d'un brouillon sur LinkedIn."

Fais-le essayer :

```
/linkedin-post:post on vient de lancer la bêta publique de notre outil de planification
```

Claude commencera l'entrevue. Il peut répondre brièvement (ou
sauter avec « écris juste quelque chose »), regarder le brouillon
arriver, l'accepter, et regarder les outils MCP s'exécuter. **Mode
simulation par défaut — rien n'est réellement publié.** Dis-le-lui
clairement.

Après : fais-lui remarquer (a) le corps du skill orchestrateur,
c'est de la prose simple qui liste les 4 étapes, (b) chaque
sous-skill peut être appelé indépendamment (il pourrait lancer
`/linkedin-post:draft-text` directement), (c) le champ
`mocked: true` dans le résultat de l'outil. Référence :
`docs/02-complex-skill-orchestration.md`.

**En mode cowork** : mentionne aussi que cette orchestration
fonctionne pareil dans Cowork — avec le serveur MCP qui tourne en
HTTP plutôt qu'en stdio, enregistré comme connecteur personnalisé.
Pointe vers
`docs/07-using-with-cowork.fr.md#q2--orchestration-complexe-dans-cowork`.

### G. Outils MCP — répond à Q4 + une partie de Q5 (sauter en quick)

> "Le plugin `linkedin-post` embarque un serveur MCP avec deux
> outils : `generate_image` (OpenAI gpt-image-1 — simulation par
> défaut) et `post_linkedin_draft` (API LinkedIn ugcPosts —
> simulation par défaut). Le champ `allowed-tools` dans l'en-tête
> de chaque skill contrôle quel skill peut appeler quel outil."

Fais-le vérifier :

```
/mcp
```

Cherche `linkedin-post` listé et `connected`. Si c'est `pending` ou
`failed`, c'est le hook SessionStart qui est encore en train de
construire. Référence : `docs/04-mcp-server-with-auth.md` et
`docs/05-mcp-function-example.md`.

**En mode cowork** : les deux mêmes outils sont joignables comme
connecteur personnalisé. Fais-lui ouvrir `cd
plugins/linkedin-post/mcp-server && npm run start:http` dans un
terminal, puis aller à Paramètres → Connecteurs → Ajouter un
connecteur personnalisé avec `http://127.0.0.1:3000/mcp`. Les
mêmes outils apparaissent. Référence :
`docs/07-using-with-cowork.fr.md#q4--serveur-mcp-avec-identifiants-et-restriction-par-skill-variante-http`.

### H. Invites MCP — commandes slash depuis le serveur (sauter en quick)

> "Un serveur MCP peut exposer des **invites** (prompts) en plus de
> ses outils. Les invites deviennent des commandes slash avec
> arguments nommés. Elles injectent un texte gabarit dans la
> conversation — elles ne *font* rien par elles-mêmes."

Fais-le essayer :

```
/mcp__linkedin-post__compose_post
```

Claude Code va demander un `topic` et une `audience`. Il injecte
ensuite un gabarit de prompt avec des conseils spécifiques à
l'audience et des règles de style. Référence :
`plugins/linkedin-post/mcp-server/src/prompts/composer.ts`.

### I. Ressources MCP — contenu attachable avec @ (sauter en quick)

> "Un serveur MCP peut exposer des **ressources** : du contenu
> adressable que l'utilisateur attache avec `@`. Idéal pour du
> matériel de référence — guides de style, schémas, etc."

Fais-le essayer en tapant `@` dans une invite Claude et en
cherchant `team-style://linkedin/voice` dans l'autocomplétion.
Fais-le l'attacher et demander à Claude de « résumer les phrases
interdites ». Référence :
`plugins/linkedin-post/mcp-server/src/resources/style-guide.ts`.

### J. Distribution à l'équipe — répond à Q3 (toujours)

> "Trois patterns de distribution. Chaque développeur ajoute le
> marketplace manuellement. Ou tu commites `extraKnownMarketplaces`
> dans le `.claude/settings.json` du projet. Ou — sur les plans
> Team / Enterprise — tu le pousses via les paramètres gérés par
> serveur depuis la console d'administration."

Pas de commande à exécuter ; référence :
`docs/03-team-distribution.md`. En mode quick, mentionne juste que
ça existe et que les docs ont les détails.

**En mode cowork** : les trois patterns sont différents —
soumission à `claude.com/plugins`, instructions personnalisées
de Project, ou push admin géré (en cours de déploiement). Pointe
vers `docs/07-using-with-cowork.fr.md#q3--partager-avec-léquipe`.

### K. Connecteurs Claude Team — répond à Q6 (sauter en quick)

> "Pour un MCP à l'échelle de l'organisation, deux chemins : un
> **serveur MCP HTTP hébergé** → enregistré dans l'interface
> Connectors de l'admin Claude.ai ; un **serveur MCP stdio
> embarqué** → distribué via un marketplace de plugins poussé par
> les paramètres gérés par serveur."

Référence : `docs/06-claude-team-connectors.md`.

**En mode cowork** : appelle explicitement le fait que **le
chemin A est identique entre Claude Code et Cowork** — une fois
que le MCP HTTP est enregistré comme connecteur d'organisation,
chaque utilisateur des deux surfaces le voit sans configuration
manuelle. C'est le point de convergence des deux produits.

### L. Compatibilité Cowork — répond à Q7 (toujours)

> "Cowork, c'est l'application Claude pour ordinateur. Les
> connecteurs MCP HTTP hébergés fonctionnent nativement. La
> distribution de plugins personnalisés vers Cowork est en cours
> d'unification avec Claude Code ; aujourd'hui, le chemin
> recommandé est d'héberger le serveur MCP en HTTP et de
> l'enregistrer comme connecteur pour les utilisateurs Cowork."

Référence : `docs/07-using-with-cowork.fr.md`.

**En mode cowork** : étends ce résumé en une visite des options
de déploiement. Mentionne `cloudflare/README.md` spécifiquement —
c'est le chemin le moins cher et le plus rapide. Détaille
l'ajout de l'URL dans Paramètres → Connecteurs.

### L½. CLAUDE.md et règles — répond à Q8 / bonus (sauter en quick) `[cowork-skip]`

> "Deux couches de « style de la maison » qui s'appliquent à
> l'échelle du dépôt à chaque tour : un `CLAUDE.md` unique à la
> racine pour la politique durable, plus `.claude/rules/` pour les
> approfondissements spécifiques chargés seulement quand
> pertinents. C'est comme ça que tu transformes « le Claude de
> chaque contributeur connaît nos conventions » d'un souhait en
> une garantie."

Fais-le essayer :

```
/showcase-tour:explain claude-md-and-rules
```

Ou, s'il veut voir les vrais fichiers :

```
/showcase-tour:inspect CLAUDE.md
```

Après : fais-lui remarquer (a) le `CLAUDE.md` du dépôt est court
et pointe vers `.claude/rules/` pour la profondeur, (b) les règles
sont chargées seulement quand Claude lit des fichiers
correspondant à leur glob `paths:`, ce qui garde le contexte
léger. Référence : `CLAUDE.md` et `.claude/rules/`.

### M. Conclusion (toujours)

Termine en trois ou quatre lignes courtes.

**Mode standard / quick / deep :**

> "Voilà pour le showcase. Quelques façons de continuer à
> apprendre :
>  - **Concept par concept** → `/showcase-tour:explain` liste 13
>    leçons ; choisis-en une (commence par `skills` si tu es
>    nouveau). La dernière (`claude-md-and-rules`) relie tout —
>    politique au niveau du dépôt plus règles thématiques.
>  - **Lire le vrai code** → `/showcase-tour:inspect <fichier>` te
>    promène dans n'importe quel fichier du dépôt avec des
>    annotations. Essaie `/showcase-tour:inspect
>    plugins/linkedin-post` pour le plugin le plus complexe, ou
>    `/showcase-tour:inspect CLAUDE.md` pour voir comment ce dépôt
>    enseigne son propre style.
>  - **Vérifier que tout fonctionne** → `/showcase-tour:status`
>    pour le bilan de santé, `docs/08-verify.md` pour la
>    checklist complète.
>  - **Passer en mode réel** → l'intégration LinkedIn est en
>    simulation par défaut ; `docs/04-mcp-server-with-auth.md`
>    couvre la configuration des identifiants."

Si tu as fait le **mode deep**, propose aussi :

> "Veux-tu que je parcoure un fichier source en particulier
> maintenant ? Donne-moi le chemin — j'ai un accès en lecture."

**Mode cowork** — remplace la conclusion ci-dessus par cette
version centrée sur Cowork :

> "Voilà la piste Cowork. Pour mettre ça en pratique pour ton
> équipe :
>  - **Déploie le serveur MCP** → `cd
>    plugins/linkedin-post/mcp-server`, puis soit `npm run
>    start:http` en local pour tester, soit suis
>    `cloudflare/README.md` pour un déploiement Cloudflare
>    Workers. Une fois joignable en HTTPS, enregistre-le dans
>    Cowork via Paramètres → Connecteurs → Ajouter un connecteur
>    personnalisé.
>  - **Choisis un chemin de distribution** pour les skills → soit
>    tu soumets `linkedin-post` à `claude.com/plugins`, soit tu
>    colles le corps de l'orchestrateur dans les instructions
>    personnalisées d'un Project Cowork pour un usage ponctuel.
>  - **Pour un déploiement à l'échelle de l'organisation** →
>    `docs/06-claude-team-connectors.md` explique le chemin
>    Connector admin ; identique entre Claude Code et Cowork.
>  - **Lis les détails de l'écart** →
>    `docs/07-using-with-cowork.fr.md` est la piste Cowork
>    complète avec un guide de déploiement et une note OAuth pour
>    la production."
