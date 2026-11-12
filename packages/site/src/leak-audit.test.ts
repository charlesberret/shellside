import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { leakAudit } from "./leak-audit.js";

function scaffold(): { contentDir: string; distDir: string } {
  const root = mkdtempSync(path.join(tmpdir(), "leak-audit-"));
  const contentDir = path.join(root, "content");
  const distDir = path.join(root, "dist");
  mkdirSync(contentDir, { recursive: true });
  mkdirSync(path.join(contentDir, "work"));
  mkdirSync(distDir);
  writeFileSync(
    path.join(contentDir, "work", "public-one.md"),
    "---\ntitle: Public Title\nvisibility: published\n---\nvisible prose",
  );
  writeFileSync(
    path.join(contentDir, "work", "hidden-draft.md"),
    "---\ntitle: Hidden Draft\nvisibility: draft\n---\nSHELLSIDE_DRAFT_SENTINEL",
  );
  writeFileSync(path.join(distDir, "index.html"), "<html>Public Title</html>\n");
  writeFileSync(path.join(distDir, "list.txt"), "Public Title\n");
  return { contentDir, distDir };
}

test("leakAudit passes when public titles appear and drafts stay out of dist", () => {
  const { contentDir, distDir } = scaffold();
  const failures = leakAudit({
    contentDir,
    distDir,
    routeDirs: { work: "projects" },
    plaintextRoute: "list.txt",
  });
  assert.deepEqual(failures, []);
});

test("leakAudit flags draft routes and sentinels in dist", () => {
  const { contentDir, distDir } = scaffold();
  mkdirSync(path.join(distDir, "projects"), { recursive: true });
  writeFileSync(path.join(distDir, "projects", "hidden-draft.html"), "leaked");
  writeFileSync(
    path.join(distDir, "trap.html"),
    "<a href=\"/projects/hidden-draft\">draft link</a>\nSHELLSIDE_DRAFT_SENTINEL",
  );
  const failures = leakAudit({
    contentDir,
    distDir,
    routeDirs: { work: "projects" },
    plaintextRoute: false,
  });
  assert.ok(failures.some((f) => f.startsWith("draft route")));
  assert.ok(failures.some((f) => f.includes("sentinel")));
});

test("leakAudit fails on missing dist and forbidden redaction needles", () => {
  const { contentDir } = scaffold();
  const missing = leakAudit({
    contentDir,
    distDir: path.join(path.dirname(contentDir), "no-dist"),
    routeDirs: { work: "projects" },
  });
  assert.equal(missing[0], `missing ${path.join(path.dirname(contentDir), "no-dist")} — build first`);

  const { distDir } = scaffold();
  writeFileSync(path.join(distDir, "leak.txt"), "enigma-archive/foo");
  const needleFailures = leakAudit({
    contentDir,
    distDir,
    routeDirs: { work: "projects" },
    needles: ["enigma-archive/"],
    plaintextRoute: false,
  });
  assert.ok(needleFailures.some((f) => f.startsWith("redaction needle")));
});
