/**
 * Tab completion for the console engine.
 * First token completes against command names; later tokens complete
 * VFS paths (dirs get a trailing slash, files a trailing space).
 */

import { nodeAt, resolve, type VfsNode } from "./path.js";

export type CompletionCtx = {
  cmds: Record<string, unknown>;
  fs: VfsNode;
  cwd: string[];
  home: string[];
  aliases?: Record<string, string>;
};

export type Completion = {
  /** The completed input line (unchanged if no unique-ish match). */
  line: string;
  /** All candidates for display on a second Tab. */
  matches: string[];
};

export function commonPrefix(strings: string[]): string {
  if (!strings.length) return "";
  let p = strings[0];
  for (const s of strings.slice(1)) {
    while (!s.startsWith(p)) p = p.slice(0, -1);
    if (!p) break;
  }
  return p;
}

/**
 * Complete `line`. First Tab (cycle=0) fills the longest common prefix;
 * repeat Tabs (cycle≥1) cycle through the matches.
 */
export function completeLine(line: string, ctx: CompletionCtx, cycle = 0): Completion {
  const endsSpace = /\s$/.test(line);
  const parts = line.split(/\s+/).filter(Boolean);
  const isFirst = parts.length <= 1 && !endsSpace;
  const frag = endsSpace ? "" : parts[parts.length - 1] || "";
  const prefix = endsSpace ? line : line.slice(0, line.length - frag.length);

  if (isFirst) {
    const names = Object.keys(ctx.cmds).sort();
    const hits = names.filter((n) => n.startsWith(frag));
    if (!hits.length) return { line, matches: [] };
    const lcp = commonPrefix(hits);
    if (cycle >= 1 && hits.length > 1) {
      const pick = hits[(cycle - 1) % hits.length];
      return { line: pick + " ", matches: hits };
    }
    const completed = lcp.length > frag.length ? lcp : frag;
    return { line: completed + (hits.length === 1 ? " " : ""), matches: hits };
  }

  // Path completion: split fragment into dir part + name prefix.
  const slash = frag.lastIndexOf("/");
  const dirPart = slash === -1 ? "" : frag.slice(0, slash + 1);
  const namePart = slash === -1 ? frag : frag.slice(slash + 1);
  const dirSegs = resolve(ctx.cwd, ctx.home, dirPart || ".", ctx.aliases);
  const dirNode = nodeAt(ctx.fs, dirSegs);
  if (!dirNode || dirNode.t !== "d" || !dirNode.children) return { line, matches: [] };
  const hits = Object.keys(dirNode.children)
    .filter((n) => n.startsWith(namePart) && !n.startsWith("."))
    .sort();
  if (!hits.length) return { line, matches: [] };
  const lcp = commonPrefix(hits);
  let chosen = lcp.length > namePart.length ? lcp : namePart;
  if (cycle >= 1 && hits.length > 1) chosen = hits[(cycle - 1) % hits.length];
  const childNode = dirNode.children[chosen];
  const suffix = childNode?.t === "d" ? "/" : " ";
  const done = hits.length === 1 || (cycle >= 1 && hits.length > 1);
  return { line: prefix + dirPart + chosen + (done ? suffix : ""), matches: hits };
}
