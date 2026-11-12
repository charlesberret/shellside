/**
 * `@shellside/site` — config-driven dual-surface host (ADR 2026-10-16).
 *
 * The integration injects the generic surfaces (`/console`, `/list.txt`)
 * and exposes `virtual:shellsite/config` so packaged pages can read the
 * site's config. Portfolio pages stay site-owned — chrome is taste.
 */

import type { AstroIntegration, AstroConfig } from "astro";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import type { ShellsiteConfig } from "./config.js";
import { devDeskPlugin } from "./dev-desk.js";

export { defineShellsiteConfig } from "./config.js";
export type {
  ShellsiteConfig,
  CollectionShape,
  ConsoleCollectionSpec,
} from "./config.js";
export { leakAudit, type LeakAuditOptions } from "./leak-audit.js";
export {
  publicEntries,
  byTitle,
  entryId,
  entryMeta,
  entryLinks,
  type Listed,
} from "./public.js";
export { isPublicItem } from "@shellside/content-model";

export const SHELLSITE_CONFIG_ID = "virtual:shellsite/config";
const RESOLVED_CONFIG_ID = "\0" + SHELLSITE_CONFIG_ID;

function configPlugin(config: ShellsiteConfig): Plugin {
  return {
    name: "shellsite-config",
    resolveId(id: string) {
      if (id === SHELLSITE_CONFIG_ID) return RESOLVED_CONFIG_ID;
      return null;
    },
    load(id: string) {
      if (id === RESOLVED_CONFIG_ID) {
        return `export default ${JSON.stringify(config)}`;
      }
      return null;
    },
  };
}

export function shellsite(config: ShellsiteConfig): AstroIntegration {
  return {
    name: "@shellside/site",
    hooks: {
      "astro:config:setup": ({ injectRoute, updateConfig, command, config: astroConfig }: any) => {
        // The desk mounts only in `astro dev` — a build never sees the
        // route, the virtual module, or the site's edit modules.
        const deskOn =
          Boolean(config.surfaces.devDesk && config.edit) && command === "dev";
        if (deskOn) {
          injectRoute({
            pattern: "/api/dev-content",
            entrypoint: "@shellside/site/dev-content",
          });
          injectRoute({
            pattern: "/admin",
            entrypoint: "@shellside/site/admin-page",
          });
        }
        if (config.surfaces.console) {
          injectRoute({
            pattern: "/console",
            entrypoint: "@shellside/site/console-page",
          });
        }
        if (config.surfaces.plaintext) {
          injectRoute({
            pattern: "/list.txt",
            entrypoint: "@shellside/site/list.txt",
          });
        }
        if (config.surfaces.plaintext) {
          injectRoute({
            pattern: "/[section].txt",
            entrypoint: "@shellside/site/section.txt",
          });
        }
        if (config.surfaces.llmsTxt) {
          injectRoute({
            pattern: "/llms.txt",
            entrypoint: "@shellside/site/llms.txt",
          });
        }
        updateConfig({
          vite: {
            plugins: [
              configPlugin(config),
              ...(deskOn
                ? [devDeskPlugin(config, fileURLToPath(astroConfig.root))]
                : []),
            ],
          },
        });
      },
    },
  };
}
export { projectSiteTree, parseDotConfig, type SiteTree, type TreeSection, type TreeEntry } from "./site-tree.js";
