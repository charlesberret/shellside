/**
 * Unit tests for terminal I/O helpers (M2.0).
 */
import assert from "node:assert/strict";
import { createStickyScroll, createOutput } from "./io.js";

{
  const el = {
    scrollHeight: 1000,
    scrollTop: 900,
    clientHeight: 100,
  };
  const sticky = createStickyScroll(() => el);
  assert.equal(sticky.isPinnedToBottom(), true);
  el.scrollTop = 100;
  assert.equal(sticky.isPinnedToBottom(), false);
  sticky.setPinned(true);
  sticky.scrollToPrompt();
  assert.equal(el.scrollTop, 1000);
  assert.equal(sticky.getPinned(), true);

  el.scrollTop = 50;
  sticky.syncPinnedFromScroll();
  assert.equal(sticky.getPinned(), false);
  sticky.scrollToPrompt(); // should not yank when unpinned
  assert.equal(el.scrollTop, 50);
  sticky.scrollToPrompt({ force: true });
  assert.equal(el.scrollTop, 1000);
}

{
  const lines = [];
  const prompt = { id: "prompt" };
  const sb = {
    insertBefore(node, ref) {
      assert.equal(ref, prompt);
      lines.push(node);
    },
  };
  let capturing = false;
  const capture = [];
  const { out, blank } = createOutput({
    getScrollback: () => sb,
    getPromptline: () => prompt,
    scrollToPrompt: () => {},
    isCapturing: () => capturing,
    pushCapture: (c) => capture.push(c),
    plainText: (html) => html.replace(/<[^>]+>/g, ""),
    createElement: (tag, opts = {}) => ({ tag, ...opts }),
  });

  out('<span class="x">hi</span>', "sp");
  assert.equal(lines.length, 1);
  assert.equal(lines[0].className, "line sp");
  assert.match(lines[0].innerHTML, /hi/);

  blank();
  assert.equal(lines.length, 2);
  assert.equal(lines[1].className, "line blank");

  capturing = true;
  out("<b>pipe</b>");
  blank();
  assert.deepEqual(capture, ["pipe", ""]);
  assert.equal(lines.length, 2); // no DOM while capturing
}

console.log("io.test.mjs: ok");
