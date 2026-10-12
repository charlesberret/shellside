import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crossSkinStyle, isLookRoleId, pathToLookRole } from "./roles.js";
import { FONT_KEYS, SIZE_KEYS } from "./options.js";
import { WEIGHT_CSS, WEIGHT_KEYS } from "./weights.js";
import { isSafeLookSnapshotId, localDateISO } from "./history.js";

const ROLES: Record<string, string> = {
  "work:sample:title": "item-title",
  "writing:sample:title": "item-title",
  "record:sample:title": "item-title",
  "work:sample:summary": "item-summary",
  "writing:sample:summary": "item-summary",
  "writing:sample:subtitle": "item-summary",
  "writing:sample:description": "item-summary",
  "record:sample:summary": "item-summary",
  "work:sample:body": "item-body",
  "writing:sample:note": "item-note",
  "work:sample:kind": "item-meta",
  "work:sample:org": "item-meta",
  "work:sample:dates": "item-meta",
  "writing:sample:venue": "item-meta",
  "writing:sample:role": "item-meta",
  "writing:sample:award": "item-meta",
  "writing:sample:year": "item-meta",
  "writing:sample:byline": "item-meta",
  "writing:sample:coauthors": "item-meta",
  "record:sample:type": "item-meta",
  "record:sample:venue": "item-meta",
  "record:sample:role": "item-meta",
  "record:sample:date": "item-meta",
  "work:sample:tags": "caption",
  "record:sample:date": "item-meta",
  "work:sample:links.0.label": "link-label",
  "work:sample:links.0.href": "link-href",
  "record:sample:links.3.description": "link-desc",
  "profile:name": "site-name",
  "profile:tagline": "hero-tagline",
  "page:nav.projects": "nav-label",
  "page:contact.github": "contact-copy",
  "page:shared.backlink": "caption",
  "page:projects.kicker": "page-kicker",
  "page:projects.title": "page-title",
  "page:about.sub": "page-sub",
  "page:projects.sectionCurrent": "section-heading",
  "page:index.sectionProjects": "section-heading",
  "page:writing.groupBook": "section-heading",
};

describe("pathToLookRole", () => {
  for (const [pathKey, role] of Object.entries(ROLES)) {
    it(`${pathKey} → ${role}`, () => {
      assert.equal(pathToLookRole(pathKey), role);
      assert.equal(isLookRoleId(role), true);
    });
  }

  it("leaves ungrouped live paths as themselves", () => {
    assert.equal(pathToLookRole("writing:sample:type"), "writing:sample:type");
    // Parity with the marquee map: profile list rows resolve to shared roles
    assert.equal(pathToLookRole("profile:shortBio"), "page-sub");
    assert.equal(pathToLookRole("profile:longBio"), "item-body");
    assert.equal(pathToLookRole("profile:skills.0.heading"), "profile-skills-heading");
    assert.equal(pathToLookRole("profile:skills.2.detail"), "profile-skills-detail");
    assert.equal(pathToLookRole("profile:experience.1.years"), "profile-experience-years");
    assert.equal(pathToLookRole("profile:experience.0.org"), "profile-experience-org");
    assert.equal(pathToLookRole("profile:experience.3.role"), "profile-experience-role");
    assert.equal(pathToLookRole("profile:experience.0.note"), "profile-experience-note");
    assert.equal(pathToLookRole("profile:education.0.year"), "profile-education-year");
    assert.equal(pathToLookRole("profile:education.0.degree"), "profile-education-degree");
    assert.equal(pathToLookRole("profile:education.2.where"), "profile-education-where");
    assert.equal(pathToLookRole("profile:now.intro"), "profile-now-intro");
    assert.equal(pathToLookRole("profile:now.projects.0.title"), "profile-now-title");
    assert.equal(pathToLookRole("profile:now.projects.1.detail"), "profile-now-detail");
    assert.equal(pathToLookRole("profile:selectedProjects.0.blurb"), "profile-selected-blurb");
    assert.equal(pathToLookRole("page:portfolio.heroKicker"), "page-kicker");
    assert.equal(pathToLookRole("page:index.completeIndex"), "caption");
    assert.equal(pathToLookRole("work:sample:tags.0"), "work:sample:tags.0");
    for (const id of [
      "profile-skills-heading","profile-experience-role","profile-now-intro","profile-selected-blurb",
    ]) assert.ok(isLookRoleId(id), id);
    assert.equal(pathToLookRole("page:console.nowOpenLabel"), "page:console.nowOpenLabel");
    assert.equal(pathToLookRole("page:portfolio.heroAccent2"), "page:portfolio.heroAccent2");
    assert.equal(pathToLookRole(""), "");
  });
});

describe("crossSkinStyle", () => {
  it("copies color and case only", () => {
    assert.deepEqual(
      crossSkinStyle({
        color: "#5b6aff",
        case: "upper",
        size: "lg",
        font: "prose",
        weight: "medium",
        leading: "body",
      }),
      { color: "#5b6aff", case: "upper" },
    );
  });

  it("returns an empty style for missing input", () => {
    assert.deepEqual(crossSkinStyle(undefined), {});
    assert.deepEqual(crossSkinStyle({}), {});
  });
});

describe("option lists", () => {
  it("covers the marquee size and font slots and the weight scale", () => {
    assert.ok(SIZE_KEYS.includes("2xs"));
    assert.ok(SIZE_KEYS.includes("3xl"));
    assert.ok(FONT_KEYS.includes("prose"));
    assert.ok(FONT_KEYS.includes("display"));
    assert.equal(WEIGHT_CSS[WEIGHT_KEYS[0]!], "100");
    assert.equal(WEIGHT_CSS.black, "900");
  });
});

describe("look history ids", () => {
  it("accepts previous and daily ids", () => {
    assert.equal(isSafeLookSnapshotId("previous"), true);
    assert.equal(isSafeLookSnapshotId("2026-10-06"), true);
    assert.equal(isSafeLookSnapshotId("../previous"), false);
    assert.match(localDateISO(new Date("2026-10-06T12:00:00")), /^\d{4}-\d{2}-\d{2}$/);
  });
});
