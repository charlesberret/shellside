/**
 * POSIX-ish filesystem commands for the console engine.
 * VFS walkers / HTML formatters stay in the page; inject via `ctx`.
 */

import { parseShortFlags as parseShortFlagsDefault } from "../parse.js";
import type { VfsNode } from "../path.js";

export type ReadFileResult = {
  err?: string;
  cls?: string;
  body?: string;
  label?: string;
  openUrl?: string;
  openLabel?: string;
};

export type FsCommandCtx = {
  out: (html: string, cls?: string) => void;
  esc: (s: string) => string;
  getCwd: () => string[];
  setCwd: (parts: string[]) => void;
  resolvePath: (arg?: string | null) => string[];
  nodeAt: (parts: string[]) => VfsNode | null;
  prettyPath: (parts: string[]) => string;
  parseShortFlags?: (args: string[]) => Set<string>;
  lsLongRow: (node: VfsNode, name: string, parentParts: string[]) => string;
  lsShortEntry: (node: VfsNode, name: string, parentParts: string[]) => string;
  readTextFile: (pathArg: string, verb: string) => ReadFileResult;
  fileViewCmd: (name: string) => string;
  openExternal: (url: string, label: string, displayName: string) => void;
  openLess: (body: string, title?: string) => void;
  hostMark?: (flag: string) => boolean;
  hostWhisper?: (msg: string) => void;
  globToRegExp?: (glob: string, opts?: { ignoreCase?: boolean }) => RegExp;
  onSearchQuery?: (query: string) => void;
};

