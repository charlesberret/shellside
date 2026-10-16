/** Shared listing helpers for host pages (same filter as every surface). */
import { filterByVisibility, type VisibilityFields } from "@shellside/content-model";

export type Listed = {
  id: string;
  body?: string;
  data?: (VisibilityFields & Record<string, unknown>) | undefined;
};

export function entryId(entry: { id: string }): string {
  return entry.id.replace(/\.(md|mdx|markdown|ya?ml)$/i, "");
}

export function publicEntries<T extends { data?: VisibilityFields }>(items: readonly T[]): T[] {
  return filterByVisibility(items, { includeDrafts: false });
}

export function byTitle<T extends Listed>(items: readonly T[]): T[] {
  return [...items].sort((a, b) =>
    (String(a.data?.title || a.id)).localeCompare(String(b.data?.title || b.id), "en"),
  );
}
