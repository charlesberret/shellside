/**
 * Visibility is orthogonal to lifecycle/status (current, complete, forthcoming, …).
 *
 * @see docs/VISIBILITY.md
 */

export const VISIBILITY_VALUES = ["draft", "published"] as const;
export type Visibility = (typeof VISIBILITY_VALUES)[number];

export type VisibilityFields = {
  visibility?: Visibility | string | null;
  /**
   * Legacy editorial status. `draft` and `unpublished` hide an item only when
   * `visibility` is absent. An explicit visibility wins (including `published`).
   * `forthcoming` and work `current` / `complete` stay public.
   */
  status?: string | null;
};

const LEGACY_HIDDEN_STATUSES = new Set(["draft", "unpublished"]);

export type ContentListContext = {
  /**
   * When true (admin / DEV desk), drafts are included and rendered with the
   * same components as published items — not a separate wireframe list.
   */
  includeDrafts: boolean;
};

/** Missing or unknown → published (safe for existing content). */
export function normalizeVisibility(
  raw: VisibilityFields["visibility"],
): Visibility {
  if (raw === "draft") return "draft";
  return "published";
}

function readFields(item: { data?: VisibilityFields } | VisibilityFields): VisibilityFields {
  if (item && typeof item === "object" && "data" in item && item.data) return item.data;
  return item as VisibilityFields;
}

export function isDraftItem(item: { data?: VisibilityFields } | VisibilityFields): boolean {
  return normalizeVisibility(readFields(item).visibility) === "draft";
}

/** True for legacy `status: draft|unpublished` (not lifecycle values like `forthcoming`). */
export function isLegacyHiddenStatus(status: unknown): boolean {
  return typeof status === "string" && LEGACY_HIDDEN_STATUSES.has(status);
}

/**
 * Public surfaces + production build.
 * Visibility `draft` always hides. Legacy status hides only when visibility is absent.
 */
export function isPublicItem(item: { data?: VisibilityFields } | VisibilityFields): boolean {
  const data = readFields(item);
  if (normalizeVisibility(data.visibility) === "draft") return false;
  if ((data.visibility == null || data.visibility === "") && isLegacyHiddenStatus(data.status)) {
    return false;
  }
  return true;
}

/**
 * List filter for a render context.
 * Admin: includeDrafts true → full section structure with drafts in place.
 * Public: drafts omitted.
 */
export function filterByVisibility<T extends { data?: VisibilityFields }>(
  items: readonly T[],
  ctx: ContentListContext,
): T[] {
  if (ctx.includeDrafts) return [...items];
  return items.filter(isPublicItem);
}

/** Same filter as `filterByVisibility`. Name used by marquee call sites. */
export function listForContext<T extends { data?: VisibilityFields }>(
  items: readonly T[],
  ctx: ContentListContext,
): T[] {
  return filterByVisibility(items, ctx);
}

/**
 * DEV-only preview flag. Production (`dev: false`) never includes drafts,
 * even if the query string asks for them.
 */
export function contentContextFromSearch(
  search: string | URLSearchParams,
  opts: { dev: boolean },
): ContentListContext {
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;
  const flag = params.get("includeDrafts");
  const includeDrafts = opts.dev && (flag === "1" || flag === "true");
  return { includeDrafts };
}

/** Split for optional “Drafts” collator without removing in-section placement. */
export function partitionDrafts<T extends { data?: VisibilityFields }>(
  items: readonly T[],
): { published: T[]; drafts: T[] } {
  const published: T[] = [];
  const drafts: T[] = [];
  for (const item of items) {
    if (isDraftItem(item)) drafts.push(item);
    else published.push(item);
  }
  return { published, drafts };
}
