/**
 * data-edit path grammar for shellside sites.
 *
 * Examples:
 *   work:kettle:title
 *   work:kettle:links.0.href
 *   writing:foo:year
 *   record:launch-x:summary
 *   profile:name
 *   page:projects.title
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
  id: string;
  /** Field path after kind:id:  e.g. title, links.0.label, longBio */
  field: string;
  raw: string;
};

const KIND_RE = /^(work|writing|record|profile|page|archive):/;

export function parseContentPath(raw: string): ParsedContentPath | null {
  const s = String(raw || "").trim();
  if (!s || s.length > 300) return null;
  const m = s.match(/^(work|writing|record|profile|page|archive):([^:]+):(.+)$/);
  if (m) {
    return {
      kind: m[1] as ContentKind,
      id: m[2]!,
      field: m[3]!,
      raw: s,
    };
  }
  // profile:name (two-segment singleton fields)
  const m2 = s.match(/^(profile|page):([^:]+)$/);
  if (m2) {
    return {
      kind: m2[1] as ContentKind,
      id: "_",
      field: m2[2]!,
      raw: s,
    };
  }
  if (KIND_RE.test(s)) return null;
  return null;
}

/** Structural allowlist — sites may tighten further. */
export function isWellFormedEditPath(raw: string): boolean {
  return parseContentPath(raw) != null;
}

export function linkLeafFromPath(raw: string): "label" | "href" | "description" | null {
  const m = String(raw).match(/:links\.\d+\.(label|href|description)$/i);
  return m ? (m[1]!.toLowerCase() as "label" | "href" | "description") : null;
}
