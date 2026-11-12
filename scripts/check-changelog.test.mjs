import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkChangelogFile, lintChangelog } from "./check-changelog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("lintChangelog", () => {
  it("rejects duplicate ### headings in one section", () => {
    const fixture = `## [Unreleased]

### Changed

- one

### Changed

- two
`;
    const errors = lintChangelog(fixture, { file: "fixture.md" });
    assert.ok(errors.some((e) => /duplicate ### Changed/.test(e)));
  });

  it("rejects list entries with no ### heading in a release section", () => {
    const fixture = `## [0.9.0] — 2099-01-01

Intro prose.

- orphan bullet
`;
    const errors = lintChangelog(fixture, { file: "fixture.md" });
    assert.ok(errors.some((e) => /list entry without a ### heading/.test(e)));
  });

  it("requires a link reference for each semver section", () => {
    const fixture = `## [1.0.0] — 2099-01-01

### Added

- shipped
`;
    const errors = lintChangelog(fixture, { file: "fixture.md" });
    assert.ok(errors.some((e) => /missing link reference for \[1\.0\.0\]/.test(e)));
  });
});

describe("checkChangelogFile", () => {
  it("accepts the repo CHANGELOG.md", () => {
    const errors = checkChangelogFile(path.join(root, "CHANGELOG.md"));
    assert.deepEqual(errors, []);
  });
});
