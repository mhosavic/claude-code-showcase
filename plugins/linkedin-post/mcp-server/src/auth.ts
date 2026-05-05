// Credential and mode helpers for the linkedin-post MCP server.
//
// The server reads everything from environment variables. The plugin's
// `mcpServers` block in plugin.json injects these from the user's
// `userConfig` answers, so the server itself never sees the keychain.

export interface ServerConfig {
  mockMode: boolean;
  openaiApiKey: string | undefined;
  linkedinAccessToken: string | undefined;
  linkedinPersonUrn: string | undefined;
}

export function loadConfig(): ServerConfig {
  // MOCK_MODE arrives as a string ("true"/"false"). Default to true if unset
  // so that a fresh install never accidentally hits real APIs.
  const mockRaw = (process.env.MOCK_MODE ?? "true").trim().toLowerCase();
  const mockMode = mockRaw !== "false" && mockRaw !== "0";

  return {
    mockMode,
    openaiApiKey: emptyToUndef(process.env.OPENAI_API_KEY),
    linkedinAccessToken: emptyToUndef(process.env.LINKEDIN_ACCESS_TOKEN),
    linkedinPersonUrn: emptyToUndef(process.env.LINKEDIN_PERSON_URN),
  };
}

function emptyToUndef(v: string | undefined): string | undefined {
  if (v === undefined) return undefined;
  const trimmed = v.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

/**
 * Throw a clear error if a tool needs a credential that wasn't provided.
 * The MCP SDK surfaces these as tool errors back to Claude, which makes
 * them visible to the user in the conversation.
 */
export function requireCredential(
  value: string | undefined,
  name: string,
  hint: string,
): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. ${hint} (or leave MOCK_MODE=true to keep using mock responses).`,
    );
  }
  return value;
}
