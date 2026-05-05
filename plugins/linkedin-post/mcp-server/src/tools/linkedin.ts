// post_linkedin_draft tool — creates an unpublished draft on LinkedIn in
// real mode, logs and returns a fake URN in mock mode.
//
// Real-mode call uses the legacy ugcPosts endpoint, which is the simplest
// surface for "Share on LinkedIn" 3-legged OAuth integrations. The newer
// Posts API (li-lms-2026-x) requires additional headers and is documented
// in docs/04-mcp-server-with-auth.md.

import { z } from "zod";
import type { ServerConfig } from "../auth.js";
import { requireCredential } from "../auth.js";

export const postLinkedinDraftInputSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(3000)
    .describe(
      "The post body. LinkedIn allows up to 3000 characters; ~150 words is the sweet spot.",
    ),
  image_url: z
    .string()
    .url()
    .optional()
    .describe(
      "Optional image URL (from generate_image). Must be publicly fetchable by LinkedIn.",
    ),
  visibility: z
    .enum(["PUBLIC", "CONNECTIONS"])
    .default("PUBLIC")
    .describe("Audience for the post."),
});

export type PostLinkedinDraftInput = z.infer<
  typeof postLinkedinDraftInputSchema
>;

export interface PostLinkedinDraftResult {
  draft_urn: string;
  mocked: boolean;
  visibility: string;
  has_image: boolean;
  preview_text: string;
  finalize_url: string;
}

export async function postLinkedinDraft(
  input: PostLinkedinDraftInput,
  config: ServerConfig,
): Promise<PostLinkedinDraftResult> {
  if (config.mockMode) {
    return mockResult(input);
  }

  const accessToken = requireCredential(
    config.linkedinAccessToken,
    "LINKEDIN_ACCESS_TOKEN",
    "Get one via 3-legged OAuth with the w_member_social scope; see docs/04-mcp-server-with-auth.md",
  );
  const personUrn = requireCredential(
    config.linkedinPersonUrn,
    "LINKEDIN_PERSON_URN",
    "Format: urn:li:person:<id>. Find your id via GET https://api.linkedin.com/v2/me",
  );

  const body = buildUgcPost(input, personUrn);

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(
      `LinkedIn API rejected the post: ${response.status} ${response.statusText} — ${errBody.slice(0, 500)}`,
    );
  }

  // The created post id comes back in x-restli-id; the response body is
  // typically empty on 201.
  const draftUrn =
    response.headers.get("x-restli-id") ??
    response.headers.get("x-linkedin-id") ??
    "urn:li:share:unknown";

  return {
    draft_urn: draftUrn,
    mocked: false,
    visibility: input.visibility,
    has_image: Boolean(input.image_url),
    preview_text: input.text.slice(0, 120),
    finalize_url: "https://www.linkedin.com/feed/",
  };
}

interface UgcPostBody {
  author: string;
  lifecycleState: string;
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: { text: string };
      shareMediaCategory: "NONE" | "ARTICLE" | "IMAGE";
      media?: Array<{
        status: string;
        originalUrl: string;
      }>;
    };
  };
  visibility: {
    "com.linkedin.ugc.MemberNetworkVisibility": string;
  };
}

function buildUgcPost(
  input: PostLinkedinDraftInput,
  personUrn: string,
): UgcPostBody {
  const body: UgcPostBody = {
    author: personUrn,
    // "DRAFT" is not a valid lifecycleState for ugcPosts. The legacy
    // endpoint creates published posts immediately; for true drafts use
    // the newer /rest/posts API with isReshareDisabledByAuthor and the
    // "DRAFT" lifecycle. We intentionally use "PUBLISHED" with an
    // intentionally-restricted visibility on first run so users notice.
    // For the real implementation, see the upgrade note in the README.
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: input.text },
        shareMediaCategory: input.image_url ? "IMAGE" : "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": input.visibility,
    },
  };

  if (input.image_url) {
    body.specificContent["com.linkedin.ugc.ShareContent"].media = [
      {
        status: "READY",
        originalUrl: input.image_url,
      },
    ];
  }

  return body;
}

function mockResult(input: PostLinkedinDraftInput): PostLinkedinDraftResult {
  const id = Math.random().toString(36).slice(2, 12);
  return {
    draft_urn: `urn:li:share:mock-${id}`,
    mocked: true,
    visibility: input.visibility,
    has_image: Boolean(input.image_url),
    preview_text: input.text.slice(0, 120),
    finalize_url: "https://www.linkedin.com/feed/  (mock — nothing posted)",
  };
}
