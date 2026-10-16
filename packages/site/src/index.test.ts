import assert from "node:assert/strict";
import { test } from "node:test";
import { defineShellsiteConfig, shellsite } from "./index.js";

test("config is plain data (serializable)", () => {
  const c = defineShellsiteConfig({
    identity: { name: "T" },
    collections: { work: "entries-md" },
    surfaces: { console: true },
  });
  assert.equal(JSON.parse(JSON.stringify(c)).identity.name, "T");
});

test("integration injects only declared surfaces", () => {
  const routes: string[] = [];
  const i = shellsite({
    identity: { name: "T" },
    collections: {},
    surfaces: { console: true, plaintext: false },
  });
  const hook = (i.hooks as Record<string, Function>)["astro:config:setup"];
  hook({
    injectRoute: (r: { pattern: string }) => routes.push(r.pattern),
    updateConfig: () => {},
  });
  assert.deepEqual(routes, ["/console"]);
});

test("virtual config plugin emits the config", () => {
  const routes: string[] = [];
  let viteCfg: { vite?: { plugins?: { resolveId: (id: string) => string | null; load: (id: string) => string | null }[] } } | null = null;
  const i = shellsite({
    identity: { name: "T" },
    collections: {},
    surfaces: { plaintext: true },
  });
  (i.hooks as Record<string, Function>)["astro:config:setup"]({
    injectRoute: (r: { pattern: string }) => routes.push(r.pattern),
    updateConfig: (u: typeof viteCfg) => { viteCfg = u; },
  });
  assert.deepEqual(routes, ["/list.txt"]);
  const plugin = viteCfg!.vite!.plugins![0];
  const id = plugin.resolveId("virtual:shellsite/config")!;
  assert.ok(id.startsWith("\0"));
  assert.ok(plugin.load(id)!.includes('"name":"T"'));
});
