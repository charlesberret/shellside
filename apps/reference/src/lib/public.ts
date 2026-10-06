import { filterByVisibility, type VisibilityFields } from "@shellside/content-model";

export type Listed = {
  id: string;
  data: VisibilityFields & {
    title?: string | number;
    summary?: string | number;
    status?: string | null;
    kind?: string | number;
    org?: string | number;
    dates?: string | number;
    date?: string | number;
    venue?: string | number;
    year?: string | number;
    type?: string | number;
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
    String(a.data.title || a.id).localeCompare(String(b.data.title || b.id), "en"),
  );
}
