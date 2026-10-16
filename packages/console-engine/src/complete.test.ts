import assert from "node:assert/strict";
import { test } from "node:test";
import { completeLine, commonPrefix } from "./complete.js";
import type { VfsNode } from "./path.js";

const fs: VfsNode = {
  t: "d",
  children: {
    "~": {
      t: "d",
      children: {
        "about.txt": { t: "f", body: "" },
        "about.md": { t: "f", body: "" },
        "packages": { t: "d", children: { "site.txt": { t: "f", body: "" } } },
      },
    },
  },
};
const ctx = { cmds: { ls: 1, less: 1, cat: 1 }, fs, cwd: ["~"], home: ["~"] };

test("common prefix", () => {
  assert.equal(commonPrefix(["about", "abound"]), "abou");
  assert.equal(commonPrefix([]), "");
});

test("command completion", () => {
  assert.deepEqual(completeLine("l", ctx).line, "l"); // lcp unchanged
  assert.deepEqual(completeLine("l", ctx).matches, ["less", "ls"]);
  assert.deepEqual(completeLine("l", ctx, 1).line, "less "); // cycle on repeat tab
  assert.deepEqual(completeLine("l", ctx, 2).line, "ls ");
  assert.deepEqual(completeLine("ca", ctx).line, "cat ");
});

test("path completion", () => {
  assert.deepEqual(completeLine("cat about.t", ctx).line, "cat about.txt ");
  assert.deepEqual(completeLine("cat pack", ctx).line, "cat packages/");
});
