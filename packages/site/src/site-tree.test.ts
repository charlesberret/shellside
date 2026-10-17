import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseDotConfig, projectSiteTree } from "./site-tree.js";

function scaffold(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "sitetree-"));
  writeFileSync(path.join(dir, ".site"), "name: Demo\ntagline: a test site\n");
  writeFileSync(path.join(dir, "readme.md"), "---\ntitle: Read Me\n---\nroot-level entry");
  mkdirSync(path.join(dir, "packages"));
  writeFileSync(path.join(dir, "packages", ".meta"), "title: Packages\norder: 1\nblurb: the kit\n");
  writeFileSync(path.join(dir, "packages", "site.md"), "---\ntitle: site\nvisibility: published\n---\nhost package");
  writeFileSync(path.join(dir, "packages", ".secret-notes.md"), "hidden");
  mkdirSync(path.join(dir, "packages", "arch"));
  writeFileSync(path.join(dir, "packages", "arch", "decisions.md"), "---\ntitle: Decisions\n---\nadr list");
  mkdirSync(path.join(dir, "docs"));
  writeFileSync(path.join(dir, "docs", "roadmap.md"), "---\ntitle: Roadmap\n---\nplan");
  return dir;
}

test("dotconfig parses key: value", () => {
  assert.deepEqual(parseDotConfig("name: X\n# c\nfoo:  bar baz "), { name: "X", foo: "bar baz" });
});

test("tree maps dirs to sections, files to entries, dots to hidden", () => {
  const t = projectSiteTree(scaffold());
  assert.equal(t.site.name, "Demo");
  assert.deepEqual(t.hidden.map((h) => h.path).sort(), ["~/.site", "~/packages/.meta", "~/packages/.secret-notes.md"]);
  assert.equal(t.entries[0].slug, "readme");
  assert.equal(t.sections[0].dir, "packages"); // .meta order 1
  assert.equal(t.sections[0].title, "Packages");
  assert.equal(t.sections[0].blurb, "the kit");
  const slugs = t.sections[0].entries.map((e) => e.slug).sort();
  assert.deepEqual(slugs, ["packages/arch/decisions", "packages/site"]);
  assert.equal(t.sections[1].dir, "docs");
});

test("root yaml list becomes a section", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "sitetree-"));
  writeFileSync(path.join(dir, "docs.yaml"), "- id: a\n  title: Doc A\n- id: b\n  title: Doc B\n");
  const t = projectSiteTree(dir);
  assert.equal(t.sections.length, 1);
  assert.equal(t.sections[0].dir, "docs");
  assert.equal(t.sections[0].entries[0].title, "Doc A");
});
