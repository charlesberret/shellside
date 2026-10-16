/**
 * Unit tests for createFilterCommands (M1.3a).
 * Fake out / pipeStdin / rawTextFile — no Playwright.
 */
import assert from "node:assert/strict";
import { createFilterCommands } from "./filters.js";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function makeHarness(opts = {}) {
  /** @type {string[]} */
  const painted = [];
  let pipeStdin = opts.pipeStdin ?? null;
  const out = (html, cls) => {
    painted.push(cls ? `[${cls}]${html}` : html);
  };
  const cmds = createFilterCommands({
    out,
    esc,
    getPipeStdin: () => pipeStdin,
    rawTextFile:
      opts.rawTextFile ||
      ((pathArg, verb) => ({
        err: `${verb}: ${pathArg}: no such file or directory`,
        cls: "red",
      })),
    resolvePath: opts.resolvePath || ((p) => p.split("/").filter(Boolean)),
    nodeAt: opts.nodeAt || (() => null),
    walkVfs: opts.walkVfs || (() => []),
    plainText: opts.plainText || ((b) => String(b ?? "")),
    prettyPath: opts.prettyPath || ((parts) => parts.join("/")),
    onSearchQuery: opts.onSearchQuery,
  });
  return {
    painted,
    cmds,
    setPipeStdin: (v) => {
      pipeStdin = v;
    },
  };
}

{
  const { painted, cmds } = makeHarness();
  cmds.echo(["hello", "world"]);
  assert.equal(painted.length, 1);
  assert.equal(painted[0], "hello world");
  console.log("ok: echo");
}

{
  const { painted, cmds } = makeHarness({
    pipeStdin: "one\ntwo\nthree\nfour\nfive",
  });
  cmds.head(["-n", "3"]);
  assert.equal(painted.length, 1);
  assert.equal(painted[0], "one\ntwo\nthree");
  console.log("ok: head from stdin");
}

{
  const { painted, cmds } = makeHarness({
    pipeStdin: "Alpha\nbeta\nALPHA\ngamma",
  });
  cmds.grep(["-i", "alpha"]);
  assert.equal(painted.length, 1);
  assert.match(painted[0], /Alpha/);
  assert.match(painted[0], /ALPHA/);
  assert.doesNotMatch(painted[0], /beta/);
  assert.doesNotMatch(painted[0], /gamma/);
  console.log("ok: grep -i from stdin");
}

console.log("all filter command tests passed");
