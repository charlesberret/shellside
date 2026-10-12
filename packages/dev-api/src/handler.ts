/**
 * createDevContentHandler — the DEV editorial desk's content half as a
 * factory. The site injects:
 *
 *   - `isDev`  — production must 404 (never ship write APIs)
 *   - `hostOk` — loopback check (default `isLoopbackHost`)
 *   - `editor` — `createContentEditor` result (fs write core)
 *   - `look`   — optional site look surface (tokens, palettes, styles, history)
 *
 * Returns `{ GET, POST }` taking Fetch `Request`s — Astro routes call them as
 * `handler.GET({ url, request })`.
 */
import { parseContentPath } from "@shellside/edit-protocol";
import { isLoopbackHost } from "./contract.js";
import type { ContentEditor, CreateDraftOpts, LinkRecord } from "./content-editor.js";

/** What the site supplies for the look half of the desk. */
export type DevLookHandlers = {
  /** GET ?meta=1 payload (option lists, tokens, styles, palettes…). */
  meta?(skin: string): Promise<Record<string, unknown>>;
  /** Extra keys merged into a ?path=… response (style, role, css…). */
  pathExtras?(pathParam: string, skin: string): Promise<Record<string, unknown>>;
  /** Extra keys merged into write responses (fieldStylesCss, style…). */
  writeExtras?(pathParam: string, skin: string): Promise<Record<string, unknown>>;
  /** Apply a style write alongside a content save (`"style" in body`). */
  setStyle?(pathParam: string, style: unknown, skin: string): Promise<unknown>;
  /** Look history list (GET ?lookHistory=1, POST action look-history-list). */
  historyList?(): Promise<Record<string, unknown>>;
  /** Look history restore response (POST action look-history-restore). */
  historyRestore?(id: string, skin: string): Promise<Record<string, unknown>>;
  /** POST {tokens}. */
  setTokens?(tokens: unknown, skin: string): Promise<Record<string, unknown>>;
  /** POST {palette}. May return a Response to control the status code. */
  palette?(
    palette: Record<string, unknown>,
    skin: string,
  ): Promise<Record<string, unknown> | Response>;
};

export type DevContentHandlerOptions = {
  isDev: () => boolean;
  hostOk?: (host: string) => boolean;
  editor: ContentEditor;
  look?: DevLookHandlers;
  /** Max `value` length for scalar writes. */
  maxValueLength?: number;
};

export type DevApiHandler = {
  GET(ctx: { url: URL; request: Request }): Promise<Response>;
  POST(ctx: { request: Request }): Promise<Response>;
};

