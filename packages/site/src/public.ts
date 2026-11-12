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

/** Meta line shared by console + detail surfaces: `kind · org · dates · venue · role · year · date`. */
export function entryMeta(data: Record<string, unknown>): string {
  return [data.kind, data.org, data.dates, data.venue, data.role, data.year, data.date]
    .filter((p) => p != null && p !== "")
    .join(" · ");
}

/**
 * `links` arrives as an array `{label, href}[]` or a map `{html: url, pdf: url}`.
 * Both become `{label, href}[]` for rendering.
 */
export function entryLinks(raw: unknown): { label: string; href: string }[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((l): l is { label?: string; href?: string } => l != null && typeof l === "object")
      .map((l) => ({ label: String(l.label ?? l.href ?? "link"), href: String(l.href ?? "") }))
      .filter((l) => l.href !== "");
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, href]) => href != null && href !== "")
      .map(([label, href]) => ({ label, href: String(href) }));
  }
  return [];
}
