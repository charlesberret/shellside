/**
 * Console VFS node types and tree ops — projection primitives only.
 * Personality (lore, easter eggs, command behavior) stays with the site.
 *
 * A node is a plain JSON-serializable record — except `chr`, which holds a
 * reader function for files whose body regenerates on each access.
 */

/** Outbound link rendered under a file body (original publications, etc.). */
export type VfsLink = {
  label: string;
  href: string;
  description?: string;
  /** data-edit paths so the desk can edit label/description in place. */
  editLabel?: string;
  editDesc?: string;
};

export type VfsDir = { t: "d"; children: Record<string, VfsNode> };

export type VfsFile = {
  t: "f";
  body: string;
  /** Body is an HTML fragment, not plain text. */
  html?: boolean;
  /** Canonical page href for the item (the "real" surface). */
  url?: string;
  links?: VfsLink[];
  /** Render links as a compact one-per-line list. */
  compactLinks?: boolean;
};

/** Binary / downloadable file — `cat` prints the url, `ls -l` marks it. */
export type VfsBin = { t: "bin"; url: string };

/**
 * Character device — body is computed on every read via `gen()`.
 * NOTE: a `gen` function cannot serialize to JSON; sites that embed the
 * tree in a page must rehydrate chr nodes client-side.
 */
export type VfsChr = { t: "c"; gen: () => string };

export type VfsNode = VfsDir | VfsFile | VfsBin | VfsChr;

export function dir(children: Record<string, VfsNode> = {}): VfsDir {
  return { t: "d", children };
}

export function file(
  body: string,
  opts: Omit<VfsFile, "t" | "body"> = {},
): VfsFile {
  return {
    t: "f",
    body,
    html: !!opts.html,
    url: opts.url || undefined,
    links: Array.isArray(opts.links) ? opts.links : [],
    compactLinks: !!opts.compactLinks,
  };
}

/** Shortcut for an outbound-link file (`cat` shows the url line). */
export function link(url: string, body?: string): VfsFile {
  return file(body || `→ ${url}`, { url });
}

export function bin(url: string): VfsBin {
  return { t: "bin", url };
}

export function chr(gen: () => string): VfsChr {
  return { t: "c", gen };
}

/** mkdir -p then place `node` at `parts` inside `root`. Returns root. */
export function mount(root: VfsDir, parts: readonly string[], node: VfsNode): VfsDir {
  let cur = root;
  for (const part of parts.slice(0, -1)) {
    const next = cur.children[part];
    if (!next || next.t !== "d") cur.children[part] = dir({});
    cur = cur.children[part] as VfsDir;
  }
  const last = parts[parts.length - 1];
  if (last) cur.children[last] = node;
  return cur === root ? root : root;
}

/** Walk the tree to the node at `parts`; null if any hop is missing or not a dir. */
export function nodeAt(
  fsRoot: VfsNode | null | undefined,
  parts: readonly string[],
): VfsNode | null {
  let n: VfsNode | null | undefined = fsRoot;
  for (const p of parts) {
    if (!n || n.t !== "d" || !n.children[p]) return null;
    n = n.children[p];
  }
  return n ?? null;
}

/** Every (parts, node) pair below root, dirs first in traversal order. */
export function* walk(
  root: VfsDir,
  prefix: readonly string[] = [],
): Generator<[readonly string[], VfsNode]> {
  for (const [name, node] of Object.entries(root.children)) {
    const parts = [...prefix, name];
    yield [parts, node];
    if (node.t === "d") yield* walk(node, parts);
  }
}