export type DevPostBody = {
  path?: string;
  value?: string;
  style?: unknown;
  skin?: string;
  tags?: string[];
  link?: LinkRecord;
  action?: "add-link" | "remove-link" | "look-history-list" | "look-history-restore" | "create-draft";
  lookHistoryId?: string;
  tokens?: unknown;
  palette?: Record<string, unknown>;
} & Omit<CreateDraftOpts, "kind" | "title"> & {
  draftKind?: string;
  draftTitle?: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function createDevContentHandler(opts: DevContentHandlerOptions): DevApiHandler {
  const hostOk = opts.hostOk ?? isLoopbackHost;
  const look = opts.look ?? {};
  const maxValue = opts.maxValueLength ?? 20000;

  const gated = (request: Request): Response | null => {
    if (!opts.isDev()) return json({ error: "dev_only" }, 404);
    if (!hostOk(request.headers.get("host") || "")) {
      return json({ error: "localhost_only" }, 403);
    }
    return null;
  };

  const needLook = <K extends keyof DevLookHandlers>(key: K): NonNullable<DevLookHandlers[K]> | Response => {
    if (typeof look[key] !== "function") return json({ error: "look_not_configured", detail: key }, 400);
    return look[key] as NonNullable<DevLookHandlers[K]>;
  };

  async function GET({ url, request }: { url: URL; request: Request }): Promise<Response> {
    const denied = gated(request);
    if (denied) return denied;
    const skin = url.searchParams.get("skin") || "portfolio";

    if (url.searchParams.get("meta") === "1" || url.searchParams.get("tokens") === "1") {
      const meta = needLook("meta");
      if (meta instanceof Response) return meta;
      try {
        return json({ ok: true, skin, ...(await meta(skin)) });
      } catch (e) {
        return json({ error: "meta_failed", message: String(e) }, 500);
      }
    }

    if (url.searchParams.get("lookHistory") === "1") {
      const historyList = needLook("historyList");
      if (historyList instanceof Response) return historyList;
      try {
        return json({ ok: true, ...(await historyList()) });
      } catch (e) {
        return json({ error: "look_history_failed", message: String(e) }, 500);
      }
    }

    const pathParam = url.searchParams.get("path") || "";
    const ref = parseContentPath(pathParam);
    if (!ref || !opts.editor.isAllowed(ref)) {
      return json({ error: "bad_path", path: pathParam }, 400);
    }
    try {
      const payload = await opts.editor.getEditPayload(pathParam);
      const extras = look.pathExtras ? await look.pathExtras(pathParam, skin) : {};
      return json({ ok: true, path: pathParam, type: typeof payload.value, skin, ...extras, ...payload });
    } catch (e) {
      return json({ error: "read_failed", message: String(e) }, 500);
    }
  }

  async function POST({ request }: { request: Request }): Promise<Response> {
    const denied = gated(request);
    if (denied) return denied;

    let body: DevPostBody;
    try {
      body = (await request.json()) as DevPostBody;
    } catch {
      return json({ error: "bad_json" }, 400);
    }
    const skin = body.skin || "portfolio";

    if (body.action === "look-history-list") {
      const historyList = needLook("historyList");
      if (historyList instanceof Response) return historyList;
      try {
        return json({ ok: true, ...(await historyList()) });
      } catch (e) {
        return json({ error: "look_history_failed", message: String(e) }, 500);
      }
    }

    if (body.action === "look-history-restore") {
      const historyRestore = needLook("historyRestore");
      if (historyRestore instanceof Response) return historyRestore;
      try {
        const id = String(body.lookHistoryId || "previous").trim();
        return json({ ok: true, action: "look-history-restore", ...(await historyRestore(id, skin)) });
      } catch (e) {
        return json({ error: "look_restore_failed", message: String(e) }, 500);
      }
    }

    if (body.action === "create-draft") {
      try {
        const result = await opts.editor.createDraft({
          kind: (body.draftKind || "work") as CreateDraftOpts["kind"],
          title: String(body.draftTitle || ""),
          workStatus: body.workStatus,
          writingType: body.writingType,
          recordSection: body.recordSection,
        });
        return json({
          ok: true,
          action: "create-draft",
          ...result,
          note: `Draft ${result.kind} "${result.title}" created (${result.id})`,
          reload: true,
        });
      } catch (e) {
        return json({ error: "create_draft_failed", message: String(e) }, 500);
      }
    }

    if (body.tokens && typeof body.tokens === "object") {
      const setTokens = needLook("setTokens");
      if (setTokens instanceof Response) return setTokens;
      try {
        return json({ ok: true, ...(await setTokens(body.tokens, skin)) });
      } catch (e) {
        return json({ error: "token_write_failed", message: String(e) }, 500);
      }
    }

    if (body.palette && typeof body.palette === "object") {
      const palette = needLook("palette");
      if (palette instanceof Response) return palette;
      try {
        const out = await palette(body.palette, skin);
        // A returned Response passes through so the site controls status.
        return out instanceof Response ? out : json(out);
      } catch (e) {
        return json({ error: "palette_failed", message: String(e) }, 500);
      }
    }

    const pathParam = String(body.path || "");
    const ref = parseContentPath(pathParam);
    if (!ref) return json({ error: "bad_path", path: pathParam }, 400);

    if (body.action === "add-link") {
      if (ref.kind !== "work" && ref.kind !== "record") {
        return json({ error: "add_link_work_or_record" }, 400);
      }
      try {
        const result = await opts.editor.addLink(ref.kind, ref.id, body.link);
        return json({
          ok: true,
          action: "add-link",
          path: `${ref.kind}:${ref.id}:links.${result.index}`,
          link: result.link,
          index: result.index,
          note: "link added; reload to see it on the page",
        });
      } catch (e) {
        return json({ error: "add_link_failed", message: String(e) }, 500);
      }
    }

    if (body.action === "remove-link") {
      if (ref.kind !== "work" && ref.kind !== "record") {
        return json({ error: "remove_link_work_or_record" }, 400);
      }
      const m = ref.field.match(/^links\.(\d+)/);
      if (!m) return json({ error: "bad_link_path" }, 400);
      try {
        await opts.editor.removeLink(ref.kind, ref.id, Number(m[1]));
        return json({ ok: true, action: "remove-link", note: "link removed; reload to update the page" });
      } catch (e) {
        return json({ error: "remove_link_failed", message: String(e) }, 500);
      }
    }

    if (!opts.editor.isAllowed(ref)) {
      return json({ error: "bad_path", path: pathParam }, 400);
    }

    if (Array.isArray(body.tags) && ref.kind === "work" && ref.field === "tags") {
      try {
        const tags = await opts.editor.setTags(ref.id, body.tags);
        let styleResult: unknown;
        if ("style" in body && look.setStyle) {
          styleResult = await look.setStyle(pathParam, body.style, skin);
        }
        const extras = look.writeExtras ? await look.writeExtras(pathParam, skin) : {};
        return json({
          ok: true, path: pathParam, editKind: "tags", tags,
          value: tags.join(", "), skin, ...extras,
          ...(styleResult !== undefined ? { style: styleResult } : {}),
          note: "tags saved",
        });
      } catch (e) {
        return json({ error: "tags_failed", message: String(e) }, 500);
      }
    }

    if (body.link && (ref.kind === "work" || ref.kind === "record")) {
      const m = ref.field.match(/^links\.(\d+)/);
      if (!m) return json({ error: "bad_link_path" }, 400);
      try {
        const link = await opts.editor.setLinkAt(ref.kind, ref.id, Number(m[1]), body.link);
        let styleResult: unknown;
        if ("style" in body && look.setStyle) {
          styleResult = await look.setStyle(pathParam, body.style, skin);
        }
        const extras = look.writeExtras ? await look.writeExtras(pathParam, skin) : {};
        return json({
          ok: true, path: pathParam, editKind: "link", link,
          value: link.label, skin, ...extras,
          ...(styleResult !== undefined ? { style: styleResult } : {}),
          note: "link saved",
        });
      } catch (e) {
        return json({ error: "link_failed", message: String(e) }, 500);
      }
    }

    const hasValue = typeof body.value === "string";
    const hasStyle = "style" in body;
    if (!hasValue && !hasStyle) return json({ error: "nothing_to_save" }, 400);
    if (hasValue && body.value!.length > maxValue) {
      return json({ error: "value_too_long" }, 400);
    }

    try {
      let valueResult: { path: string; value: string } | undefined;
      let styleResult: unknown;
      if (hasValue) valueResult = await opts.editor.setValue(ref, body.value!);
      if (hasStyle && look.setStyle) {
        styleResult = await look.setStyle(pathParam, body.style, skin);
      }
      const extras = look.writeExtras ? await look.writeExtras(pathParam, skin) : {};
      return json({
        ok: true, path: pathParam,
        value: valueResult?.value, skin, ...extras,
        ...(styleResult !== undefined ? { style: styleResult } : {}),
        note: "saved; HMR may refresh the page",
      });
    } catch (e) {
      return json({ error: "write_failed", message: String(e) }, 500);
    }
  }

  return { GET, POST };
}
