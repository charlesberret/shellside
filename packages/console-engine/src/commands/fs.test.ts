/**
 * Lightweight tests for createFsCommands (M1.3b).
 */
import assert from "node:assert/strict";
import {
  DEFAULT_HOME,
  nodeAt as nodeAtInFs,
  prettyPath,
  resolvePath as resolvePathInFs,
} from "../path.js";
import { createFsCommands } from "./fs.js";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Tiny fixture VFS: / → ~/{ about.txt, projects/, .secret/ }
 *  (avoid bare `work` — path.js aliases ~/work → ~/projects) */
const FS = {
  t: "d",
  children: {
    "~": {
      t: "d",
      children: {
        "about.txt": { t: "f", body: "hello about" },
        projects: { t: "d", children: { "notes.txt": { t: "f", body: "notes" } } },
        ".secret": { t: "d", children: {} },
        resume: { t: "bin", url: "https://example.com/resume.pdf" },
      },
    },
  },
};

function makeHarness() {
  let cwd = ["~"];
  /** @type {{ html: string, cls?: string }[]} */
  const calls = [];
  const out = (html, cls) => {
    calls.push(cls !== undefined ? { html, cls } : { html });
  };

  const resolvePath = (arg) => resolvePathInFs(cwd, DEFAULT_HOME, FS, arg);
  const nodeAt = (parts) => nodeAtInFs(FS, parts);

  const cmds = createFsCommands({
    out,
    esc,
    getCwd: () => cwd,
    setCwd: (parts) => {
      cwd = parts;
    },
    resolvePath,
    nodeAt,
    prettyPath,
    lsShortEntry: (_node, name) => `<span class="short">${esc(name)}</span>`,
    lsLongRow: (_node, name) => `<div class="long">${esc(name)}</div>`,
    readTextFile: (pathArg, verb) => {
      const parts = resolvePath(pathArg);
      const node = nodeAt(parts);
      if (!node) return { err: `${verb}: ${esc(pathArg)}: no such file`, cls: "red" };
      if (node.t === "d") return { err: `${verb}: ${esc(pathArg)}: is a directory`, cls: "red" };
      return { body: esc(String(node.body ?? "")), label: pathArg };
    },
    fileViewCmd: () => "cat",
    openExternal: () => {},
    openLess: () => {},
    globToRegExp: (glob) => {
      let s = "";
      for (const ch of glob) {
        if (ch === "*") s += ".*";
        else if (ch === "?") s += ".";
        else s += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
      }
      return new RegExp(`^${s}$`);
    },
  });

  return {
    cmds,
    calls,
    getCwd: () => cwd,
    painted: () => calls.map((c) => c.html).join("\n"),
  };
}

{
  const { cmds, painted } = makeHarness();
  cmds.pwd();
  assert.equal(painted(), "~");
  console.log("ok: pwd");
}

{
  const { cmds, painted, calls } = makeHarness();
  cmds.ls([]);
  assert.equal(calls.length, 1);
  assert.match(calls[0].html, /lsshort/);
  assert.match(painted(), /\.\./);
  assert.match(painted(), /about\.txt/);
  assert.match(painted(), /projects/);
  assert.doesNotMatch(painted(), /\.secret/);
  assert.doesNotMatch(painted(), /lslong/);
  console.log("ok: ls short");
}

{
  const { cmds, painted, calls } = makeHarness();
  cmds.ls(["-l"]);
  assert.equal(calls.length, 1);
  assert.match(calls[0].html, /lslong/);
  assert.match(painted(), /about\.txt/);
  assert.doesNotMatch(painted(), /lsshort/);
  console.log("ok: ls -l");
}

{
  const { cmds, getCwd, calls } = makeHarness();
  cmds.cd.call(cmds, ["-q", "projects"]);
  assert.deepEqual(getCwd(), ["~", "projects"]);
  // quiet: no auto-ls
  assert.equal(calls.length, 0);
  cmds.pwd();
  assert.equal(calls[0].html, "~/projects");
  console.log("ok: cd -q");
}

{
  const { cmds, getCwd, calls } = makeHarness();
  cmds.cd.call(cmds, ["projects"]);
  assert.deepEqual(getCwd(), ["~", "projects"]);
  // auto-ls after non-quiet cd
  assert.ok(calls.length >= 1);
  assert.match(calls[0].html, /lsshort|lslong|notes/);
  console.log("ok: cd auto-ls");
}

console.log("ok: fs commands");
