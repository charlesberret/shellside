import assert from "node:assert/strict";
import { test } from "node:test";
import { isLoopbackHost } from "./contract.js";

test("isLoopbackHost accepts localhost and 127.0.0.1 with optional port", () => {
  assert.equal(isLoopbackHost("localhost"), true);
  assert.equal(isLoopbackHost("localhost:4321"), true);
  assert.equal(isLoopbackHost("127.0.0.1"), true);
  assert.equal(isLoopbackHost("127.0.0.1:3000"), true);
});

test("isLoopbackHost rejects non-loopback hosts", () => {
  assert.equal(isLoopbackHost(""), false);
  assert.equal(isLoopbackHost("example.com"), false);
  assert.equal(isLoopbackHost("[::1]"), false);
  assert.equal(isLoopbackHost("10.0.0.1"), false);
});
