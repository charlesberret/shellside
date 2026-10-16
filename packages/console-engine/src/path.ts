/**
 * VFS path helpers for the console engine.
 * A path is a segment list — `["~", "projects", "kettle.md"]` —
 * with `~` as the conventional home segment.
 */

/** The loose node shape the engine walks — `children` marks a directory. */
export type VfsNode = {
  t: string;
  children?: Record<string, VfsNode>;
  body?: string;
  url?: string;
  html?: boolean;
  [key: string]: unknown;
};

/** Default home path segments for the console VFS. */
export const DEFAULT_HOME: string[] = ["~"];

/**
 * Walk a VFS tree to the node at `parts`, or null if missing / not a directory chain.
 */
export function nodeAt(
  fs: VfsNode | null | undefined,
  parts: string[],
): VfsNode | null {
  let n = fs;
  for (const p of parts) {
    if (!n || n.t !== "d" || !n.children?.[p]) return null;
    n = n.children[p];
  }
  return n ?? null;
}

/**
 * Collapse `.`, `..`, and empty segments in a path part list.
 */
export function normalizeSegments(parts: string[]): string[] {
  const out: string[] = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") {
      if (out.length > 0) out.pop();
      continue;
    }
    out.push(p);
  }
  return out;
}

/**
 * Site path aliases applied after normalization — the site passes a map of
 * path prefixes to rewrite (e.g. `{ "~/work": "~/projects" }`).
 * Alias keys are compared against the home-anchored prefix of `parts`.
 */
export function applyPathAliases(
  parts: string[],
  aliases?: Record<string, string>,
): string[] {
  if (!aliases) return parts;
  for (const [from, to] of Object.entries(aliases)) {
    const fromSegs = from.split("/").filter(Boolean);
    if (parts.slice(0, fromSegs.length).join("/") === fromSegs.join("/")) {
      return [...to.split("/").filter(Boolean), ...parts.slice(fromSegs.length)];
    }
  }
  return parts;
}

/**
 * Resolve a shell-style path argument to normalized segment list (no VFS lookup).
 */
export function resolve(
  cwd: string[],
  home: string[],
  arg: string | undefined | null,
  aliases?: Record<string, string>,
): string[] {
  let parts: string[];
  if (!arg) parts = [...cwd];
  else if (arg === "~") parts = [...home];
  else if (arg === "/") parts = [];
  else if (arg.startsWith("~/")) parts = [...home, ...arg.slice(2).split("/")];
  else if (arg.startsWith("/")) parts = arg.slice(1).split("/");
  else parts = [...cwd, ...arg.split("/")];
  return applyPathAliases(normalizeSegments(parts), aliases);
}

/**
 * Resolve path with VFS-aware relative fallback: bare relative names that miss under
 * cwd are retried from home (so `ls projects/` works after `cd projects/`).
 */
export function resolvePath(
  cwd: string[],
  home: string[],
  fs: VfsNode | null | undefined,
  arg: string | undefined | null,
  aliases?: Record<string, string>,
): string[] {
  const parts = resolve(cwd, home, arg, aliases);
  if (!arg || nodeAt(fs, parts)) return parts;
  if (arg.startsWith("/") || arg.startsWith("~") || arg.startsWith(".")) return parts;
  const fromHome = resolve(cwd, home, `~/${arg}`, aliases);
  return nodeAt(fs, fromHome) ? fromHome : parts;
}

/** Render path segments for display (empty root → `/`). */
export function prettyPath(parts: string[]): string {
  return parts.length === 0 ? "/" : parts.join("/");
}
