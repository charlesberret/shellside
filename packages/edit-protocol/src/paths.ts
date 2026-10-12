/**
 * data-edit path grammar for shellside sites.
 *
 * Examples:
 *   work:kettle:title
 *   work:kettle:links.0.href
 *   writing:foo:year
 *   record:launch-x:summary | records:launch-x:summary
 *   profile:name  |  profile:experience.0.note
 *   page:projects.title
 *   archive:cv:0.items.1   (archive id is the sub-document, e.g. cv | resume)
 *
 * profile and page are two-segment only: `profile:x:y` is rejected, since a
 * singleton collection has no id slot.
 */

export type ContentKind =
  | "work"
  | "writing"
  | "record"
  | "profile"
  | "page"
  | "archive";

export type ParsedContentPath = {
  kind: ContentKind;
  /** Entity id. "_" for profile/page; the sub-document name for archive. */
  id: string;
  /** Field path after kind:id:  e.g. title, links.0.label, longBio */
  field: string;
  raw: string;
};

const MAX_LEN = 200;
const SAFE_ID = /^[a-z0-9][a-z0-9._-]*$/i;
const SAFE_FIELD = /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/;

function safeId(id: string): boolean {
  return SAFE_ID.test(id);
}

function safeField(field: string): boolean {
  return SAFE_FIELD.test(field);
}

export function parseContentPath(raw: string): ParsedContentPath | null {
  const s = String(raw || "").trim();
  if (!s || s.length > MAX_LEN) return null;
  const parts = s.split(":");

  if (parts[0] === "profile" || parts[0] === "page") {
    if (parts.length !== 2) return null;
    const field = parts[1]!;
    if (!safeField(field)) return null;
    return { kind: parts[0] as ContentKind, id: "_", field, raw: s };
  }

  const kind =
    parts[0] === "records"
      ? "record"
      : (parts[0] as ContentKind | undefined);
  if (
    kind !== "work" &&
    kind !== "writing" &&
    kind !== "record" &&
    kind !== "archive"
  ) {
    return null;
  }
  if (parts.length < 3) return null;
  const id = parts[1]!;
  const field = parts.slice(2).join(":");
  if (!safeId(id) || !safeField(field)) return null;
  return { kind, id, field, raw: s };
}

/** Structural allowlist — sites may tighten further. */
export function isWellFormedEditPath(raw: string): boolean {
  return parseContentPath(raw) != null;
}

export function linkLeafFromPath(raw: string): "label" | "href" | "description" | null {
  const m = String(raw).match(/:links\.\d+\.(label|href|description)$/i);
  return m ? (m[1]!.toLowerCase() as "label" | "href" | "description") : null;
}
