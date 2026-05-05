---
name: draft
description: Draft a polite, well-structured email from a one-line description. Use when the user asks to write an email, draft a message, or compose a note to send.
argument-hint: <one-line description of what the email should say>
---

# Draft email

Write an email based on this brief: **$ARGUMENTS**

**Language.** Write the email in the language of the brief above. If
the brief is in French, the email body, subject, greeting, and
sign-off are all in French. Same for English. If the brief mixes
languages, default to whichever has more content.

## How to write it

1. **Pick a tone** that matches the brief.
   - Internal teammate or peer → friendly, direct, first-name basis.
   - Client or external partner → warm but professional, full sign-off.
   - Manager or executive → respectful, concise, lead with the ask.
   If the brief doesn't make the audience clear, ask one quick question before drafting.

2. **Structure the email** as:
   - **Subject line** — under 60 characters, action-oriented if there's an ask.
   - **Greeting** — match the tone you picked.
   - **Opening line** — one sentence stating why you're writing.
   - **Body** — 1–3 short paragraphs. Lead with the most important information.
   - **Call to action** — explicit. What do you want the recipient to do, and by when?
   - **Sign-off** — match the tone.

3. **Keep it short.** Most professional emails are best at 100–150 words. If the brief implies more nuance is needed, draft a longer version but flag it.

4. **Don't invent details** the user didn't give you (names, dates, numbers). If a detail is missing and matters, leave a `[bracketed placeholder]` rather than fabricating.

## Output format

Present the draft as:

```
Subject: <subject line>

<email body, including greeting and sign-off>
```

After the draft, add a one-line note flagging any placeholders the user needs to fill in, or any tone choice you made that they should confirm.

## Example

Brief: *let my landlord know I'll be 3 days late on rent because of a banking issue*

```
Subject: Rent payment will arrive 3 days late this month

Hi [Landlord's name],

I'm writing to let you know my rent payment will be 3 days late this month. My bank flagged a transfer for review, and the funds won't clear until [expected date].

I'll send the full amount as soon as it clears, and I appreciate your patience. Let me know if you'd like me to send a confirmation once it's on its way.

Thanks,
[Your name]
```

*Placeholders to fill: landlord's name, expected clearance date, your name.*
