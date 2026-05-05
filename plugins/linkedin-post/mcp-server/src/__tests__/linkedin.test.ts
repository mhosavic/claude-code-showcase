import { describe, expect, it } from "vitest";
import {
  postLinkedinDraft,
  postLinkedinDraftInputSchema,
} from "../tools/linkedin.js";
import type { ServerConfig } from "../auth.js";

const mockConfig: ServerConfig = {
  mockMode: true,
  openaiApiKey: undefined,
  linkedinAccessToken: undefined,
  linkedinPersonUrn: undefined,
};

const realConfigNoToken: ServerConfig = {
  mockMode: false,
  openaiApiKey: "ignored-here",
  linkedinAccessToken: undefined,
  linkedinPersonUrn: "urn:li:person:abc",
};

const realConfigNoUrn: ServerConfig = {
  mockMode: false,
  openaiApiKey: "ignored-here",
  linkedinAccessToken: "fake-token",
  linkedinPersonUrn: undefined,
};

describe("postLinkedinDraft — mock mode", () => {
  it("returns a mock URN and never hits LinkedIn", async () => {
    const input = postLinkedinDraftInputSchema.parse({
      text: "Excited to share that we just shipped...",
    });
    const result = await postLinkedinDraft(input, mockConfig);

    expect(result.mocked).toBe(true);
    expect(result.draft_urn).toMatch(/^urn:li:share:mock-/);
    expect(result.has_image).toBe(false);
    expect(result.preview_text).toBe("Excited to share that we just shipped...");
    expect(result.finalize_url).toMatch(/mock — nothing posted/);
  });

  it("flags has_image when an image_url is provided", async () => {
    const input = postLinkedinDraftInputSchema.parse({
      text: "with an image attached",
      image_url: "https://example.com/img.png",
    });
    const result = await postLinkedinDraft(input, mockConfig);

    expect(result.has_image).toBe(true);
  });

  it("defaults visibility to PUBLIC", async () => {
    const input = postLinkedinDraftInputSchema.parse({ text: "hello" });
    const result = await postLinkedinDraft(input, mockConfig);
    expect(result.visibility).toBe("PUBLIC");
  });

  it("respects an explicit CONNECTIONS visibility", async () => {
    const input = postLinkedinDraftInputSchema.parse({
      text: "hello",
      visibility: "CONNECTIONS",
    });
    const result = await postLinkedinDraft(input, mockConfig);
    expect(result.visibility).toBe("CONNECTIONS");
  });
});

describe("postLinkedinDraft — real mode missing creds", () => {
  it("requires LINKEDIN_ACCESS_TOKEN", async () => {
    const input = postLinkedinDraftInputSchema.parse({ text: "hello" });
    await expect(postLinkedinDraft(input, realConfigNoToken)).rejects.toThrowError(
      /Missing LINKEDIN_ACCESS_TOKEN/,
    );
  });

  it("requires LINKEDIN_PERSON_URN", async () => {
    const input = postLinkedinDraftInputSchema.parse({ text: "hello" });
    await expect(postLinkedinDraft(input, realConfigNoUrn)).rejects.toThrowError(
      /Missing LINKEDIN_PERSON_URN/,
    );
  });
});

describe("postLinkedinDraft — schema validation", () => {
  it("rejects empty text", () => {
    expect(() => postLinkedinDraftInputSchema.parse({ text: "" })).toThrow();
  });

  it("rejects text longer than 3000 chars (LinkedIn's hard limit)", () => {
    expect(() =>
      postLinkedinDraftInputSchema.parse({ text: "a".repeat(3001) }),
    ).toThrow();
  });

  it("rejects non-URL image_url values", () => {
    expect(() =>
      postLinkedinDraftInputSchema.parse({
        text: "hello",
        image_url: "not a url",
      }),
    ).toThrow();
  });

  it("rejects unknown visibility values", () => {
    expect(() =>
      postLinkedinDraftInputSchema.parse({
        text: "hello",
        visibility: "PRIVATE",
      }),
    ).toThrow();
  });
});
