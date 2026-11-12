import assert from "node:assert/strict";
import { test } from "node:test";
import { byTitle, entryId, publicEntries } from "./public.js";

test("entryId strips markdown and yaml extensions", () => {
  assert.equal(entryId({ id: "kettle.md" }), "kettle");
  assert.equal(entryId({ id: "notes.mdx" }), "notes");
  assert.equal(entryId({ id: "list.yaml" }), "list");
});

test("publicEntries drops drafts and legacy hidden statuses", () => {
  const items = [
    { id: "a", data: { visibility: "published", title: "A" } },
    { id: "b", data: { visibility: "draft", title: "B" } },
    { id: "c", data: { status: "draft", title: "C" } },
    { id: "d", data: { status: "forthcoming", title: "D" } },
    { id: "e", data: { status: "unpublished", title: "E" } },
    { id: "f", data: { visibility: "published", status: "draft", title: "F" } },
  ];
  const out = publicEntries(items);
  assert.deepEqual(
    out.map((i) => i.id).sort(),
    ["a", "d", "f"],
  );
});

test("byTitle sorts on title then id", () => {
  const items = [
    { id: "z", data: { title: "Zebra" } },
    { id: "a", data: { title: "Alpha" } },
    { id: "m", data: {} },
  ];
  assert.deepEqual(byTitle(items).map((i) => i.id), ["a", "m", "z"]);
});