export function createFsCommands(ctx: FsCommandCtx): Record<string, (args: string[]) => unknown> {
  const {
    out,
    esc,
    getCwd,
    setCwd,
    resolvePath,
    nodeAt,
    prettyPath,
    parseShortFlags = parseShortFlagsDefault,
    lsLongRow,
    lsShortEntry,
    readTextFile,
    fileViewCmd,
    openExternal,
    openLess,
    hostMark,
    hostWhisper,
    globToRegExp,
    onSearchQuery,
  } = ctx;

  return {
    ls(args: string[]) {
      const flags = parseShortFlags(args);
      const showAll = flags.has("a");
      const long = flags.has("l");
      const target = args.find((a) => !a.startsWith("-"));
      const parts = resolvePath(target);
      const node = nodeAt(parts);
      if (!node) return out(`ls: ${esc(target || "")}: no such file or directory`, "red");
      if (node.t !== "d") return out(esc(target ?? ""));
      if (showAll && hostMark?.("ls_a")) {
        hostWhisper?.("dotfiles visible. nothing taken — only listed.");
      }
      const names = Object.keys((node as { children: Record<string, VfsNode> }).children)
        .filter((n) => showAll || !n.startsWith("."))
        .sort((a, b) => a.localeCompare(b));
      // Parent-dir shortcut: same cyan dir affordance as real folders.
      // Omit at filesystem root where .. is a no-op. (At ~, .. → / is useful.)
      const entries: { node: VfsNode; name: string }[] = [];
      if (parts.length > 0) {
        entries.push({ node: { t: "d", children: {} }, name: ".." });
      }
      for (const n of names) entries.push({ node: (node as { children: Record<string, VfsNode> }).children[n], name: n });
      if (!long) {
        out(
          `<div class="lsshort">${entries
            .map(({ node: child, name }) => lsShortEntry(child, name, parts))
            .join("")}</div>`,
        );
        return;
      }
      out(
        `<div class="lslong">${entries
          .map(({ node: child, name }) => lsLongRow(child, name, parts))
          .join("")}</div>`,
      );
    },
    ll(args: string[]) {
      this.ls(["-l", ...args]);
    },
    la(args: string[]) {
      this.ls(["-a", ...args]);
    },
    cd(args: string[]) {
      const flags = parseShortFlags(args);
      const quiet = flags.has("q");
      const target = args.find((a) => !a.startsWith("-")) || "~";
      const parts = resolvePath(target);
      const node = nodeAt(parts);
      if (!node) return out(`cd: ${esc(target)}: no such file or directory`, "red");
      if (node.t !== "d") {
        if (node.t === "bin") {
          out(
            `cd: ${esc(target)}: not a directory. Opening it - try <span class="amber">open ${esc(target)}</span> next time.`,
            "muted",
          );
          this.open([target]);
          return;
        }
        const verb = fileViewCmd(target);
        out(
          `cd: ${esc(target)}: not a directory. Showing it with <span class="amber">${verb}</span> instead.`,
          "muted",
        );
        (this as Record<string, (a: string[]) => unknown>)[verb]([target]);
        return;
      }
      setCwd(parts);
      // Soft UX: list the new directory unless quiet (`cd -q`)
      if (!quiet) this.ls([]);
    },
    pwd() {
      out(prettyPath(getCwd()));
    },
    cat(args: string[]) {
      const r = readTextFile(args[0], "cat");
      if (r.err) {
        out(r.err, r.cls);
        if (r.openUrl) openExternal(r.openUrl, r.openLabel || args[0], r.openLabel || args[0]);
        return;
      }
      out(r.body ?? "");
    },
    less(args: string[]) {
      const r = readTextFile(args[0], "less");
      if (r.err) {
        out(r.err, r.cls);
        if (r.openUrl) openExternal(r.openUrl, r.openLabel || args[0], r.openLabel || args[0]);
        return;
      }
      openLess(r.body ?? "", r.label);
    },
    find(args: string[]) {
      let start = ".";
      let nameGlob: string | null = null;
      let typeFilter: string | null = null; // 'f' | 'd' | null
      let i = 0;
      if (args[0] && !args[0].startsWith("-")) {
        start = args[0];
        i = 1;
      }
      for (; i < args.length; i++) {
        const a = args[i];
        if (a === "-name" && args[i + 1]) {
          nameGlob = args[++i];
          continue;
        }
        if (a === "-type" && args[i + 1]) {
          typeFilter = args[++i];
          if (typeFilter !== "f" && typeFilter !== "d") {
            out(`find: unknown type \`${esc(typeFilter)}\` (use f or d)`, "red");
            return;
          }
          continue;
        }
        if (a.startsWith("-")) {
          out(
            `find: unknown predicate \`${esc(a)}\`  <span class="muted">(supported: -name, -type)</span>`,
            "muted",
          );
          return;
        }
        out(`find: unexpected argument \`${esc(a)}\``, "red");
        return;
      }
      const parts = resolvePath(start);
      const root = nodeAt(parts);
      if (!root) {
        out(`find: ${esc(start)}: no such file or directory`, "red");
        return;
      }
      const nameRe = nameGlob && globToRegExp ? globToRegExp(nameGlob) : null;
      const found: string[] = [];
      const consider = (p: string[], node: VfsNode, name: string) => {
        if (typeFilter === "f" && node.t !== "f") return;
        if (typeFilter === "d" && node.t !== "d") return;
        if (nameRe && !nameRe.test(name)) return;
        found.push(prettyPath(p));
      };
      if (root.t === "f" || root.t === "bin") {
        consider(parts, root, parts[parts.length - 1] || start);
      } else if (root.t === "d") {
        consider(parts, root, parts[parts.length - 1] || start);
        const walk = (dirParts: string[], dirNode: VfsNode) => {
          const names = Object.keys((dirNode as { children: Record<string, VfsNode> }).children || {}).sort((a, b) =>
            a.localeCompare(b),
          );
          for (const name of names) {
            if (name.startsWith(".")) continue;
            const child = (dirNode as { children: Record<string, VfsNode> }).children[name];
            const cp = [...dirParts, name];
            if (child.t === "d") {
              consider(cp, child, name);
              walk(cp, child);
            } else if (child.t === "f") {
              consider(cp, child, name);
            }
          }
        };
        walk(parts, root);
      }
      if (nameGlob) onSearchQuery?.(nameGlob);
      if (!found.length) {
        out('<span class="muted">find: no matches</span>');
        return;
      }
      out(found.map((p) => esc(p)).join("\n"));
    },
    tree() {
      const render = (node: VfsNode, parts: string[], pre: string): string => {
        let html = "";
        const children = (node as { children: Record<string, VfsNode> }).children;
        const ks = Object.keys(children).filter((n) => !n.startsWith("."));
        ks.forEach((k, i) => {
          const last = i === ks.length - 1;
          const c = children[k];
          const path = prettyPath([...parts, k]);
          const kind = c.t === "d" ? "dir" : c.t === "bin" ? "bin" : "file";
          const label = k + (c.t === "d" ? "/" : "");
          const branch = pre + (last ? "└─ " : "├─ ");
          const cls = c.t === "d" ? " d" : c.t === "bin" || c.url ? " x" : "";
          const cmd = fileViewCmd(k);
          html += `${esc(branch)}<a href="#" class="fs-entry${cls}" data-fs-path="${esc(path)}" data-fs-kind="${kind}" data-fs-cmd="${cmd}">${esc(label)}</a>\n`;
          if (c.t === "d") html += render(c, [...parts, k], pre + (last ? "   " : "│  "));
        });
        return html;
      };
      const rootNode = nodeAt(["~"]);
      out(`<pre class="treeout">${esc("~/")}\n${rootNode ? render(rootNode, ["~"], "") : ""}</pre>`);
    },
    open(args: string[]) {
      const a = args[0];
      if (!a) return out("open: what would you like to open?", "muted");
      const parts = resolvePath(a);
      const node = nodeAt(parts);
      const url = node && (node.url || (node.t === "bin" && node.url));
      if (url) {
        openExternal(String(url), a, a);
        return;
      }
      if (/^https?:|^mailto:/.test(a)) {
        openExternal(a, a, a);
        return;
      }
      out(`open: ${esc(a)}: nothing to open`, "red");
    },
  };
}
