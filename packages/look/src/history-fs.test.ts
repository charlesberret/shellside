import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createLookHistory } from "./fs.js";

let root: string;
let contentRoot: string;
let historyDir: string;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "shellside-look-"));
  contentRoot = path.join(root, "src", "content");
  historyDir = path.join(root, ".look-history", "field-styles");
  await fs.mkdir(contentRoot, { recursive: true });
});

const write = (text: string) => fs.writeFile(path.join(contentRoot, "field-styles.yaml"), text);
const read = () => fs.readFile(path.join(contentRoot, "field-styles.yaml"), "utf8");

describe("createLookHistory", () => {
  it("defaults historyDir to the site root beside src/content", () => {
    assert.equal(createLookHistory({ contentRoot }).historyDir, historyDir);
  });

  it("does nothing when field-styles.yaml is absent", async () => {
    const h = createLookHistory({ contentRoot });
    await h.snapshotBeforeWrite();
    assert.deepEqual(await h.list(), []);
  });

  it("keeps the first state of the day and the state before the last write", async () => {
    const h = createLookHistory({ contentRoot, now: () => new Date(2026, 9, 11, 12) });
    await write("v1");
    await h.snapshotBeforeWrite();
    await write("v2");
    await h.snapshotBeforeWrite();
    await write("v3");
    assert.equal(await fs.readFile(path.join(historyDir, "2026-10-11.yaml"), "utf8"), "v1");
    assert.equal(await fs.readFile(path.join(historyDir, "previous.yaml"), "utf8"), "v2");
    assert.deepEqual((await h.list()).map((s) => s.id), ["previous", "2026-10-11"]);
  });

  it("restores a snapshot and makes the restore undoable", async () => {
    const h = createLookHistory({ contentRoot, now: () => new Date(2026, 9, 11, 12) });
    await write("v1");
    await h.snapshotBeforeWrite();
    await write("v2");
    const result = await h.restore("2026-10-11");
    assert.deepEqual(result, { id: "2026-10-11", bytes: 2 });
    assert.equal(await read(), "v1");
    assert.equal(await fs.readFile(path.join(historyDir, "previous.yaml"), "utf8"), "v2");
  });

  it("rejects unsafe, missing, and empty snapshots", async () => {
    const h = createLookHistory({ contentRoot, historyDir });
    await assert.rejects(h.restore("../field-styles"), /bad snapshot id/);
    await assert.rejects(h.restore("2026-01-01"), /snapshot not found/);
    await fs.mkdir(historyDir, { recursive: true });
    await fs.writeFile(path.join(historyDir, "previous.yaml"), "  \n");
    await assert.rejects(h.restore("previous"), /snapshot empty/);
  });

  it("prunes daily snapshots past retainDays", async () => {
    await fs.mkdir(historyDir, { recursive: true });
    const stale = path.join(historyDir, "2026-01-01.yaml");
    await fs.writeFile(stale, "old");
    const old = new Date(2026, 0, 1);
    await fs.utimes(stale, old, old);
    await write("v1");
    await createLookHistory({ contentRoot, retainDays: 30 }).snapshotBeforeWrite();
    await assert.rejects(fs.access(stale));
  });
});
