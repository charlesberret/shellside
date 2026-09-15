/**
 * DEV-only content + look API contract.
 * Full implementation remains site-side until host policy + content root are injected.
 *
 * Typical routes (Astro):
 *   GET  /api/dev-content?meta=1
 *   GET  /api/dev-content?path=work:kettle:title
 *   GET  /api/dev-content?lookHistory=1
 *   POST /api/dev-content  { path, value?, style?, … }
 *   POST /api/dev-content  { action: "look-history-restore", lookHistoryId }
 */

export type DevApiSkin = "portfolio" | "console";

export type DevApiFieldStyle = {
  size?: string;
  color?: string;
  font?: string;
  weight?: string;
  leading?: string;
  case?: string;
};

export type DevApiActions =
  | "add-link"
  | "remove-link"
  | "look-history-list"
  | "look-history-restore";

/** Minimum host policy for v1 */
export function isLoopbackHost(hostHeader: string): boolean {
  return /^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$/.test(hostHeader || "");
}

export const DEV_API_NOTES = `
- Refuse unless import.meta.env.DEV (or NODE_ENV development)
- Prefer loopback hosts until real auth
- Style writes are role-scoped (path → look role)
- Look history snapshots full field-styles.yaml
` as const;
