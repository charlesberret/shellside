import assert from "node:assert/strict";
import { test } from "node:test";
import { createHistory } from "./history.js";

test("history recalls entries and restores draft", () => {
  const h = createHistory();
  h.push("ls");
  h.push("cat a.txt");
  assert.equal(h.back("typing"), "cat a.txt");
  assert.equal(h.back("cat a.txt"), "ls");
  assert.equal(h.back("ls"), null);
  assert.equal(h.forward(), "cat a.txt");
  assert.equal(h.forward(), "typing"); // draft restored
});

test("history dedupes consecutive repeats", () => {
  const h = createHistory();
  h.push("ls");
  h.push("ls");
  assert.equal(h.size(), 1);
});
