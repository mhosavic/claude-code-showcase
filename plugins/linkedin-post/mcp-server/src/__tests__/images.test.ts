import { describe, expect, it } from "vitest";
import {
  generateImage,
  generateImageInputSchema,
} from "../tools/images.js";
import type { ServerConfig } from "../auth.js";

const mockConfig: ServerConfig = {
  mockMode: true,
  openaiApiKey: undefined,
  linkedinAccessToken: undefined,
  linkedinPersonUrn: undefined,
};

const realConfigNoKey: ServerConfig = {
  mockMode: false,
  openaiApiKey: undefined,
  linkedinAccessToken: undefined,
  linkedinPersonUrn: undefined,
};

describe("generateImage — mock mode", () => {
  it("returns a deterministic mock URL keyed off the prompt", async () => {
    const input = generateImageInputSchema.parse({
      prompt: "a minimal home office at golden hour",
    });
    const result = await generateImage(input, mockConfig);

    expect(result.mocked).toBe(true);
    expect(result.url).toBe(
      "https://example.com/mock-image/a-minimal-home-office-at-golden-hour.png",
    );
    expect(result.prompt_used).toBe("a minimal home office at golden hour");
    expect(result.cost_usd_estimate).toBe(0);
  });

  it("applies size and quality defaults when not specified", async () => {
    const input = generateImageInputSchema.parse({ prompt: "a cat in a hat" });
    const result = await generateImage(input, mockConfig);

    expect(result.size).toBe("1024x1024");
    expect(result.quality).toBe("medium");
  });

  it("does not invoke fetch in mock mode (no creds required)", async () => {
    // If fetch were called, the lack of creds + lack of network would surface
    // as an error. Mock-mode must short-circuit before any of that.
    const input = generateImageInputSchema.parse({ prompt: "anything goes" });
    await expect(generateImage(input, mockConfig)).resolves.toBeDefined();
  });
});

describe("generateImage — real mode", () => {
  it("throws a user-actionable error when OPENAI_API_KEY is missing", async () => {
    const input = generateImageInputSchema.parse({ prompt: "test prompt" });
    await expect(generateImage(input, realConfigNoKey)).rejects.toThrowError(
      /Missing OPENAI_API_KEY/,
    );
  });
});

describe("generateImage — schema validation", () => {
  it("rejects prompts shorter than 5 characters", () => {
    expect(() => generateImageInputSchema.parse({ prompt: "hi" })).toThrow();
  });

  it("rejects unknown size values", () => {
    expect(() =>
      generateImageInputSchema.parse({
        prompt: "a valid prompt here",
        size: "9999x9999",
      }),
    ).toThrow();
  });

  it("rejects unknown quality values", () => {
    expect(() =>
      generateImageInputSchema.parse({
        prompt: "a valid prompt here",
        quality: "ultra",
      }),
    ).toThrow();
  });
});
