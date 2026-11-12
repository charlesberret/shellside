/**
 * DEV-only content + look API contract.
 *
 * HTTP behavior is implemented by `createDevContentHandler` in this package.
 * The site injects dev gating, a `createContentEditor` instance, and optional
 * look handlers; it mounts the returned `{ GET, POST }` on a dev-only route.
 *
 * Typical routes (Astro):
 *   GET  /api/dev-content?meta=1
 *   GET  /api/dev-content?path=work:kettle:title
 *   GET  /api/dev-content?lookHistory=1
 *   POST /api/dev-content  { path, value?, style?, … }
 *   POST /api/dev-content  { action: "look-history-restore", lookHistoryId }
 *   POST /api/dev-content  { action: "create-draft", draftKind?, draftTitle, … }
 */

import type { CreateDraftResult, DraftKind } from "./content-editor.js";

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
  | "look-history-restore"
  | "create-draft";

/** POST body for `action: "create-draft"`. */
export type DevApiCreateDraftRequest = {
  action: "create-draft";
  skin?: DevApiSkin;
  /** Defaults to `"work"`. */
  draftKind?: DraftKind;
  draftTitle?: string;
  workStatus?: "current" | "complete";
  writingType?: string;
  recordSection?: string;
};

/** Successful POST response for `create-draft`. */
export type DevApiCreateDraftResponse = CreateDraftResult & {
  ok: true;
  action: "create-draft";
  note: string;
  reload: true;
};

/** Minimum host policy for v1 */
export function isLoopbackHost(hostHeader: string): boolean {
  return /^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$/.test(hostHeader || "");
}

export const DEV_API_NOTES = `
- Refuse unless import.meta.env.DEV (or NODE_ENV development)
- Prefer loopback hosts until real auth
- Style writes are role-scoped (path → look role)
- Look history snapshots full field-styles.yaml
- create-draft allocates a new work file or YAML row (visibility draft)
` as const;

const DRAFT_KINDS: readonly DraftKind[] = ["work", "writing", "record"];

export function parseCreateDraftBody(
  body: Record<string, unknown>,
): { ok: true; opts: Omit<DevApiCreateDraftRequest, "action" | "skin"> } | { ok: false; error: string; status: number } {
  if (body.draftTitle != null && typeof body.draftTitle !== "string") {
    return { ok: false, error: "invalid_shape", status: 400 };
  }
  if (body.draftKind != null && typeof body.draftKind !== "string") {
    return { ok: false, error: "invalid_shape", status: 400 };
  }
  const title = String(body.draftTitle ?? "");
  if (/[\\/]|\.\./.test(title)) {
    return { ok: false, error: "path_escape", status: 400 };
  }
  const kind = (body.draftKind ?? "work") as string;
  if (!DRAFT_KINDS.includes(kind as DraftKind)) {
    return { ok: false, error: "invalid_shape", status: 400 };
  }
  return {
    ok: true,
    opts: {
      draftKind: kind as DraftKind,
      draftTitle: title,
      workStatus: body.workStatus as DevApiCreateDraftRequest["workStatus"],
      writingType: typeof body.writingType === "string" ? body.writingType : undefined,
      recordSection: typeof body.recordSection === "string" ? body.recordSection : undefined,
    },
  };
}
