// MCP "resource" — exposed as @-mentionable content.
//
// Once registered, users can pull the content into a conversation by
// typing @ in Claude Code and picking it from the menu. The URI shape is
// arbitrary; we use a `team-style://` scheme so it's clearly internal.
//
// Resources are right when you have reference content that lives "with"
// the MCP server (style guides, schemas, internal docs) and you want
// users to reference it without copy-pasting.

export const STYLE_GUIDE_URI = "team-style://linkedin/voice";

const STYLE_GUIDE_TEXT = `# Team voice — LinkedIn

This is the style guide for posts published from this account. Apply it
when drafting any LinkedIn content.

## Tone

- **Confident, not boastful.** State what we did, not how impressive it is.
- **Specific, not generic.** Names, numbers, and dates beat adjectives.
- **Warm, not cold.** Industry posts can still sound like a person wrote them.

## Structure

- **Hook in the first line.** A specific concrete statement, ideally a
  number or a small contradiction. NOT "Excited to share…".
- **2-3 short paragraphs.** Each paragraph is 1-3 lines.
- **Soft CTA at the end.** A question, an invitation to share experience,
  or a link with one line of context. Never "click here".
- **Length: 100-180 words.** Longer if a thread, never longer for a single post.

## Forbidden phrases

These get auto-rejected in the draft step:

- "Excited to share…"
- "Thrilled to announce…"
- "Humbled to…"
- "I'm pleased to…"
- Any sentence starting with "In today's fast-paced world,"
- Buzzword stacks: "AI-powered", "next-gen", "revolutionary", "game-changing"

If the topic genuinely calls for excitement, show it through specifics:
"We hit 1,000 paying customers" is more exciting than "Excited to share that
we hit a milestone."

## Hashtags

- **Default: zero hashtags.**
- If the post is about a specific community (e.g. #DevOps, #ProductLed) and
  using the tag legitimately surfaces it to that community, use 1-2 max.
- Never more than 3.

## Things we never post

- Vague aspirational quotes with our logo on them.
- Reposts of someone else's content with no added context.
- Anything we wouldn't put in writing to a customer.

## Author voice

When writing as a specific team member, match their existing posts:

- **Francis (founder):** plain-spoken, occasional dry humor, leads with
  customer stories.
- **CTO posts:** technical specifics first, narrative second.
- **Marketing-led posts:** customer voice quoted directly when possible;
  avoid first-person plural ("we") more than twice.
`;

export interface StyleGuideResource {
  uri: string;
  description: string;
  mimeType: string;
  text: string;
}

export const STYLE_GUIDE: StyleGuideResource = {
  uri: STYLE_GUIDE_URI,
  description:
    "Team's LinkedIn voice and style guide. Reference with @team-style: in Claude Code to pull it into context.",
  mimeType: "text/markdown",
  text: STYLE_GUIDE_TEXT,
};
