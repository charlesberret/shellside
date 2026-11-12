/**
 * Reference write policy for the dev desk (`site.config` → `edit.policy`).
 * Same shape the marquee supplies inline — allowlist, list joins, the
 * cv/resume archive resolver — so the reference proves the contract a
 * real site declares.
 */
import type { EditAllowlist, EditorFiles } from "@shellside/dev-api";

export const allowlist: EditAllowlist = {
  work: ["title", "summary", "visibility", "body", "tags", "links", /^links\.\d+/],
  writing: [
    "title",
    "subtitle",
    "venue",
    "type",
    "year",
    "byline",
    "summary",
    "visibility",
    /^links\./,
  ],
  record: [
    "title",
    "section",
    "date",
    "type",
    "role",
    "synopsis",
    "visibility",
    /^links\./,
  ],
  profile: ["name", "tagline", "roles", "funding", "formerly", /^experience\.\d+\./],
  page: [/^(portfolio|nav|about)\./],
};

export const profileListJoins = { roles: " · ", funding: "; " };

export const archiveKinds = ["cv", "resume"] as const;

export const files: Partial<EditorFiles> = {
  archive: (which) =>
    which === "cv" || which === "resume"
      ? { file: `${which}.yaml`, header: `# ${which}\n` }
      : null,
};
