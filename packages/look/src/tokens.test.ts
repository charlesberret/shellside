import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  isSafeCssValue,
  isSafeFontStack,
  mergeTokens,
  validateTokenUpdate,
} from "./tokens.js";
import {
  createDesignTokens,
  createPalettePresets,
} from "./design-tokens-fs.js";

const KEYS = {
  sizes: ["base", "lg"],
  colors: ["ink", "cool"],
  fonts: ["sans", "mono"],
};
const DEFAULTS = {
  sizes: { base: "1rem", lg: "1.5rem" },
  colors: { ink: "#ddd", cool: "#3391f3" },
  fonts: { sans: "system-ui, sans-serif", mono: "ui-monospace" },
};

test("isSafeCssValue", () => {
  for (const ok of ["1rem", "#fff", "#a1b2c3", "clamp(1rem, 2vw, 3rem)", "rgb(1,2,3)", "inherit", "calc(1rem + 2px)", "var(--x, 1rem)"])
    assert.ok(isSafeCssValue(ok), ok);
  for (const bad of ["", "1rem;position:fixed", "url(x)", "/*x*/", "{", "a".repeat(200)])
    assert.ok(!isSafeCssValue(bad), bad);
});

test("isSafeFontStack", () => {
  assert.ok(isSafeFontStack('"Foo Bar", system-ui, sans-serif'));
  assert.ok(!isSafeFontStack('x;body{color:red}'));
});

test("mergeTokens merges only known keys and safe values", () => {
  const merged = mergeTokens(
    { sizes: { lg: "2rem", nope: "9rem", base: "url(evil)" }, colors: { cool: "#fff" } },
    DEFAULTS,
    KEYS,
  );
  assert.equal(merged.sizes.lg, "2rem");
  assert.equal(merged.sizes.base, "1rem");
  assert.equal(merged.sizes.nope, undefined);
  assert.equal(merged.colors.cool, "#fff");
  assert.equal(merged.fonts.sans, "system-ui, sans-serif");
});

test("design tokens fs: defaults on missing file, set writes, unsafe throws", async () => {
  const dirp = await mkdtemp(path.join(tmpdir(), "dt-"));
  const store = createDesignTokens({ contentRoot: dirp, defaults: DEFAULTS, keys: KEYS });
  assert.deepEqual((await store.load()).colors.ink, "#ddd");
  const next = await store.set({ colors: { cool: "#123456" } });
  assert.equal(next.colors.cool, "#123456");
  const disk = await readFile(store.filePath, "utf8");
  assert.ok(disk.includes("cool"));
  assert.deepEqual((await store.load()).colors.cool, "#123456");
  await assert.rejects(() => store.set({ sizes: { lg: "1rem;hack{}" } }));
  await rm(dirp, { recursive: true, force: true });
});

test("presets fs: round-trip, builtins reserved, unsafe names rejected", async () => {
  const dirp = await mkdtemp(path.join(tmpdir(), "pr-"));
  const presets = createPalettePresets({
    contentRoot: dirp,
    defaults: DEFAULTS,
    keys: KEYS,
    builtinPresets: () => [{ name: "default", note: "site", colors: { ...DEFAULTS.colors }, sizes: { ...DEFAULTS.sizes } }],
  });
  assert.equal((await presets.list())[0].name, "default");
  const saved = await presets.save("dusk", { tokens: DEFAULTS, note: "x" });
  assert.equal(saved.colors.cool, "#3391f3");
  assert.equal((await presets.get("dusk"))?.name, "dusk");
  await assert.rejects(() => presets.save("default", { tokens: DEFAULTS }));
  await assert.rejects(() => presets.save("../evil", { tokens: DEFAULTS }));
  assert.equal(await presets.remove("dusk"), true);
  assert.equal(await presets.remove("dusk"), false);
  await rm(dirp, { recursive: true, force: true });
});
