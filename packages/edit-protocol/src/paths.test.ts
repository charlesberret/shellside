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
    assert.equal(parseContentPath("work::title"), null);
    assert.equal(parseContentPath("work:sample:"), null);
    assert.equal(parseContentPath("work:sample:title extra"), null);
    assert.equal(parseContentPath(`work:${"x".repeat(300)}:title`), null);
  });

  it("parses live two-segment profile and page fields", () => {
    const profile = parseContentPath("profile:experience.0.role");
    assert.equal(profile?.kind, "profile");
    assert.equal(profile?.id, "_");
    assert.equal(profile?.field, "experience.0.role");

    const page = parseContentPath("page:projects.sectionCurrent");
    assert.equal(page?.kind, "page");
    assert.equal(page?.field, "projects.sectionCurrent");

    const now = parseContentPath("profile:now.intro");
    assert.equal(now?.field, "now.intro");
  });

  it("parses writing, record, archive, tags, and visibility", () => {
    assert.equal(parseContentPath("writing:sample:byline")?.field, "byline");
    assert.equal(parseContentPath("writing:sample:type")?.kind, "writing");
    assert.equal(parseContentPath("record:sample:date")?.field, "date");
    assert.equal(parseContentPath("archive:sample:body")?.kind, "archive");
    assert.equal(parseContentPath("work:sample:tags")?.field, "tags");
    assert.equal(parseContentPath("work:sample:tags.2")?.field, "tags.2");
    assert.equal(parseContentPath("work:sample:visibility")?.field, "visibility");
    assert.equal(linkLeafFromPath("work:sample:links.2.description"), "description");
    assert.equal(linkLeafFromPath("work:sample:title"), null);
  });
});
