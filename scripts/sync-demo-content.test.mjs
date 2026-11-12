import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseChangelogReleases } from "./sync-demo-content.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");

const releases = parseChangelogReleases(changelog);
assert.equal(releases.length, 4);
assert.ok(releases.some((r) => r.id === "v0-4-0" && r.title === "v0.4.0"));
assert.ok(compareSemverOrder(releases[0].title, releases[releases.length - 1].title) < 0);

function compareSemverOrder(a, b) {
  const pa = a.slice(1).split(".").map(Number);
  const pb = b.slice(1).split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}
