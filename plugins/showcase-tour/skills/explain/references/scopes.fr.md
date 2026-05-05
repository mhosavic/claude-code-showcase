# Concept : scopes

## What

L'endroit où un skill réside physiquement — et par conséquent, **qui peut
l'utiliser et comment il se partage**. Quatre portées (scopes), chacune avec
un chemin de partage différent :

| Portée | Emplacement du fichier | Invocation | Chemin de partage |
|---|---|---|---|
| **Personal** | `~/.claude/skills/<name>/SKILL.md` | `/<name>` | Envoie le fichier en MP. Copier-coller. |
| **Project** | `<repo>/.claude/skills/<name>/SKILL.md` | `/<name>` | Commit-le. Quiconque clone le dépôt l'obtient. |
| **Plugin** | `<plugin>/skills/<name>/SKILL.md` | `/<plugin>:<name>` | Installation par marketplace. Versionné. Mises à jour automatiques. |
| **Managed** | Poussé via la console admin | `/<plugin>:<name>` | Push admin Team / Enterprise. Ne peut pas être désactivé par les utilisateurs. |

## Mental model

Vois les portées comme un **cycle de vie**. La plupart des skills commencent
en `~/.claude/` (prototype personnel), passent à `<repo>/.claude/` une fois
qu'ils prouvent leur utilité pour un projet précis, et finissent par être
empaquetés en plugin dans un marketplace d'équipe quand ils sont largement
utiles.

Tu choisis une portée selon **l'ampleur à laquelle le skill devrait
s'appliquer** :

- **Juste moi, partout** → personal (`~/.claude/skills/`)
- **N'importe qui dans ce dépôt** → project (`<repo>/.claude/skills/`)
- **Plusieurs personnes sur plusieurs projets** → plugin (avec marketplace)
- **Tout le monde dans l'organisation, sans option de retrait** → managed (paramètres gérés par serveur)

## Concrete example from this showcase

Ce dépôt-vitrine existe principalement à la **portée plugin**. Chaque skill
du dépôt vit sous `plugins/<name>/skills/` :

```
plugins/draft-email/skills/draft/SKILL.md
plugins/commit-helper/skills/commit-msg/SKILL.md
plugins/linkedin-post/skills/post/SKILL.md
```

Mais les portées coexistent. Si un coéquipier fork ce dépôt et aime le skill
`draft-email`, il pourrait :

1. Copier `plugins/draft-email/skills/draft/SKILL.md` vers
   `~/.claude/skills/draft/SKILL.md` pour un usage personnel.
2. L'invoquer comme `/draft-email` (sans espace de noms de plugin) au lieu
   de `/draft-email:draft`.
3. Le modifier librement sans affecter le plugin en amont.

C'est comme ça que l'équipe de Francis partage actuellement les skills de
manière informelle — des copies personnelles qui se font promouvoir en
plugins quand quelque chose s'avère assez utile.

## When name collisions happen

Si `~/.claude/skills/commit/SKILL.md` existe ET qu'un plugin livre
`/foo:commit` :

- Le personnel est `/commit`.
- Celui du plugin est `/foo:commit`.
- Les deux fonctionnent simultanément.

L'**espace de noms de plugin** (`<plugin>:<skill>`) empêche les collisions
entre plugins. Il NE masque PAS les skills personnels/projet — ceux-ci vivent
dans la fente non préfixée `/<name>`.

À l'intérieur de la même portée, **enterprise > personal > project > plugin**
prend la priorité sur les noms en double.

## Promoting a personal skill to a plugin

Quand `~/.claude/skills/<x>/SKILL.md` s'avère assez utile pour être partagé :

1. `mkdir -p new-plugin/skills/<x>` et copie le SKILL.md dedans.
2. Ajoute `new-plugin/.claude-plugin/plugin.json` avec name + description.
3. Ajoute le plugin au marketplace de ton équipe.
4. Optionnellement, supprime la copie personnelle une fois que tu fais
   confiance à la version du plugin.

## When to use vs alternatives

| Tu veux… | Utilise la portée… |
|---|---|
| Essayer rapidement un skill, seulement sur ta machine. | Personal. |
| Skill qui dépend des conventions d'un dépôt précis. | Project. |
| Skill qui devrait te suivre à travers plusieurs projets. | Personal. |
| Skill que plusieurs personnes utilisent sur différents projets. | Plugin. |
| Imposer fermement à l'échelle de l'organisation (sécurité / conformité). | Managed. |

## Try this

1. Lance `/showcase-tour:inspect plugins/draft-email/skills/draft/SKILL.md`
   pour voir à quoi ressemble un skill à portée plugin.
2. Ensuite, crée une version personnelle : copie ce fichier vers
   `~/.claude/skills/quick-email/SKILL.md` et essaie de l'invoquer comme
   `/quick-email`.
3. Ensuite, lance `/showcase-tour:explain dynamic-injection` pour apprendre
   un des patrons qui rendent les skills réellement puissants.
