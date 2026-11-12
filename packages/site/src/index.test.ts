import assert from "node:assert/strict";
import { test } from "node:test";
import { defineShellsiteConfig, isLoopbackServerBind, shellsite } from "./index.js";

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
  assert.deepEqual(routes, ["/list.txt", "/[section].txt"]);
  const plugin = viteCfg!.vite!.plugins![0];
  const id = plugin.resolveId("virtual:shellsite/config")!;
  assert.ok(id.startsWith("\0"));
  assert.ok(plugin.load(id)!.includes('"name":"T"'));
});

test("isLoopbackServerBind matches Astro server.host shapes", () => {
  assert.equal(isLoopbackServerBind(undefined), true);
  assert.equal(isLoopbackServerBind(false), true);
  assert.equal(isLoopbackServerBind(true), false);
  assert.equal(isLoopbackServerBind("0.0.0.0"), false);
  assert.equal(isLoopbackServerBind("127.0.0.1"), true);
  assert.equal(isLoopbackServerBind("localhost"), true);
});

test("devDesk skips mount when server.host is true unless allowNonLoopback", () => {
  const edit = {
    files: { work: "work" },
    policy: "./src/policy.ts",
  };
  const run = (allowNonLoopback?: boolean) => {
    const routes: string[] = [];
    const i = shellsite({
      identity: { name: "T" },
      collections: {},
      surfaces: { devDesk: true },
      edit: { ...edit, ...(allowNonLoopback ? { allowNonLoopback: true } : {}) },
    });
    (i.hooks as Record<string, Function>)["astro:config:setup"]({
      injectRoute: (r: { pattern: string }) => routes.push(r.pattern),
      updateConfig: () => {},
      command: "dev",
      config: { root: new URL("file:///site/"), server: { host: true } },
    });
    return routes;
  };
  assert.equal(run().includes("/api/dev-content"), false);
  assert.equal(run(true).includes("/api/dev-content"), true);
});

test("devDesk injects /api/dev-content only in dev and only with edit", () => {
  const mk = (devDesk: boolean, withEdit: boolean) =>
    shellsite({
      identity: { name: "T" },
      collections: {},
      surfaces: { devDesk },
      ...(withEdit
        ? { edit: { files: { work: "work" }, policy: "./src/policy.ts" } }
        : {}),
    });

  for (const command of ["dev", "build"] as const) {
    for (const withEdit of [true, false]) {
      const routes: string[] = [];
      let plugins: { name?: string }[] = [];
      const i = mk(true, withEdit);
      (i.hooks as Record<string, Function>)["astro:config:setup"]({
        injectRoute: (r: { pattern: string }) => routes.push(r.pattern),
        updateConfig: (u: { vite?: { plugins?: { name?: string }[] } }) => {
          plugins = u.vite?.plugins ?? [];
        },
        command,
        config: { root: new URL("file:///site/"), server: { host: "127.0.0.1" } },
      });
      const want = command === "dev" && withEdit;
      assert.equal(
        routes.includes("/api/dev-content"),
        want,
        `${command}/edit=${withEdit} route`,
      );
      assert.equal(
        plugins.some((p) => p.name === "shellsite-dev-desk"),
        want,
        `${command}/edit=${withEdit} plugin`,
      );
    }
  }
});

test("dev-desk module assembles editor from config + policy paths", () => {
  let deskSrc = "";
  const i = shellsite({
    identity: { name: "T" },
    collections: {},
    surfaces: { devDesk: true },
    edit: {
      contentRoot: "content",
      files: { work: "cards", writing: "writing.yaml" },
      policy: "./src/policy.ts",
      look: "./src/look.ts",
    },
  });
  (i.hooks as Record<string, Function>)["astro:config:setup"]({
    injectRoute: () => {},
    updateConfig: (u: { vite?: { plugins?: any[] } }) => {
      const p = u.vite!.plugins!.find((x) => x.name === "shellsite-dev-desk")!;
      deskSrc = p.load(p.resolveId("virtual:shellsite/dev-desk")!) as string;
    },
    command: "dev",
    config: { root: new URL("file:///site/") },
  });
  assert.ok(deskSrc.includes('from "/site/src/policy.ts"'));
  assert.ok(deskSrc.includes('from "/site/src/look.ts"'));
  assert.ok(deskSrc.includes('"contentRoot": undefined') === false);
  assert.ok(deskSrc.includes('/site/content'));
  assert.ok(deskSrc.includes('work: { dir: "cards" }'));
  assert.ok(deskSrc.includes('writing: { file: "writing.yaml"'));
  assert.ok(deskSrc.includes("createDevContentHandler"));
  assert.ok(deskSrc.includes("import.meta.env.DEV"));
});
