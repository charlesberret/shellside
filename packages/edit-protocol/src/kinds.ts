import { linkLeafFromPath, parseContentPath } from "./paths.js";

/** Live-edit field kinds. Sites may subdivide scalar further. */
export type EditFieldKind = "scalar" | "tags" | "link" | "visibility" | "body";

export function isTagsField(field: string): boolean {
  return field === "tags" || /^tags\.\d+$/.test(field);
}

export function linkIndexFromPath(raw: string): number | null {
  const m = String(raw).match(/:links\.(\d+)\.(?:label|href|description)$/i);
  return m ? Number(m[1]) : null;
}

/**
 * Classify a path the way the editorial desk does:
 * link leaf, tags, visibility, long body, otherwise scalar.
 */
export function fieldKindFromPath(raw: string): EditFieldKind | null {
  const parsed = parseContentPath(raw);
  if (!parsed) return null;
  if (linkLeafFromPath(raw)) return "link";
  if (isTagsField(parsed.field)) return "tags";
  if (parsed.field === "visibility") return "visibility";
  if (parsed.field === "body" || parsed.field === "longBio") return "body";
  return "scalar";
}
