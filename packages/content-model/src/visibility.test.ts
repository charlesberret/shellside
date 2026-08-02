import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterByVisibility,
  isDraftItem,
  isPublicItem,
  normalizeVisibility,
  partitionDrafts,
} from "./visibility.js";

describe("normalizeVisibility", () => {
  it("defaults missing to published", () => {
    assert.equal(normalizeVisibility(undefined), "published");
    assert.equal(normalizeVisibility(null), "published");
  });
  it("accepts draft", () => {
    assert.equal(normalizeVisibility("draft"), "draft");
  });
});

describe("filters", () => {
  const items = [
    { id: "a", data: { visibility: "published" as const } },
    { id: "b", data: { visibility: "draft" as const } },
    { id: "c", data: {} },
  ];

  it("isPublicItem", () => {
    assert.equal(isPublicItem(items[0]!), true);
    assert.equal(isPublicItem(items[1]!), false);
    assert.equal(isPublicItem(items[2]!), true);
  });

  it("filterByVisibility public", () => {
    const out = filterByVisibility(items, { includeDrafts: false });
    assert.deepEqual(
      out.map((i) => i.id),
      ["a", "c"],
    );
  });

  it("filterByVisibility admin includes drafts", () => {
    const out = filterByVisibility(items, { includeDrafts: true });
    assert.equal(out.length, 3);
  });

  it("partitionDrafts", () => {
    const { published, drafts } = partitionDrafts(items);
    assert.equal(drafts.length, 1);
    assert.equal(published.length, 2);
  });

  it("isDraftItem", () => {
    assert.equal(isDraftItem(items[1]!), true);
    assert.equal(isDraftItem({ visibility: "draft" }), true);
  });
});
