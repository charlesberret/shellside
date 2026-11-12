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

const LOOPBACK_BIND_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** Whether Astro's dev `server.host` binds only on loopback (default safe). */
export function isLoopbackServerBind(host?: string | boolean): boolean {
  if (host === undefined || host === false) return true;
  if (host === true) return false;
  const h = host.trim().toLowerCase();
  if (LOOPBACK_BIND_HOSTS.has(h)) return true;
  if (h === "0.0.0.0" || h === "::" || h === "*") return false;
  if (/^127(?:\.\d{1,3}){3}$/.test(h)) return true;
  return false;
}

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
        const deskWanted =
          Boolean(config.surfaces.devDesk && config.edit) && command === "dev";
        const bindLoopback = isLoopbackServerBind(astroConfig?.server?.host);
        const allowWideBind = config.edit?.allowNonLoopback === true;
        const deskOn = deskWanted && (bindLoopback || allowWideBind);
        if (deskWanted && !deskOn) {
          console.log(
            "@shellside/site: dev desk not mounted because Astro server.host is not loopback (set edit.allowNonLoopback: true to opt in)",
          );
        }
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
