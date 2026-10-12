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

/** Writing links are a keyed map (links.html|pdf|arxiv|doi), not an array. */
export type DeskEditKind = "text" | "tags" | "link" | "links" | "writing-link";

export type EditKindInfo = {
  editKind: DeskEditKind;
  linkIndex?: number;
  linkKey?: string;
};

/**
 * Classify a path the way the editorial desk does: whole links list,
 * single array link, keyed writing link, tags, otherwise text.
 */
export function editKindFromPath(raw: string): EditKindInfo {
  const parsed = parseContentPath(raw);
  if (!parsed) return { editKind: "text" };
  if (parsed.kind === "work" && parsed.field === "tags") return { editKind: "tags" };
  if ((parsed.kind === "work" || parsed.kind === "record") && parsed.field === "links") {
    return { editKind: "links" };
  }
  const linkM = parsed.field.match(/^links\.(\d+)(?:\.(label|href|description|kind))?$/);
  if ((parsed.kind === "work" || parsed.kind === "record") && linkM) {
    return { editKind: "link", linkIndex: Number(linkM[1]) };
  }
  const wLink = parsed.field.match(/^links\.(html|pdf|arxiv|doi)$/);
  if (parsed.kind === "writing" && wLink) {
    return { editKind: "writing-link", linkKey: wLink[1] };
  }
  return { editKind: "text" };
}
