import { filterByVisibility, type VisibilityFields } from "@shellside/content-model";

export type Listed = {
  id: string;
  data: VisibilityFields & {
    title?: string;
    summary?: string;
    status?: string | null;
    kind?: string;
    org?: string;
    dates?: string;
    date?: string;
    venue?: string;
    year?: string | number;
    type?: string;
  };
};

export function entryId(entry: { id: string }): string {
  return entry.id.replace(/\.(md|mdx|markdown|ya?ml)$/i, "");
}

export function publicEntries<T extends { data?: VisibilityFields }>(items: readonly T[]): T[] {
  return filterByVisibility(items, { includeDrafts: false });
}

export function byTitle<T extends Listed>(items: readonly T[]): T[] {
  return [...items].sort((a, b) =>
    (a.data.title || a.id).localeCompare(b.data.title || b.id, "en"),
  );
}
