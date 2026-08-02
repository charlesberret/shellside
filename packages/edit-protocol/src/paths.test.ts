import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isWellFormedEditPath,
  linkLeafFromPath,
  parseContentPath,
} from "./paths.js";

describe("parseContentPath", () => {
  it("parses work fields", () => {
    const p = parseContentPath("work:kettle:title");
    assert.equal(p?.kind, "work");
    assert.equal(p?.id, "kettle");
    assert.equal(p?.field, "title");
  });

  it("parses nested link leaves", () => {
    const p = parseContentPath("record:launch-x:links.0.href");
    assert.equal(p?.field, "links.0.href");
    assert.equal(linkLeafFromPath(p!.raw), "href");
  });

  it("parses two-segment profile", () => {
    const p = parseContentPath("profile:name");
    assert.equal(p?.kind, "profile");
    assert.equal(p?.field, "name");
  });

  it("rejects garbage", () => {
    assert.equal(parseContentPath(""), null);
    assert.equal(isWellFormedEditPath("nope"), false);
  });
});
