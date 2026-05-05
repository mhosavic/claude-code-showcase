// MCP "prompt" — exposed as a slash command.
//
// Once registered, users can invoke it via:
//   /mcp__linkedin-post__compose_post <topic>
//
// MCP prompts are different from MCP tools: they don't *do* anything, they
// just inject a templated prompt into the conversation. Use them when you
// want a reusable "starting context" that the user (or Claude) parameterizes.

import { z } from "zod";

export const composePostArgsSchema = {
  topic: z
    .string()
    .min(3)
    .describe("The thing you want to post about, in 1-2 short phrases."),
  audience: z
    .enum(["customers", "peers", "candidates", "investors", "general"])
    .default("general")
    .describe("Who you're writing for. Affects tone and call-to-action."),
};

interface ComposePostArgs {
  topic: string;
  audience?: "customers" | "peers" | "candidates" | "investors" | "general";
}

export function composePostHandler(args: ComposePostArgs) {
  const audience = args.audience ?? "general";
  const audienceGuidance = audienceGuide[audience];

  return {
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: [
            `Write a LinkedIn post about: **${args.topic}**`,
            "",
            `Audience: ${audience}.`,
            audienceGuidance,
            "",
            "Style requirements:",
            "- ~150 words.",
            "- First line is a hook that makes someone stop scrolling.",
            "- Concrete specifics over generic platitudes.",
            "- Line break every 1-2 sentences (no walls of text).",
            "- One soft call-to-action at the end matching the audience.",
            "- Zero emojis unless the audience truly expects them.",
            "- No hashtag overload — 0-3 max, only if genuinely useful.",
            "",
            "If you don't have enough information about the topic to write",
            "something specific (a number, a name, a story), ask the user",
            "one targeted question first. Don't paper over with generic copy.",
          ].join("\n"),
        },
      },
    ],
  };
}

const audienceGuide: Record<string, string> = {
  customers:
    "Write to people who could buy or already have. Lead with their problem, not your product.",
  peers:
    "Write to other practitioners in your field. They want concrete details and lessons learned.",
  candidates:
    "Write to people you'd want to hire. Show what working there is actually like, not corporate gloss.",
  investors:
    "Write to people who fund companies like yours. Lead with traction, then thesis.",
  general:
    "Write for a mixed audience. Default to a polished-professional tone with one personal touch.",
};
