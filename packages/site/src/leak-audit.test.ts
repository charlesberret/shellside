import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { leakAudit } from "./leak-audit.js";

const routeDirs = { work: "projects" };

function scaffoldDist(extra: { relFiles?: Record<string, string>; globalText?: string } = {}): string {
  const dir = mkdtempSync(path.join(tmpdir(), "leak-dist-"));
  const page = `<html><body>${extra.globalText ?? "Visible Project"}</body></html>`;
  mkdirSync(path.join(dir, "projects", "visible"), { recursive: true });
  writeFileSync(path.join(dir, "projects", "visible", "index.html"), page);
  writeFileSync(path.join(dir, "list.txt"), "Visible Project\n");
  for (const [rel, body] of Object.entries(extra.relFiles ?? {})) {
    const abs = path.join(dir, ...rel.split("/"));
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, body);
  }
  return dir;
}

function scaffoldContent(workYaml: string, extraMd?: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), "leak-content-"));
  writeFileSync(path.join(dir, "work.yaml"), workYaml);
  if (extraMd) writeFileSync(path.join(dir, "work", "visible.md"), extraMd);
  return dir;
}

const publicRow = `- id: visible
  title: Visible Project
  visibility: published
`;

test("clean audit when dist matches public content only", () => {
  const contentDir = scaffoldContent(publicRow);
  const distDir = scaffoldDist();
  assert.deepEqual(leakAudit({ contentDir, distDir, routeDirs }), []);
});

test("draft route emitted is reported", () => {
  const contentDir = scaffoldContent(`${publicRow}- id: hidden-one
  title: Hidden One
  visibility: draft
`);
  const distDir = scaffoldDist({
    relFiles: { "projects/hidden-one/index.html": "<html>leak</html>" },
  });
  const failures = leakAudit({ contentDir, distDir, routeDirs });
  assert.ok(failures.some((f) => f.startsWith("draft route emitted:")));
});

test("draft sentinel leaked in dist is reported", () => {
  const contentDir = scaffoldContent(`${publicRow}- id: sentinel-draft
  title: Sentinel Draft
  visibility: draft
  body: |
    marker SHELLSIDE_UNIT_TEST_SENTINEL here
`);
  const distDir = scaffoldDist({
    globalText: "Visible Project\nSHELLSIDE_UNIT_TEST_SENTINEL",
  });
  const failures = leakAudit({ contentDir, distDir, routeDirs });
  assert.ok(failures.some((f) => f.startsWith("draft sentinel leaked:")));
});

test("id-less draft yaml row is audited via title slug", () => {
  const contentDir = scaffoldContent(`${publicRow}- title: No Id Draft
  visibility: draft
`);
  const distDir = scaffoldDist({
    relFiles: { "projects/No Id Draft/index.html": "<html>leak</html>" },
  });
  const failures = leakAudit({ contentDir, distDir, routeDirs });
  assert.ok(failures.some((f) => f.includes("No Id Draft")));
});

test("vacuous audit when sentinel marker present but no draft sentinels", () => {
  const contentDir = scaffoldContent(publicRow);
  const distDir = scaffoldDist();
  const marker = path.join(contentDir, ".sentinel-fixture");
  writeFileSync(marker, "fixture");
  const failures = leakAudit({
    contentDir,
    distDir,
    routeDirs,
    sentinelMarkerFile: marker,
  });
  assert.ok(failures.some((f) => f.includes("vacuous")));
});

test("redaction needle in dist is reported", () => {
  const contentDir = scaffoldContent(publicRow);
  const distDir = scaffoldDist({
    globalText: "Visible Project and REDACT_ME_NOW",
  });
  const failures = leakAudit({
    contentDir,
    distDir,
    routeDirs,
    needles: ["REDACT_ME_NOW"],
  });
  assert.ok(failures.some((f) => f.startsWith("redaction needle in dist:")));
});
