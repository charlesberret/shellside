import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { exportMarqueeContent } from "./export-marquee-content.mjs";
import { isRedactedRelativePath, redactionNeedleIn } from "./redaction.mjs";

describe("redaction rules", () => {
  it("matches private directories and env files", () => {
    assert.equal(isRedactedRelativePath("archive/secret.md"), true);
    assert.equal(isRedactedRelativePath("work/archive/note.md"), true);
    assert.equal(isRedactedRelativePath("reading-rights/index.md"), true);
    assert.equal(isRedactedRelativePath(".env"), true);
    assert.equal(isRedactedRelativePath("work/lamp.md"), false);
    assert.equal(redactionNeedleIn("see enigma-archive/x"), "enigma-archive/");
    assert.equal(redactionNeedleIn("public enigma project"), null);
  });
});

describe("exportMarqueeContent", () => {
  it("copies public collections and drops private paths and needles", () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), "marquee-"));
    const content = path.join(source, "src", "content");
    const write = (rel, text) => {
      const abs = path.join(content, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, text);
    };
    write("work/lamp.md", "---\ntitle: Lamp\n---\nPublic.\n");
    write("writing/ok.md", "---\ntitle: Ok\n---\n");
    write("archive/secret.md", "enigma-archive/\n");
    write("private/note.md", "nope\n");
    write(".env", "TOKEN=1\n");
    write("work/leak.md", "points at src/content/archive/secret.md\n");
    write("reading-rights/index.md", "hidden\n");

    const out = fs.mkdtempSync(path.join(os.tmpdir(), "export-"));
    const result = exportMarqueeContent({ source, out });
    assert.equal(result.missing, false);
    assert.ok(result.copied.includes("work/lamp.md"));
    assert.ok(result.copied.includes("writing/ok.md"));
    assert.equal(fs.existsSync(path.join(out, "archive", "secret.md")), false);
    assert.equal(fs.existsSync(path.join(out, "private", "note.md")), false);
    assert.equal(fs.existsSync(path.join(out, ".env")), false);
    assert.equal(fs.existsSync(path.join(out, "work", "leak.md")), false);
    assert.equal(fs.existsSync(path.join(out, "reading-rights", "index.md")), false);
    const dumped = fs.readFileSync(path.join(out, "work", "lamp.md"), "utf8");
    assert.match(dumped, /Lamp/);
  });

  it("skips when optional and the source is missing", () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "export-missing-"));
    const result = exportMarqueeContent({
      source: path.join(os.tmpdir(), "does-not-exist-shellside"),
      out,
      optional: true,
    });
    assert.equal(result.missing, true);
    assert.deepEqual(result.copied, []);
  });
});
