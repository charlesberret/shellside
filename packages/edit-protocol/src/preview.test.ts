import assert from "node:assert/strict";
import { test } from "node:test";
import { ADMIN_PREVIEW_PARAM, isAdminPreviewUrl, withAdminPreview } from "./preview.js";

test("isAdminPreviewUrl reads the flag", () => {
  assert.ok(isAdminPreviewUrl("/portfolio/?adminPreview=1"));
  assert.ok(isAdminPreviewUrl("https://x.test/console/?a=b&adminPreview=1"));
  assert.ok(isAdminPreviewUrl(new URL("http://x/?adminPreview=1")));
  assert.ok(!isAdminPreviewUrl("/?adminPreview=0"));
  assert.ok(!isAdminPreviewUrl("/portfolio/"));
  assert.ok(!isAdminPreviewUrl(null));
  assert.ok(!isAdminPreviewUrl("not a url at all"));
});

test("withAdminPreview sets the flag, preserving query", () => {
  assert.equal(withAdminPreview("/x/?a=1#y"), "/x/?a=1&adminPreview=1#y");
  assert.equal(withAdminPreview("/"), "/?adminPreview=1");
});

test("param name is the documented literal", () => {
  assert.equal(ADMIN_PREVIEW_PARAM, "adminPreview");
});
