/**
 * Admin-preview URL flag shared by the desk and the site.
 *
 * The admin iframe appends `?<param>=1` to page URLs; the page reads the
 * flag to include drafts and to inert live-edit chrome. One constant, one
 * reader, one writer — the param name is contract.
 */
export const ADMIN_PREVIEW_PARAM = "adminPreview";

/** True when the URL carries `?<param>=1`. Accepts a URL or a query/href string. */
export function isAdminPreviewUrl(url: URL | string | null | undefined): boolean {
  if (!url) return false;
  if (url instanceof URL) {
    return url.searchParams.get(ADMIN_PREVIEW_PARAM) === "1";
  }
  try {
    return new URL(url, "http://x").searchParams.get(ADMIN_PREVIEW_PARAM) === "1";
  } catch {
    return false;
  }
}

/** Return a URL string with the flag set. Preserves the rest of the query. */
export function withAdminPreview(url: string): string {
  const u = new URL(url, "http://x");
  u.searchParams.set(ADMIN_PREVIEW_PARAM, "1");
  return u.pathname + u.search + u.hash;
}
