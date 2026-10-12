import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createFieldStyles, FieldStylesError } from "./field-styles-fs.js";

let contentRoot: string;

beforeEach(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "shellside-field-styles-"));
  contentRoot = path.join(root, "src", "content");
});

const palette = ["ink", "link", "dim"];

function store() {
  return createFieldStyles({ contentRoot, colorKeys: palette });
}

describe("createFieldStyles", () => {
  it("points at field-styles.yaml under the content root", () => {
    assert.equal(store().filePath, path.join(contentRoot, "field-styles.yaml"));
  });

  it("loads a missing file as an empty map and can create one", async () => {
    const styles = store();
    assert.deepEqual(await styles.load(), {});
    const saved = await styles.setRoleStyle("item-title", { size: "lg", color: "link" });
    assert.deepEqual(saved, { size: "lg", color: "link" });
    const text = await fs.readFile(styles.filePath, "utf8");
    assert.match(text, /^# Look by semantic role/);
    assert.match(text, /"lg"/);
    assert.deepEqual(await styles.styleForRole("item-title"), { size: "lg", color: "link" });
    assert.equal(await styles.styleForRole("item-title", "console"), null);
  });

  it("folds a legacy path on write and round-trips both skins", async () => {
    const styles = store();
    await styles.setPathStyle("work:kettle:title", { size: "lg", weight: "medium" });
    await styles.setRoleStyle("item-title", { case: "upper", color: "#AbC" }, "console");
    const text = await fs.readFile(styles.filePath, "utf8");
    assert.doesNotMatch(text, /work:kettle:title/);
    assert.match(text, /uppercase/);
    assert.match(text, /#aabbcc/);
    assert.deepEqual(await styles.styleForPath("record:capture:title"), {
      size: "lg",
      weight: "medium",
    });
    assert.deepEqual(await styles.styleForPath("work:kettle:title", "console"), {
      case: "uppercase",
      color: "#aabbcc",
    });
  });

  it("clears one skin and drops the role when both skins are empty", async () => {
    const styles = store();
    await styles.setRoleStyle("caption", { size: "sm" });
    await styles.setRoleStyle("caption", { case: "none" }, "console");
    await styles.setRoleStyle("caption", null);
    assert.deepEqual(await styles.styleForRole("caption", "console"), { case: "none" });
    await styles.setRoleStyle("caption", null, "console");
    assert.deepEqual(await styles.load(), {});
    const text = await fs.readFile(styles.filePath, "utf8");
    assert.match(text, /roles: \{\}/);
  });

  it("calls beforeWrite while the previous file is still on disk", async () => {
    const styles = createFieldStyles({
      contentRoot,
      colorKeys: palette,
      beforeWrite: async () => {
        const text = await fs.readFile(path.join(contentRoot, "field-styles.yaml"), "utf8");
        assert.match(text, /"lg"/);
        assert.doesNotMatch(text, /"sm"/);
      },
    });
    await styles.setRoleStyle("item-title", { size: "lg" });
    await styles.setRoleStyle("item-title", { size: "sm" });
    assert.deepEqual(await styles.styleForRole("item-title"), { size: "sm" });
  });

  it("still saves when beforeWrite throws", async () => {
    const styles = createFieldStyles({
      contentRoot,
      colorKeys: palette,
      beforeWrite: async () => {
        throw new Error("snapshot failed");
      },
    });
    await styles.setRoleStyle("page-title", { font: "display" });
    assert.deepEqual(await styles.styleForRole("page-title"), { font: "display" });
  });

  it("refuses a bad role and does not replace an unreadable file", async () => {
    const styles = store();
    await assert.rejects(styles.setRoleStyle("bad key", { size: "sm" }), FieldStylesError);
    await fs.mkdir(contentRoot, { recursive: true });
    const broken = "roles: [\n";
    await fs.writeFile(path.join(contentRoot, "field-styles.yaml"), broken);
    await assert.rejects(styles.load(), /did not parse/);
    await assert.rejects(styles.setRoleStyle("item-title", { size: "lg" }), /did not parse/);
    assert.equal(await fs.readFile(path.join(contentRoot, "field-styles.yaml"), "utf8"), broken);
  });
});
