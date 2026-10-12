import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isSafeRoleKey,
  mergeStyles,
  normalizeEntry,
  normalizeLookColor,
  normalizeStyle,
  parseFieldStylesRoot,
  styleForSkin,
} from "./field-styles.js";

const palette = ["ink", "ink-2", "dim", "link", "cool", "warm"];

describe("normalizeLookColor", () => {
  it("keeps a palette name and expands short hex", () => {
    assert.equal(normalizeLookColor("ink", palette), "ink");
    assert.equal(normalizeLookColor("#AbC", palette), "#aabbcc");
    assert.equal(normalizeLookColor("#3192F7", palette), "#3192f7");
  });

  it("drops inherit, unknown names, and non-colors", () => {
    assert.equal(normalizeLookColor("inherit", palette), null);
    assert.equal(normalizeLookColor("ink", []), null);
    assert.equal(normalizeLookColor("javascript:alert(1)", palette), null);
    assert.equal(normalizeLookColor("#gggggg", palette), null);
    assert.equal(normalizeLookColor(""), null);
  });
});

describe("normalizeStyle", () => {
  it("drops inherit and unknown slots, and lengthens short case names", () => {
    assert.deepEqual(
      normalizeStyle(
        {
          size: "lg",
          color: "ink",
          font: "nope",
          weight: "inherit",
          leading: "prose",
          case: "upper",
        },
        { colorKeys: palette },
      ),
      { size: "lg", color: "ink", leading: "prose", case: "uppercase" },
    );
  });

  it("returns null for an empty or non-object style", () => {
    assert.equal(normalizeStyle({ size: "inherit", color: "nope" }, { colorKeys: palette }), null);
    assert.equal(normalizeStyle(null), null);
    assert.equal(normalizeStyle("lg"), null);
  });
});

describe("normalizeEntry", () => {
  it("treats a flat style as portfolio only", () => {
    const entry = normalizeEntry({ size: "sm", color: "dim" }, { colorKeys: palette });
    assert.deepEqual(entry, { portfolio: { size: "sm", color: "dim" } });
    assert.equal(styleForSkin(entry, "console"), null);
    assert.deepEqual(styleForSkin(entry, "portfolio"), { size: "sm", color: "dim" });
  });

  it("prefers nested portfolio over flat keys", () => {
    const entry = normalizeEntry(
      { size: "sm", portfolio: { size: "lg" }, console: { case: "lowercase" } },
      { colorKeys: palette },
    );
    assert.deepEqual(entry, {
      portfolio: { size: "lg" },
      console: { case: "lowercase" },
    });
  });

  it("does not let the console skin inherit portfolio", () => {
    const entry = normalizeEntry({ portfolio: { size: "lg", color: "ink" } }, { colorKeys: palette });
    assert.equal(styleForSkin(entry, "console"), null);
  });
});

describe("parseFieldStylesRoot", () => {
  it("reads the roles bag and skips unsafe keys", () => {
    const map = parseFieldStylesRoot(
      {
        roles: {
          "item-title": { portfolio: { size: "lg", color: "link" } },
          "bad key": { portfolio: { size: "sm" } },
          "../x": { portfolio: { size: "sm" } },
        },
      },
      { colorKeys: palette },
    );
    assert.deepEqual(Object.keys(map), ["item-title"]);
    assert.equal(isSafeRoleKey("bad key"), false);
  });

  it("folds legacy path keys into one role and lets the later key win", () => {
    const map = parseFieldStylesRoot(
      {
        roles: {
          "work:kettle:title": { portfolio: { size: "lg", color: "ink" } },
          "record:capture:title": { portfolio: { size: "sm" }, console: { case: "none" } },
        },
      },
      { colorKeys: palette },
    );
    assert.deepEqual(map["item-title"], {
      portfolio: { size: "sm", color: "ink" },
      console: { case: "none" },
    });
  });

  it("accepts a root that is already the role bag", () => {
    const map = parseFieldStylesRoot(
      { "page-title": { size: "3xl", font: "display" } },
      { colorKeys: palette },
    );
    assert.deepEqual(map["page-title"], { portfolio: { size: "3xl", font: "display" } });
  });
});

describe("mergeStyles", () => {
  it("lets over win and returns null when both sides are empty", () => {
    assert.deepEqual(mergeStyles({ size: "lg", color: "ink" }, { size: "sm" }), {
      size: "sm",
      color: "ink",
    });
    assert.equal(mergeStyles(null, null), null);
  });
});
