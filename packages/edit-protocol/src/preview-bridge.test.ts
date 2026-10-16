import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BRIDGE_SHELL_SOURCE,
  BRIDGE_PREVIEW_SOURCE,
  shellMessage,
  previewMessage,
  isShellToPreview,
  isPreviewToShell,
} from "./preview-bridge.js";

test("shell/preview message makers stamp source", () => {
  const m = shellMessage({ type: "navigate", path: "/x" });
  assert.equal(m.source, BRIDGE_SHELL_SOURCE);
  assert.equal(m.type, "navigate");
  const p = previewMessage({ type: "console-reveal", count: 3 });
  assert.equal(p.source, BRIDGE_PREVIEW_SOURCE);
});

test("guards filter by source", () => {
  assert.ok(isShellToPreview({ source: BRIDGE_SHELL_SOURCE, type: "reload" }));
  assert.ok(!isShellToPreview({ source: BRIDGE_PREVIEW_SOURCE, type: "reload" }));
  assert.ok(isPreviewToShell({ source: BRIDGE_PREVIEW_SOURCE, type: "preview-ready", path: "/", console: false }));
  assert.ok(!isPreviewToShell(null));
  assert.ok(!isPreviewToShell({ type: "preview-ready" }));
});
