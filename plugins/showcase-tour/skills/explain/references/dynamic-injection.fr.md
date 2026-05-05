# Concept : dynamic-injection

## What

Un « bang-block » — un point d'exclamation immédiatement suivi d'une commande
shell délimitée par des accents graves — placé à l'intérieur du corps d'un
skill. La commande shell s'exécute **avant** que le contenu du skill
n'atteigne Claude ; sa sortie remplace le placeholder. Claude voit de vraies
données, pas « va exécuter cette commande ».

## Mental model

C'est l'équivalent skill de `f"<value: {x}>"` en Python. Tu fais du
**templating avec la sortie shell en direct** au moment de l'invocation.

La propriété cruciale : c'est du **prétraitement, pas un appel d'outil**. Pas
de boucle agentique, pas d'invite de permission, pas de chance pour le modèle
de réinterpréter ce que tu voulais dire. Le shell s'exécute une fois, la
sortie est là, Claude lit.

Ça rend l'injection `!` **moins coûteuse et plus déterministe** que de
demander à Claude d'exécuter la même commande lui-même via l'outil Bash.

## Concrete example from this showcase

Ouvre `plugins/commit-helper/skills/commit-msg/SKILL.md` et lis les sections
« Repo state » et « What's actually staged ». Le skill définit plusieurs
bang-blocks qui collectent :

- la branche actuelle (via `git rev-parse --abbrev-ref HEAD`)
- le compte de fichiers indexés (via `git diff --cached --name-only | wc -l`)
- la stat du diff et le corps du diff lui-même (via `git diff --cached`)

Chaque bang-block s'exécute au moment de l'invocation du skill ; sa sortie
standard remplace le placeholder dans le corps du skill. Donc quand
l'utilisateur lance `/commit-helper:commit-msg`, ce que Claude reçoit
réellement ressemble à ça :

```markdown
## Repo state

- **Branch:** main
- **Staged file count:** 3

## What's actually staged

 src/auth.ts | 12 ++++++++++--
 src/login.ts | 4 +++-

diff --git a/src/auth.ts b/src/auth.ts
index abc..def 100644
...
```

Claude écrit le message de commit **ancré dans le diff réel**. Sans
bang-injection, tu devrais soit coller le diff manuellement à chaque fois,
soit demander à Claude d'exécuter `git diff` lui-même — ce qui est plus lent
et ajoute une occasion pour le modèle de faire quelque chose d'inattendu.

## Two forms

**En ligne.** Place un bang-block sur la même ligne que le markdown qui
l'entoure : le placeholder
`<bang><backtick>git rev-parse --abbrev-ref HEAD<backtick>` à l'intérieur
d'un élément de liste se résout en « main » avant que Claude ne voie le corps
du skill.

**Bloc clôturé multi-lignes.** Utilise un bloc de code clôturé étiqueté avec
`bang` (ouvre avec trois accents graves plus un point d'exclamation littéral)
quand la sortie standard de la commande fait plusieurs lignes — par exemple,
exécuter `git status --short` suivi de `git diff --stat HEAD`. Sa sortie
standard s'insère comme corps du bloc.

Pour voir les deux formes en source réelle, lance
`/showcase-tour:inspect plugins/commit-helper/skills/commit-msg/SKILL.md`.

## When to use vs alternatives

| Utilise l'injection `!` quand… | Pas quand… |
|---|---|
| Tu as besoin de données en direct chaque fois que le skill s'exécute (état git, contenu de fichiers, env). | Les données sont statiques — colle-les, c'est tout. |
| La commande est rapide (<1 s) et déterministe. | La commande est lente ou pourrait demander une saisie. |
| Tu veux que Claude réagisse à des données fraîches sans appel d'outil. | Tu as besoin que Claude *décide* s'il faut aller chercher les données selon le contexte — utilise alors Bash. |

Un patron courant : injection `!` en haut du skill pour « quel est l'état
actuel ? » + corps du skill qui dit à Claude quoi faire avec cet état. Voir
`plugins/commit-helper/skills/yesterday/SKILL.md` pour un autre exemple.

## Things to watch out for

- **Mets `2>/dev/null`** — si la commande pourrait échouer, avale stderr
  ou ça fuit dans l'invite et embrouille Claude.
- **Limite la taille de la sortie** — `git diff` sans tête peut renvoyer des
  dizaines de milliers de lignes. Passe par `head -N` ou `wc -l` pour garder
  la taille du skill gérable.
- **Ne mets pas de secrets dans les blocs `!`.** La sortie entre dans
  l'invite ; si tu fais `cat .env`, ces secrets s'en vont à Claude.

## Try this

1. Lance `/showcase-tour:inspect plugins/commit-helper/skills/commit-msg/SKILL.md`
   pour voir les blocs `!` en contexte avec les consignes qui les entourent.
2. Ensuite, lance `/showcase-tour:explain path-scoping` pour un autre patron
   qui fait que les skills performent bien dans de vrais projets.
