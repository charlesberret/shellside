/**
 * Text filter / pipeline commands for the console engine.
 * Page supplies VFS + I/O via ctx; parse helpers are imported here.
 */

import { parseFlags } from "../parse.js";
import type { VfsNode } from "../path.js";

export type RawTextResult = { text?: string; err?: string; cls?: string };

export type FilterCommandsCtx = {
  out: (html: string, cls?: string) => void;
  esc: (s: string) => string;
  getPipeStdin: () => string | null | undefined;
  rawTextFile: (pathArg: string, verb: string) => RawTextResult;
  resolvePath: (arg: string) => string[];
  nodeAt: (parts: string[]) => VfsNode | null | undefined;
  walkVfs: (parts: string[], opts?: { recursive?: boolean; showHidden?: boolean }) => { parts: string[]; node: VfsNode; name?: string }[];
  plainText: (body: unknown) => string;
  prettyPath: (parts: string[]) => string;
  onSearchQuery?: (query: string) => void;
};

export function createFilterCommands(ctx: FilterCommandsCtx): Record<string, (args: string[]) => unknown> {
  const {
    out,
    esc,
    getPipeStdin,
    rawTextFile,
    resolvePath,
    nodeAt,
    walkVfs,
    plainText,
    prettyPath,
    onSearchQuery,
  } = ctx;

  return {
    grep(args: string[]) {
      const { flags, rest } = parseFlags(args, ["i", "n", "r", "R"]);
      const ignoreCase = flags.i;
      const lineNum = flags.n;
      const recursive = flags.r || flags.R;
      const pattern = rest[0];
      const paths = rest.slice(1);
      if (!pattern) {
        out("usage: <span class=\"amber\">grep</span> [-i] [-n] [-r] <span class=\"amber\">pattern</span> [file…]", "muted");
        return;
      }
      let re: RegExp;
      try {
        re = new RegExp(pattern, ignoreCase ? "i" : "");
      } catch (e) {
        out(`grep: invalid pattern: ${esc(String((e as Error).message || e))}`, "red");
        return;
      }
      const hits: string[] = [];
      let filesSearched = 0;
      const pipeStdin = getPipeStdin();

      const matchLines = (text: string, label: string, multi: boolean) => {
        const lines = String(text).split("\n");
        filesSearched++;
        for (let i = 0; i < lines.length; i++) {
          if (!re.test(lines[i])) continue;
          const num = lineNum ? `<span class="muted">${i + 1}:</span>` : "";
          const pref = multi
            ? `<span class="cyan">${esc(label)}</span><span class="muted">:</span>`
            : "";
          hits.push(`${pref}${num}${esc(lines[i])}`);
        }
      };

      if (!paths.length && pipeStdin != null) {
        matchLines(pipeStdin, "(stdin)", false);
      } else {
        const targets = paths.length ? paths : ["."];
        for (const t of targets) {
          const parts = resolvePath(t);
          const node = nodeAt(parts);
          if (!node) {
            out(`grep: ${esc(t)}: no such file or directory`, "red");
            continue;
          }
          let files: { parts: string[]; node: VfsNode }[] = [];
          if (node.t === "d") {
            if (!recursive && targets.length === 1 && paths.length === 0) {
              files = walkVfs(parts, { recursive: false, showHidden: false });
            } else if (!recursive) {
              out(`grep: ${esc(t)}: is a directory (use <span class="amber">-r</span>)`, "muted");
              continue;
            } else {
              files = walkVfs(parts, { recursive: true, showHidden: false });
            }
          } else if (node.t === "bin") {
            out(`grep: ${esc(t)}: binary file ignored`, "muted");
            continue;
          } else {
            files = [{ parts, node }];
          }
          const multi = files.length > 1 || targets.length > 1 || recursive;
          for (const f of files) {
            const text = f.node.html
              ? plainText(f.node.body)
              : String(f.node.body ?? "");
            matchLines(text, prettyPath(f.parts), multi);
          }
        }
      }
      if (!hits.length) {
        out(
          filesSearched
            ? `<span class="muted">grep: no matches</span>`
            : `<span class="muted">grep: nothing to search</span>`,
        );
        /* Still run hooks: the query may unlock files that weren't greppable yet */
        onSearchQuery?.(pattern);
        return;
      }
      out(hits.join("\n"));
      onSearchQuery?.(pattern);
    },

    head(args: string[]) {
      let n = 10;
      const rest: string[] = [];
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === "-n" && args[i + 1]) {
          n = Math.max(0, parseInt(args[++i], 10) || 0);
          continue;
        }
        if (/^-n\d+$/.test(a)) {
          n = Math.max(0, parseInt(a.slice(2), 10) || 0);
          continue;
        }
        if (/^-\d+$/.test(a)) {
          n = Math.max(0, parseInt(a.slice(1), 10) || 0);
          continue;
        }
        rest.push(a);
      }
      const pathArg = rest[0];
      const pipeStdin = getPipeStdin();
      if (!pathArg && pipeStdin != null) {
        out(esc(pipeStdin.split("\n").slice(0, n).join("\n")));
        return;
      }
      if (!pathArg) {
        out("usage: <span class=\"amber\">head</span> [-n N] <span class=\"amber\">file</span>", "muted");
        return;
      }
      const r = rawTextFile(pathArg, "head");
      if (r.err) return out(r.err, r.cls);
      const lines = (r.text ?? "").split("\n");
      out(esc(lines.slice(0, n).join("\n")));
    },

    tail(args: string[]) {
      if (args.includes("-f") || args.includes("--follow")) {
        out(
          "tail: -f follows career indefinitely. Ctrl+C is a lifestyle choice. (showing last 10 instead)",
          "muted",
        );
      }
      let n = 10;
      const rest: string[] = [];
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === "-f" || a === "--follow") continue;
        if (a === "-n" && args[i + 1]) {
          n = Math.max(0, parseInt(args[++i], 10) || 0);
          continue;
        }
        if (/^-n\d+$/.test(a)) {
          n = Math.max(0, parseInt(a.slice(2), 10) || 0);
          continue;
        }
        if (/^-\d+$/.test(a)) {
          n = Math.max(0, parseInt(a.slice(1), 10) || 0);
          continue;
        }
        rest.push(a);
      }
      const pathArg = rest[0];
      const pipeStdin = getPipeStdin();
      if (!pathArg && pipeStdin != null) {
        const lines = pipeStdin.split("\n");
        out(esc(lines.slice(Math.max(0, lines.length - n)).join("\n")));
        return;
      }
      if (!pathArg) {
        out("usage: <span class=\"amber\">tail</span> [-n N] <span class=\"amber\">file</span>", "muted");
        return;
      }
      const r = rawTextFile(pathArg, "tail");
      if (r.err) return out(r.err, r.cls);
      const lines = (r.text ?? "").split("\n");
      out(esc(lines.slice(Math.max(0, lines.length - n)).join("\n")));
    },

    wc(args: string[]) {
      const { flags, rest } = parseFlags(args, ["l", "w", "c"]);
      let showL = flags.l;
      let showW = flags.w;
      let showC = flags.c;
      if (!showL && !showW && !showC) {
        showL = showW = showC = true;
      }
      const fmt = (lines: number, words: number, chars: number, label: string) => {
        const cols = [];
        if (showL) cols.push(String(lines).padStart(8));
        if (showW) cols.push(String(words).padStart(8));
        if (showC) cols.push(String(chars).padStart(8));
        return `${cols.join("")}${label ? ` ${label}` : ""}`;
      };
      const countText = (text: string) => {
        const lines = text.length ? text.split("\n").length : 0;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = [...text].length;
        return { lines, words, chars };
      };
      const pipeStdin = getPipeStdin();
      if (!rest.length && pipeStdin != null) {
        const { lines, words, chars } = countText(pipeStdin);
        out(`<span class="muted">${fmt(lines, words, chars, "")}</span>`);
        return;
      }
      const paths = rest.length ? rest : [];
      if (!paths.length) {
        out("usage: <span class=\"amber\">wc</span> [-l] [-w] [-c] <span class=\"amber\">file…</span>", "muted");
        return;
      }
      const rows: string[] = [];
      let tL = 0;
      let tW = 0;
      let tC = 0;
      let ok = 0;
      for (const p of paths) {
        const r = rawTextFile(p, "wc");
        if (r.err) {
          out(r.err, r.cls);
          continue;
        }
        const { lines, words, chars } = countText(r.text ?? "");
        tL += lines;
        tW += words;
        tC += chars;
        ok++;
        rows.push(fmt(lines, words, chars, esc(p)));
      }
      if (ok > 1) rows.push(fmt(tL, tW, tC, "total"));
      if (rows.length) out(`<span class="muted">${rows.join("\n")}</span>`);
    },

    sort(args: string[]) {
      const { flags, rest } = parseFlags(args, ["r", "n", "f"]);
      const reverse = flags.r;
      const numeric = flags.n;
      const fold = flags.f;
      let lines: string[];
      const pipeStdin = getPipeStdin();
      if (rest[0]) {
        const r = rawTextFile(rest[0], "sort");
        if (r.err) return out(r.err, r.cls);
        lines = (r.text ?? "").split("\n");
      } else if (pipeStdin != null) {
        lines = pipeStdin.split("\n");
      } else {
        out("usage: <span class=\"amber\">sort</span> [-r] [-n] [file]", "muted");
        return;
      }
      const key = (s: string) => (fold ? s.toLowerCase() : s);
      lines.sort((a, b) => {
        if (numeric) {
          const na = parseFloat(a);
          const nb = parseFloat(b);
          if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        }
        return key(a).localeCompare(key(b));
      });
      if (reverse) lines.reverse();
      out(esc(lines.join("\n")));
    },

    uniq(args: string[]) {
      const { flags, rest } = parseFlags(args, ["c", "d", "u"]);
      const count = flags.c;
      const onlyDup = flags.d;
      const onlyUnique = flags.u;
      let lines: string[];
      const pipeStdin = getPipeStdin();
      if (rest[0]) {
        const r = rawTextFile(rest[0], "uniq");
        if (r.err) return out(r.err, r.cls);
        lines = (r.text ?? "").split("\n");
      } else if (pipeStdin != null) {
        lines = pipeStdin.split("\n");
      } else {
        out("usage: <span class=\"amber\">uniq</span> [-c] [file]  <span class=\"muted\">// often: sort f | uniq -c</span>", "muted");
        return;
      }
      const outLines: string[] = [];
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        let j = i + 1;
        while (j < lines.length && lines[j] === line) j++;
        const n = j - i;
        const isDup = n > 1;
        if (onlyDup && !isDup) {
          i = j;
          continue;
        }
        if (onlyUnique && isDup) {
          i = j;
          continue;
        }
        outLines.push(count ? `${String(n).padStart(4)} ${line}` : line);
        i = j;
      }
      out(esc(outLines.join("\n")));
    },

    diff(args: string[]) {
      const files = args.filter((a) => !a.startsWith("-"));
      if (files.length < 2) {
        out("usage: <span class=\"amber\">diff</span> <span class=\"amber\">file1</span> <span class=\"amber\">file2</span>", "muted");
        return;
      }
      const a = rawTextFile(files[0], "diff");
      const b = rawTextFile(files[1], "diff");
      if (a.err) return out(a.err, a.cls);
      if (b.err) return out(b.err, b.cls);
      const la = (a.text ?? "").split("\n");
      const lb = (b.text ?? "").split("\n");
      if (a.text === b.text) {
        out(`<span class="muted">// files identical</span>`);
        return;
      }
      const rows: string[] = [];
      const max = Math.max(la.length, lb.length);
      let shown = 0;
      for (let i = 0; i < max && shown < 40; i++) {
        const x = la[i];
        const y = lb[i];
        if (x === y) continue;
        if (x != null && y == null) {
          rows.push(`<span class="red">- ${esc(x)}</span>`);
          shown++;
        } else if (x == null && y != null) {
          rows.push(`<span class="green">+ ${esc(y)}</span>`);
          shown++;
        } else {
          rows.push(`<span class="red">- ${esc(x!)}</span>`);
          rows.push(`<span class="green">+ ${esc(y!)}</span>`);
          shown += 2;
        }
      }
      if (shown >= 40) rows.push(`<span class="muted">// diff truncated</span>`);
      out(
        `<span class="muted">--- ${esc(files[0])}\n+++ ${esc(files[1])}</span>\n` +
          (rows.length ? rows.join("\n") : `<span class="muted">// no line-aligned diff (try shorter files)</span>`),
      );
    },

    strings(args: string[]) {
      const pathArg = args.find((a) => !a.startsWith("-"));
      const pipeStdin = getPipeStdin();
      if (!pathArg && pipeStdin != null) {
        const kept = pipeStdin
          .split("\n")
          .map((l) => l.replace(/[^\x20-\x7E\t]/g, ""))
          .filter((l) => l.length >= 4);
        out(esc(kept.join("\n") || "(no strings)"));
        return;
      }
      if (!pathArg) {
        out("usage: <span class=\"amber\">strings</span> <span class=\"amber\">file</span>", "muted");
        return;
      }
      const r = rawTextFile(pathArg, "strings");
      if (r.err) return out(r.err, r.cls);
      // Pull runs of printable ASCII ≥ 4 chars (classic strings feel)
      const hits = (r.text ?? "").match(/[\x20-\x7E]{4,}/g) || [];
      if (!hits.length) {
        out(`<span class="muted">strings: no printable runs in ${esc(pathArg)}</span>`);
        return;
      }
      out(esc(hits.slice(0, 80).join("\n")));
    },

    echo(args: string[]) {
      out(esc(args.join(" ")));
    },
  };
}
