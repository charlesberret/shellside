import type { ContentKind, ParsedContentPath } from "./paths.js";
import { parseContentPath } from "./paths.js";

/**
 * Content-root-relative file for an entity. No filesystem access.
 *
 * Default layout is the marquee's: one Markdown file per work item, a single
 * YAML list per writing/records collection, single root files for
 * profile/page-copy, and archive sub-documents as `<which>.yaml`. Sites with
 * per-entry writing/records files may inject rules.
 */
export type CollectionFileRule =
  | { file: string }
  | { dir: string; ext: string };

export const DEFAULT_CONTENT_FILES: Record<ContentKind, CollectionFileRule> = {
  work: { dir: "work", ext: ".md" },
  writing: { file: "writing.yaml" },
  record: { file: "records.yaml" },
  profile: { file: "profile.yaml" },
  page: { file: "page-copy.yaml" },
  archive: { dir: "", ext: ".yaml" },
};

const SLUG = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function safeSlug(raw: string): string | null {
  return SLUG.test(raw) && !raw.includes("..") ? raw : null;
}

export function contentFileForPath(
  raw: string,
  rules: Partial<Record<ContentKind, CollectionFileRule>> = {},
): string | null {
  const parsed = parseContentPath(raw);
  if (!parsed) return null;
  const rule = rules[parsed.kind] ?? DEFAULT_CONTENT_FILES[parsed.kind];
  if ("file" in rule) return rule.file;
  // Singleton kinds carry no id; a per-page layout keys on the field's first
  // segment (`page:projects.title` → page-copy/projects.yaml).
  const entity =
    parsed.id === "_"
      ? (parsed.field.split(".")[0] ?? "")
      : parsed.id;
  const slug = safeSlug(entity);
  if (!slug) return null;
  return rule.dir ? `${rule.dir}/${slug}${rule.ext}` : `${slug}${rule.ext}`;
}

export { type ParsedContentPath };
