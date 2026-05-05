# Concept : skills

## What

Un skill est un fichier markdown qui devient une slash command. Le corps est
une invite — quand tu l'invoques, Claude la lit comme une consigne et la suit.

## Mental model

Vois un skill comme une **invite enregistrée avec un nom et un contrat clair**.
Là où tu taperais autrement « écris-moi un courriel qui dit X » à chaque fois,
tu sauvegardes les consignes une seule fois et tu les invoques avec
`/draft-email:draft X`.

Les skills, c'est la façon **d'arrêter de te répéter** auprès de Claude.

## Concrete example from this showcase

Le skill le plus simple du dépôt est `plugins/draft-email/skills/draft/SKILL.md` :

```yaml
---
name: draft
description: Draft a polite, well-structured email from a one-line description.
              Use when the user asks to write an email, draft a message, or
              compose a note to send.
argument-hint: <one-line description of what the email should say>
---

# Draft email

Write an email based on this brief: **$ARGUMENTS**

(...detailed instructions on tone, structure, what to avoid...)
```

Trois choses font que ça fonctionne :

1. **L'en-tête (frontmatter)** entre les marqueurs `---`. `name: draft` plus le
   nom du plugin `draft-email` produit la slash command
   `/draft-email:draft`. Le `description` est ce que Claude lit pour décider
   quand *choisir automatiquement* ce skill (par exemple, quand l'utilisateur
   dit « écris un courriel à propos de X » sans utiliser la slash command).
2. **`$ARGUMENTS`** — tout ce que l'utilisateur tape après la commande devient
   cette chaîne. Donc `/draft-email:draft thank my mentor` rend
   `$ARGUMENTS = "thank my mentor"`.
3. **Le corps** — des consignes en français (ou en anglais) ordinaires. Claude
   les suit. Ce n'est pas du code, c'est de l'orientation.

## When to use vs alternatives

| Utilise un skill quand… | N'utilise pas un skill quand… |
|---|---|
| Tu te surprends à retaper la même invite ou le même type d'invite. | La tâche est vraiment unique. |
| Tu veux un contrat stable : même entrée → sortie similaire. | Le travail demande de la vraie I/O (utilise alors un outil MCP). |
| Les consignes tiennent à l'aise dans du markdown. | Le « skill » serait une seule ligne (« sois poli ») ; dis-le, c'est tout. |

Les skills face aux alternatives :

- **vs CLAUDE.md** — CLAUDE.md, c'est du contexte « toujours chargé » à
  l'échelle du projet. Les skills, c'est « chargé sur invocation ». Utilise
  CLAUDE.md pour les faits sur le projet. Utilise les skills pour les flux de
  travail répétables. (Concept complet :
  `/showcase-tour:explain claude-md-and-rules`.)
- **vs sous-agents** — Les sous-agents s'exécutent dans une fenêtre de contexte
  *séparée*. Utilise des sous-agents quand tu veux que le travail soit isolé.
  Utilise des skills quand tu le veux en ligne dans la conversation principale
  de l'utilisateur.
- **vs outils MCP** — Les outils MCP appellent du code. Les skills sont des
  invites. Utilise les outils MCP quand tu as besoin de vraie I/O (publier sur
  LinkedIn, générer une image, interroger une base de données). Utilise les
  skills quand des consignes en texte suffisent.

## Try this

1. Lance `/showcase-tour:inspect plugins/draft-email/skills/draft/SKILL.md`
   pour parcourir ce skill ligne par ligne avec des annotations.
2. Ensuite, lance `/showcase-tour:explain plugins` pour apprendre ce qui
   enveloppe un skill pour la distribution.
