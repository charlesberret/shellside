import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import {
  buildListTxtLines,
  buildLlmsTxtLines,
  buildSectionTxt,
  projectSiteTree,
} from "./site-tree.js";

const fixture = path.join(import.meta.dirname, "..", "..", "..", "apps", "demo", "src", "content");

test("plaintext endpoints project demo content tree", () => {
  const tree = projectSiteTree(fixture);
  const list = buildListTxtLines(tree, "Shellside").join("\n");
  assert.match(list, /console-engine/);
  assert.match(list, /^packages$/m);

  const llms = buildLlmsTxtLines(tree, "Shellside", "tagline", "/shellside").join("\n");
  assert.match(llms, /console-engine/);
  assert.match(llms, /\[console-engine\]/);

  const section = buildSectionTxt(tree, "packages", "Shellside", "https://example.test/", "/shellside");
  assert.ok(section);
  assert.match(section!, /console-engine/);
  assert.match(section!, /page: https:\/\/example\.test\/shellside\/packages\/console-engine/);
});
