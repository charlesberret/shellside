import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isAllowedEditPath } from "./allow.js";
import { contentFileForPath } from "./files.js";
import { editKindFromPath, fieldKindFromPath, linkIndexFromPath } from "./kinds.js";

describe("field kinds", () => {
  it("classifies link, tags, visibility, body, and scalar", () => {
    assert.equal(fieldKindFromPath("work:sample:links.0.href"), "link");
    assert.equal(linkIndexFromPath("work:sample:links.2.label"), 2);
    assert.equal(linkIndexFromPath("work:sample:title"), null);
    assert.equal(fieldKindFromPath("work:sample:tags"), "tags");
    assert.equal(fieldKindFromPath("work:sample:tags.1"), "tags");
    assert.equal(fieldKindFromPath("record:sample:visibility"), "visibility");
    assert.equal(fieldKindFromPath("work:sample:body"), "body");
    assert.equal(fieldKindFromPath("profile:longBio"), "body");
    assert.equal(fieldKindFromPath("writing:sample:note"), "scalar");
    assert.equal(fieldKindFromPath("nope"), null);
  });
});

describe("desk edit kinds", () => {
  it("classifies the way the marquee desk does", () => {
    assert.deepEqual(editKindFromPath("work:x:tags"), { editKind: "tags" });
    assert.deepEqual(editKindFromPath("work:x:links"), { editKind: "links" });
    assert.deepEqual(editKindFromPath("record:x:links"), { editKind: "links" });
    assert.deepEqual(editKindFromPath("work:x:links.2"), { editKind: "link", linkIndex: 2 });
    assert.deepEqual(editKindFromPath("work:x:links.0.href"), { editKind: "link", linkIndex: 0 });
    assert.deepEqual(editKindFromPath("writing:x:links.pdf"), { editKind: "writing-link", linkKey: "pdf" });
    assert.deepEqual(editKindFromPath("writing:x:links.html"), { editKind: "writing-link", linkKey: "html" });
    assert.deepEqual(editKindFromPath("writing:x:title"), { editKind: "text" });
    assert.deepEqual(editKindFromPath("profile:name"), { editKind: "text" });
    assert.deepEqual(editKindFromPath("nope"), { editKind: "text" });
    // links.N on writing is not a desk kind
    assert.deepEqual(editKindFromPath("writing:x:links.0"), { editKind: "text" });
  });
});

describe("allowlist", () => {
  it("allows every well-formed path by default and can drop kinds", () => {
    assert.equal(isAllowedEditPath("archive:cv:0.title"), true);
    assert.equal(isAllowedEditPath("nope"), false);
    const publicKinds = ["work", "writing", "record", "profile", "page"] as const;
    assert.equal(isAllowedEditPath("archive:cv:0.title", { kinds: publicKinds }), false);
    assert.equal(isAllowedEditPath("page:nav.about", { kinds: publicKinds }), true);
    assert.equal(
      isAllowedEditPath("work:sample:title", { fields: [/^title$/, /^links\.\d+\.label$/] }),
      true,
    );
    assert.equal(
      isAllowedEditPath("work:sample:body", { fields: [/^title$/] }),
      false,
    );
  });

  it("fieldsByKind is deny-by-default per kind", () => {
    const policy = {
      fieldsByKind: {
        work: [/^title$/, /^links\.\d+\./],
        archive: [/^\d+\.title$/, /^\d+\.items\.\d+$/],
      },
    };
    assert.equal(isAllowedEditPath("work:x:title", policy), true);
    assert.equal(isAllowedEditPath("work:x:body", policy), false);
    assert.equal(isAllowedEditPath("archive:cv:0.items.1", policy), true);
    assert.equal(isAllowedEditPath("archive:cv:1.body", policy), false);
    // kinds absent from fieldsByKind stay allowed
    assert.equal(isAllowedEditPath("writing:x:title", policy), true);
  });
});

describe("contentFileForPath", () => {
  it("maps kinds onto the marquee content layout", () => {
    assert.equal(contentFileForPath("work:sample:title"), "work/sample.md");
    assert.equal(contentFileForPath("writing:sample:year"), "writing.yaml");
    assert.equal(contentFileForPath("record:sample:date"), "records.yaml");
    assert.equal(contentFileForPath("records:sample:date"), "records.yaml");
    assert.equal(contentFileForPath("profile:name"), "profile.yaml");
    assert.equal(contentFileForPath("profile:experience.0.role"), "profile.yaml");
    assert.equal(contentFileForPath("page:projects.title"), "page-copy.yaml");
    assert.equal(contentFileForPath("archive:cv:0.title"), "cv.yaml");
    assert.equal(contentFileForPath("archive:resume:0.items.0"), "resume.yaml");
    assert.equal(contentFileForPath("work:../x:title"), null);
    assert.equal(contentFileForPath("nope"), null);
  });

  it("lets a site inject per-entry rules", () => {
    const rules = {
      writing: { dir: "writing", ext: ".md" },
      page: { dir: "page-copy", ext: ".yaml" },
    } as const;
    assert.equal(contentFileForPath("writing:sample:year", rules), "writing/sample.md");
    assert.equal(contentFileForPath("page:projects.title", rules), "page-copy/projects.yaml");
  });
});
