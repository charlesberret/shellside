/**
 * Preview-bridge protocol — the typed contract between the dev desk's
 * admin shell, the previewed page (iframe), and the editor panel.
 *
 * Three channels:
 *
 *   shell → preview   postMessage, source: "cb-admin-shell"
 *   preview → shell   postMessage, source: "cb-admin-preview"
 *   editor → shell    CustomEvent("cb-admin-editor") on the admin window
 *
 * Dirty-guard contract: `apply-field-text`/`apply-field-styles`/
 * `apply-design-tokens` push *persisted* values into the live preview —
 * a saved write always wins over in-flight edits in the panel. Editors
 * must snapshot clean state after every successful save; destructive
 * actions (close panel, navigate) ask first.
 */

export const BRIDGE_SHELL_SOURCE = "cb-admin-shell";
export const BRIDGE_PREVIEW_SOURCE = "cb-admin-preview";
export const BRIDGE_EDITOR_EVENT = "cb-admin-editor";

// ── shell → preview ──────────────────────────────────────────────────────

export type ShellToPreviewMessage =
  | { type: "navigate"; path: string }
  | { type: "set-edit-mode"; on: boolean }
  | { type: "clear-focus" }
  | { type: "reveal-console" }
  | { type: "reload" }
  | { type: "apply-field-text"; path: string; value: string }
  | { type: "apply-field-styles"; css: string }
  | { type: "apply-design-tokens"; css: string }
  | { type: "soft-refresh-console" };

// ── preview → shell ──────────────────────────────────────────────────────

export type PreviewToShellMessage =
  | { type: "preview-ready"; path: string; console: boolean }
  | {
      type: "select-field";
      path: string;
      text: string;
      page: string;
      console: boolean;
      computed?: { fontSize?: string; color?: string };
    }
  | {
      type: "create-draft";
      kind: string;
      workStatus?: string;
      writingType?: string;
      recordSection?: string;
    }
  | { type: "admin-action"; action: string; workId: string; page: string }
  | {
      type: "console-reveal";
      count: number;
      surface?: string;
      id?: string | null;
    };

// ── editor → shell (CustomEvent detail on the admin window) ──────────────

export type EditorToShellMessage =
  | { type: "edit-mode"; on: boolean }
  | { type: "field-open"; path: string; console?: boolean }
  | { type: "field-close" }
  | { type: "field-styles-css"; css: string }
  | { type: "design-tokens-css"; css: string }
  | { type: "saved"; path?: string; value?: string; reload?: boolean }
  | { type: "tokens-saved"; reload?: boolean; cssApplied?: boolean };

/** Wire shape = message + source tag. */
export function shellMessage<T extends ShellToPreviewMessage>(
  msg: T,
): T & { source: typeof BRIDGE_SHELL_SOURCE } {
  return { source: BRIDGE_SHELL_SOURCE, ...msg };
}

export function previewMessage<T extends PreviewToShellMessage>(
  msg: T,
): T & { source: typeof BRIDGE_PREVIEW_SOURCE } {
  return { source: BRIDGE_PREVIEW_SOURCE, ...msg };
}

/** Guards for postMessage receivers — filter by source, not type alone. */
export function isShellToPreview(
  data: unknown,
): data is ShellToPreviewMessage & { source: typeof BRIDGE_SHELL_SOURCE } {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { source?: string }).source === BRIDGE_SHELL_SOURCE &&
    typeof (data as { type?: string }).type === "string"
  );
}

export function isPreviewToShell(
  data: unknown,
): data is PreviewToShellMessage & { source: typeof BRIDGE_PREVIEW_SOURCE } {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { source?: string }).source === BRIDGE_PREVIEW_SOURCE &&
    typeof (data as { type?: string }).type === "string"
  );
}
