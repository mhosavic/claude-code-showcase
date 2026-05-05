import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig, requireCredential } from "../auth.js";

describe("auth.loadConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.MOCK_MODE;
    delete process.env.OPENAI_API_KEY;
    delete process.env.LINKEDIN_ACCESS_TOKEN;
    delete process.env.LINKEDIN_PERSON_URN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("defaults mockMode to true when MOCK_MODE is unset", () => {
    expect(loadConfig().mockMode).toBe(true);
  });

  it("treats MOCK_MODE=false (any case) as real mode", () => {
    process.env.MOCK_MODE = "FALSE";
    expect(loadConfig().mockMode).toBe(false);
  });

  it("treats MOCK_MODE=0 as real mode", () => {
    process.env.MOCK_MODE = "0";
    expect(loadConfig().mockMode).toBe(false);
  });

  it("treats anything else (including 'yes', '1', 'true') as mock mode", () => {
    process.env.MOCK_MODE = "true";
    expect(loadConfig().mockMode).toBe(true);
    process.env.MOCK_MODE = "1";
    expect(loadConfig().mockMode).toBe(true);
    process.env.MOCK_MODE = "anything";
    expect(loadConfig().mockMode).toBe(true);
  });

  it("trims whitespace and treats empty credentials as undefined", () => {
    process.env.OPENAI_API_KEY = "   ";
    process.env.LINKEDIN_ACCESS_TOKEN = "";
    expect(loadConfig().openaiApiKey).toBeUndefined();
    expect(loadConfig().linkedinAccessToken).toBeUndefined();
  });

  it("passes through real credential strings (trimmed)", () => {
    process.env.OPENAI_API_KEY = "  sk-test-123  ";
    process.env.LINKEDIN_PERSON_URN = "urn:li:person:abc";
    const cfg = loadConfig();
    expect(cfg.openaiApiKey).toBe("sk-test-123");
    expect(cfg.linkedinPersonUrn).toBe("urn:li:person:abc");
  });
});

describe("auth.requireCredential", () => {
  it("returns the value when present", () => {
    expect(requireCredential("token", "FOO", "hint")).toBe("token");
  });

  it("throws a user-actionable error when missing", () => {
    expect(() => requireCredential(undefined, "OPENAI_API_KEY", "Set via /plugin"))
      .toThrowError(/Missing OPENAI_API_KEY.*Set via \/plugin.*MOCK_MODE=true/);
  });
});
