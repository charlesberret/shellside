/**
 * Project filtered content collections into a VFS children map.
 *
 * The caller supplies items already filtered for visibility — the package
 * never decides what is public. File bodies come from an injected mapper so
 * the site owns prose layout (consoleHtml, plaintext, whatever it writes).
 */
import { dir, file, type VfsLink, type VfsNode } from "./vfs.js";

export type VfsCollectionItem = {
  slug: string;
  /** File body — plain text or an HTML fragment (see `html`). */
  body: string;
  /** Section grouping (records-style: `<dir>/<section>/<slug>.<ext>`). */
  section?: string;
  /** Canonical page href for the item. */
  url?: string;
  links?: VfsLink[];
};

export type VfsProjectionSpec = {
  /** Directory name under the mount point, e.g. "projects". */
  dir: string;
  items: readonly VfsCollectionItem[];
  /** Filename extension without the dot. Default "md". */
  ext?: string;
  /** Group items into `<section>/` subdirs (uses `item.section`). */
  groupBySection?: boolean;
  /** Bodies are HTML fragments. */
  html?: boolean;
  /** Compact one-per-line link lists under each file. */
  compactLinks?: boolean;
};

/**
 * Build `{ <dir>: VfsDir }` children for the given collections.
 * Unknown-slug or empty-body items are skipped rather than emitted empty.
 */
export function projectCollections(
  specs: readonly VfsProjectionSpec[],
): Record<string, VfsNode> {
  const out: Record<string, VfsNode> = {};
  for (const spec of specs) {
    const ext = spec.ext ?? "md";
    const shared = { html: spec.html, compactLinks: spec.compactLinks };
    if (spec.groupBySection) {
      const sections: Record<string, Record<string, VfsNode>> = {};
      for (const item of spec.items) {
        if (!item.slug || item.body == null) continue;
        const section = item.section || "misc";
        if (!sections[section]) sections[section] = {};
        sections[section][`${item.slug}.${ext}`] = file(item.body, {
          url: item.url,
          links: item.links,
          ...shared,
        });
      }
      out[spec.dir] = dir(
        Object.fromEntries(
          Object.entries(sections).map(([name, children]) => [name, dir(children)]),
        ),
      );
    } else {
      const children: Record<string, VfsNode> = {};
      for (const item of spec.items) {
        if (!item.slug || item.body == null) continue;
        children[`${item.slug}.${ext}`] = file(item.body, {
          url: item.url,
          links: item.links,
          ...shared,
        });
      }
      out[spec.dir] = dir(children);
    }
  }
  return out;
}
