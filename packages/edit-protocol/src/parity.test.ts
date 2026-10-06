import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isAllowedEditPath } from "./allow.js";
import { contentFileForPath } from "./files.js";
import { fieldKindFromPath, linkIndexFromPath } from "./kinds.js";

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

describe("allowlist", () => {
  it("allows every well-formed path by default and can drop kinds", () => {
    assert.equal(isAllowedEditPath("archive:sample:body"), true);
    assert.equal(isAllowedEditPath("nope"), false);
    const publicKinds = ["work", "writing", "record", "profile", "page"] as const;
    assert.equal(isAllowedEditPath("archive:sample:body", { kinds: publicKinds }), false);
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
});

describe("contentFileForPath", () => {
  it("maps kinds onto the default content layout", () => {
    assert.equal(contentFileForPath("work:sample:title"), "work/sample.md");
    assert.equal(contentFileForPath("writing:sample:year"), "writing/sample.md");
    assert.equal(contentFileForPath("record:sample:date"), "records/sample.md");
    assert.equal(contentFileForPath("profile:name"), "profile/profile.yaml");
    assert.equal(contentFileForPath("profile:experience.0.role"), "profile/profile.yaml");
    assert.equal(contentFileForPath("page:projects.title"), "page-copy/projects.yaml");
    assert.equal(contentFileForPath("page:nav.about"), "page-copy/nav.yaml");
    assert.equal(contentFileForPath("page:shared.backlink"), "page-copy/shared.yaml");
    assert.equal(contentFileForPath("archive:sample:body"), "archive/sample.md");
    assert.equal(contentFileForPath("work:../x:title"), null);
    assert.equal(contentFileForPath("nope"), null);
  });
});
