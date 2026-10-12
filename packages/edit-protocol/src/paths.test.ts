import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseContentPath } from "./paths.js";

describe("parseContentPath", () => {
  it("parses work fields", () => {
    assert.deepEqual(parseContentPath("work:kettle:title"), {
      kind: "work", id: "kettle", field: "title", raw: "work:kettle:title",
    });
  });

  it("parses nested link leaves", () => {
    assert.deepEqual(parseContentPath("work:kettle:links.0.href"), {
      kind: "work", id: "kettle", field: "links.0.href", raw: "work:kettle:links.0.href",
    });
  });

  it("parses two-segment profile and page fields", () => {
    assert.deepEqual(parseContentPath("profile:tagline"), {
      kind: "profile", id: "_", field: "tagline", raw: "profile:tagline",
    });
    assert.deepEqual(parseContentPath("profile:experience.0.note"), {
      kind: "profile", id: "_", field: "experience.0.note", raw: "profile:experience.0.note",
    });
    assert.deepEqual(parseContentPath("page:portfolio.heroKicker"), {
      kind: "page", id: "_", field: "portfolio.heroKicker", raw: "page:portfolio.heroKicker",
    });
  });

  it("accepts the records: alias and archive sub-documents", () => {
    assert.equal(parseContentPath("records:launch:date")?.kind, "record");
    assert.deepEqual(parseContentPath("archive:cv:0.items.1"), {
      kind: "archive", id: "cv", field: "0.items.1", raw: "archive:cv:0.items.1",
    });
    assert.deepEqual(parseContentPath("archive:resume:1.title"), {
      kind: "archive", id: "resume", field: "1.title", raw: "archive:resume:1.title",
    });
  });

  it("rejects garbage", () => {
    assert.equal(parseContentPath(""), null);
    assert.equal(parseContentPath("nope"), null);
    assert.equal(parseContentPath("work:"), null);
    assert.equal(parseContentPath("work:x"), null);
    assert.equal(parseContentPath("work:x:"), null);
    assert.equal(parseContentPath("work:bad id:title"), null);
    assert.equal(parseContentPath("work:x:tit le"), null);
    assert.equal(parseContentPath("work:../x:title"), null);
    // profile/page are two-segment only
    assert.equal(parseContentPath("profile:x:y"), null);
    assert.equal(parseContentPath("page:x:y:z"), null);
    assert.equal(parseContentPath(`work:x:${"a".repeat(300)}`), null);
  });
});
