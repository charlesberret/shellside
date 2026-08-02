/**
 * Visibility is orthogonal to lifecycle/status (current, complete, forthcoming, …).
 *
 * @see docs/VISIBILITY.md
 */

export const VISIBILITY_VALUES = ["draft", "published"] as const;
export type Visibility = (typeof VISIBILITY_VALUES)[number];

export type VisibilityFields = {
  visibility?: Visibility | string | null;
};

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

export function isDraftItem(item: { data?: VisibilityFields } | VisibilityFields): boolean {
  const data = "data" in item && item.data ? item.data : (item as VisibilityFields);
  return normalizeVisibility(data.visibility) === "draft";
}

/** Public surfaces + production build. */
export function isPublicItem(item: { data?: VisibilityFields } | VisibilityFields): boolean {
  return !isDraftItem(item);
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
