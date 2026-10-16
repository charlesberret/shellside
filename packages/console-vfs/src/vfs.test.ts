import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bin,
  chr,
  dir,
  file,
  link,
  mount,
  nodeAt,
  projectCollections,
  walk,
} from "./index.js";

test("dir/file/bin/chr constructors", () => {
  const f = file("body");
  assert.deepEqual(f, { t: "f", body: "body", html: false, url: undefined, links: [], compactLinks: false });
  assert.deepEqual(link("/u"), { t: "f", body: "→ /u", html: false, url: "/u", links: [], compactLinks: false });
  const d = dir({ a: file("hi") });
  assert.equal(d.t, "d");
  assert.equal((d.children.a as any).body, "hi");
  assert.deepEqual(bin("/files/x.pdf"), { t: "bin", url: "/files/x.pdf" });
  assert.equal(chr(() => "live").gen(), "live");
});

test("mount mkdir -p and nodeAt", () => {
  const root = dir({ "~": dir({}) });
  mount(root, ["~", "a", "b", "c.txt"], file("deep"));
  assert.equal((nodeAt(root, ["~", "a", "b", "c.txt"]) as any).body, "deep");
  assert.equal(nodeAt(root, ["~", "a", "b"]), (root.children["~"] as any).children.a.children.b);
  assert.equal(nodeAt(root, ["~", "nope"]), null);
  assert.equal(nodeAt(root, ["~", "a", "b", "c.txt", "under"]), null);
  assert.equal(nodeAt(null, ["~"]), null);
});

test("walk yields every node depth-first", () => {
  const root = dir({ a: dir({ b: file("x") }), c: file("y") });
  const paths = [...walk(root)].map(([p]) => p.join("/"));
  assert.deepEqual(paths, ["a", "a/b", "c"]);
});

test("projectCollections flat spec", () => {
  const out = projectCollections([
    {
      dir: "writing",
      html: true,
      items: [
        { slug: "one", body: "<p>1</p>", url: "/writing/one", links: [{ label: "L", href: "https://x" }] },
        { slug: "two", body: "plain" },
        { slug: "", body: "skip" },
      ],
    },
  ]);
  const w = out.writing;
  assert.equal(w.t, "d");
  const names = Object.keys(w.children);
  assert.deepEqual(names, ["one.md", "two.md"]);
  assert.equal((w.children["one.md"] as any).url, "/writing/one");
  assert.equal((w.children["one.md"] as any).html, true);
  assert.equal((w.children["one.md"] as any).links[0].label, "L");
});

test("projectCollections grouped by section", () => {
  const out = projectCollections([
    {
      dir: "index",
      ext: "txt",
      groupBySection: true,
      items: [
        { slug: "a", body: "1", section: "talks" },
        { slug: "b", body: "2", section: "talks" },
        { slug: "c", body: "3", section: "press" },
        { slug: "d", body: "4" },
      ],
    },
  ]);
  const idx = out.index;
  assert.equal((idx.children.talks as any).children["a.txt"].body, "1");
  assert.equal((idx.children.talks as any).children["b.txt"].body, "2");
  assert.equal((idx.children.press as any).children["c.txt"].body, "3");
  assert.equal((idx.children.misc as any).children["d.txt"].body, "4");
});

test("chr bodies regenerate per read", () => {
  let n = 0;
  const c = chr(() => `read ${++n}`);
  assert.equal(c.gen(), "read 1");
  assert.equal(c.gen(), "read 2");
});
