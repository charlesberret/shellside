/**
 * Dev-desk virtual module. When `surfaces.devDesk` + `edit.*`
 * are set and the Astro command is `dev`, the host injects
 * `/api/dev-content` and registers `virtual:shellsite/dev-desk` — a
 * generated module that imports the site's policy/look modules, assembles
 * `createContentEditor`, and hands `createDevContentHandler` the result.
 * Nothing here exists in `astro build` output.
 */
import path from "node:path";
import type { Plugin } from "vite";
import type { ShellsiteConfig } from "./config.js";

export const DEV_DESK_ID = "virtual:shellsite/dev-desk";
const RESOLVED_DESK_ID = "\0" + DEV_DESK_ID;

/** Header written at the top of yaml files the desk rewrites. */
const headerFor = (file: string): string =>
  `# ${file} — managed by the shellside dev desk\n`;

/**
 * Emit the desk module source. `siteRoot` is the Astro project root;
 * `edit.*` module paths resolve against it.
 */
export function buildDevDeskModule(config: ShellsiteConfig, siteRoot: string): string {
  const edit = config.edit;
  if (!edit) throw new Error("surfaces.devDesk requires edit.* to be set");

  const contentRoot = path.resolve(siteRoot, edit.contentRoot ?? "src/content");
  const f = edit.files ?? {};
  const fileEntries: string[] = [];
  if (f.work) fileEntries.push(`work: { dir: ${JSON.stringify(f.work)} }`);
  for (const key of ["writing", "records", "profile"] as const) {
    const file = f[key];
    if (file) {
      fileEntries.push(
        `${key}: { file: ${JSON.stringify(file)}, header: ${JSON.stringify(headerFor(file))} }`,
      );
    }
  }
  if (f.pageCopy) {
    fileEntries.push(
      `pageCopy: { file: ${JSON.stringify(f.pageCopy)}, header: ${JSON.stringify(headerFor(f.pageCopy))} }`,
    );
  }

  const policyPath = edit.policy ? path.resolve(siteRoot, edit.policy) : null;
  const lookPath = edit.look ? path.resolve(siteRoot, edit.look) : null;

  return [
    `import { createContentEditor, createDevContentHandler } from "@shellside/dev-api";`,
    policyPath
      ? `import * as __policy from ${JSON.stringify(policyPath)};`
      : `const __policy = {};`,
    lookPath
      ? `import * as __lookMod from ${JSON.stringify(lookPath)};`
      : `const __lookMod = undefined;`,
    `const __files = { ${fileEntries.join(", ")} };`,
    `const __editor = __policy.editor`,
    `  ? (typeof __policy.editor === "function" ? __policy.editor() : __policy.editor)`,
    `  : createContentEditor({`,
    `      contentRoot: ${JSON.stringify(contentRoot)},`,
    `      files: { ...__files, ...(__policy.files ?? {}) },`,
    `      allowlist: __policy.allowlist ?? {},`,
    `      drafts: __policy.drafts,`,
    `      profileListJoins: __policy.profileListJoins,`,
    `      writingLinkKeys: __policy.writingLinkKeys,`,
    `      archiveKinds: __policy.archiveKinds,`,
    `      coerceVisibility: __policy.coerceVisibility,`,
    `      coerceWritingYear: __policy.coerceWritingYear,`,
    `    });`,
    `const __lookRaw = __lookMod`,
    `  ? (__lookMod.default ?? __lookMod.look ?? __lookMod)`,
    `  : undefined;`,
    `const __look = typeof __lookRaw === "function" ? __lookRaw() : __lookRaw;`,
    `export const handler = createDevContentHandler({`,
    `  isDev: () => import.meta.env.DEV,`,
    `  editor: __editor,`,
    `  look: __look,`,
    `});`,
    `/** The desk page (/admin) enumerates candidates + filters by allowlist. */`,
    `export const files = __files;`,
    `export const editor = __editor;`,
    ``,
  ].join("\n");
}

export function devDeskPlugin(config: ShellsiteConfig, siteRoot: string): Plugin {
  return {
    name: "shellsite-dev-desk",
    resolveId(id) {
      return id === DEV_DESK_ID ? RESOLVED_DESK_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_DESK_ID) return null;
      return buildDevDeskModule(config, siteRoot);
    },
  };
}
