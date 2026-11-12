import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFrontmatter } from "./frontmatter.js";

test("parseFrontmatter returns full text when frontmatter is absent", () => {
  const body = "no delimiter here";
  assert.deepEqual(parseFrontmatter(body), { data: {}, body });
});

test("parseFrontmatter parses scalars and strips quoted values", () => {
  const text = `---
title: Hello
visibility: draft
status: "quoted"
tag: 'single'
---
Body line one
`;
  const { data, body } = parseFrontmatter(text);
  assert.equal(data.title, "Hello");
  assert.equal(data.visibility, "draft");
  assert.equal(data.status, "quoted");
  assert.equal(data.tag, "single");
  assert.equal(body.trim(), "Body line one");
});

test("parseFrontmatter tolerates unclosed delimiter as plain body", () => {
  const text = "---\ntitle: Orphan\nno closing fence";
  assert.deepEqual(parseFrontmatter(text).data, {});
  assert.equal(parseFrontmatter(text).body, text);
});
