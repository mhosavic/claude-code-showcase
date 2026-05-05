// generate_image tool — calls OpenAI gpt-image-1 in real mode, returns a
// canned placeholder in mock mode.

import { z } from "zod";
import type { ServerConfig } from "../auth.js";
import { requireCredential } from "../auth.js";

export const generateImageInputSchema = z.object({
  prompt: z
    .string()
    .min(5)
    .describe(
      "Visual description of the image. Be specific — 'a minimal home office at golden hour' beats 'an office'.",
    ),
  size: z
    .enum(["1024x1024", "1024x1536", "1536x1024"])
    .default("1024x1024")
    .describe("Output dimensions. 1024x1024 is right for LinkedIn posts."),
  quality: z
    .enum(["low", "medium", "high"])
    .default("medium")
    .describe("Trade-off between cost and polish. medium is a sane default."),
});

export type GenerateImageInput = z.infer<typeof generateImageInputSchema>;

export interface GenerateImageResult {
  url: string;
  mocked: boolean;
  prompt_used: string;
  size: string;
  quality: string;
  cost_usd_estimate: number;
}

const COST_USD: Record<string, number> = {
  low: 0.02,
  medium: 0.07,
  high: 0.19,
};

export async function generateImage(
  input: GenerateImageInput,
  config: ServerConfig,
): Promise<GenerateImageResult> {
  if (config.mockMode) {
    return mockResult(input);
  }

  const apiKey = requireCredential(
    config.openaiApiKey,
    "OPENAI_API_KEY",
    "Set it via /plugin → linkedin-post → Configure",
  );

  // OpenAI gpt-image-1 endpoint. See:
  // https://developers.openai.com/api/docs/guides/image-generation
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: input.prompt,
      size: input.size,
      quality: input.quality,
      n: 1,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenAI image generation failed: ${response.status} ${response.statusText} — ${body.slice(0, 500)}`,
    );
  }

  const data = (await response.json()) as {
    data: Array<{ url?: string; b64_json?: string }>;
  };
  const first = data.data?.[0];
  if (!first) {
    throw new Error("OpenAI returned no image. Try a different prompt.");
  }

  // gpt-image-1 returns either a URL or base64 depending on response_format.
  // We default to URL. If we ever need b64, wrap as data URI here.
  const url =
    first.url ??
    (first.b64_json
      ? `data:image/png;base64,${first.b64_json.slice(0, 64)}…[truncated]`
      : "");
  if (!url) {
    throw new Error("OpenAI response had no usable image data.");
  }

  return {
    url,
    mocked: false,
    prompt_used: input.prompt,
    size: input.size,
    quality: input.quality,
    cost_usd_estimate: COST_USD[input.quality] ?? 0,
  };
}

function mockResult(input: GenerateImageInput): GenerateImageResult {
  // Deterministic placeholder URL keyed off the prompt so the same prompt
  // returns the same "image" within a session. Nothing is actually generated.
  const slug = input.prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return {
    url: `https://example.com/mock-image/${slug || "image"}.png`,
    mocked: true,
    prompt_used: input.prompt,
    size: input.size,
    quality: input.quality,
    cost_usd_estimate: 0,
  };
}
