import type { ContentKind, ParsedContentPath } from "./paths.js";
import { parseContentPath } from "./paths.js";

/**
 * Content-root-relative file for an entity. No filesystem access.
 * Page copy is one file per page slug (`page:projects.title` → `page-copy/projects.yaml`).
 * Profile is a singleton. Sites may override a kind's rule.
 */
export type CollectionFileRule = {
  dir: string;
  ext: string;
  singleton?: string;
};

export const DEFAULT_CONTENT_FILES: Record<ContentKind, CollectionFileRule> = {
  work: { dir: "work", ext: ".md" },
  writing: { dir: "writing", ext: ".md" },
  record: { dir: "records", ext: ".md" },
  profile: { dir: "profile", ext: ".yaml", singleton: "profile.yaml" },
  page: { dir: "page-copy", ext: ".yaml" },
  archive: { dir: "archive", ext: ".md" },
};

const SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

function safeSlug(raw: string): string | null {
  return SLUG.test(raw) ? raw : null;
}

function pageSlug(parsed: ParsedContentPath): string | null {
  const raw = parsed.id !== "_" ? parsed.id : (parsed.field.split(".")[0] ?? "");
  return safeSlug(raw);
}

export function contentFileForPath(
  raw: string,
  rules: Partial<Record<ContentKind, CollectionFileRule>> = {},
): string | null {
  const parsed = parseContentPath(raw);
  if (!parsed) return null;
  const rule = { ...DEFAULT_CONTENT_FILES[parsed.kind], ...rules[parsed.kind] };
  if (rule.singleton) {
    const file = safeSlug(rule.singleton.replace(/\.[^.]+$/, ""));
    if (!file) return null;
    return `${rule.dir}/${rule.singleton}`;
  }
  const slug =
    parsed.kind === "page" ? pageSlug(parsed) : parsed.id === "_" ? null : safeSlug(parsed.id);
  if (!slug) return null;
  return `${rule.dir}/${slug}${rule.ext}`;
}
