/**
 * projectSiteTree — the filesystem-as-IA contract
 * (docs/decisions/2026-10-17-filesystem-ia.md).
 *
 * Reads a content directory once and returns the structure both surfaces
 * share: sections (top-level dirs), entries (files), hidden nodes
 * (dotfiles — pages never see them, console does).
 */
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { parseFrontmatter } from "./frontmatter.js";

export type TreeEntry = {
  /** url-safe id (path minus extension). */
  slug: string;
  title?: string;
  /** raw body after frontmatter (markdown/text). */
  body: string;
  /** frontmatter scalars, plus `visibility`/`status`. */
  data: Record<string, unknown>;
  /** extra list rows when the file is a *.yaml collection. */
  list?: Record<string, unknown>[];
};

export type TreeSection = {
  /** dir name — also the console path segment and default route. */
  dir: string;
  /** display title — .meta `title:` or titleized dir name. */
  title: string;
  /** .meta `order:` (lower first) then alphabetical. */
  order: number;
  /** .meta `blurb:` if present. */
  blurb?: string;
  entries: TreeEntry[];
};

export type SiteTree = {
  /** parsed `.site` config (key: value lines / yaml-ish). */
  site: Record<string, string>;
  /** root-level loose files. */
  entries: TreeEntry[];
  sections: TreeSection[];
  /** dotfile/hidden nodes (console-only): path as `~/…`, file body. */
  hidden: { path: string; body: string }[];
  /** per-dir `.meta` parsed: dir → fields. */
  meta: Record<string, Record<string, string>>;
};

const isDot = (n: string) => n.startsWith(".");
const isContentFile = (n: string) => /\.(md|mdx|markdown|txt|ya?ml)$/i.test(n);
const titleize = (s: string) =>
  s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** `.site` / `.meta` — plaintext `key: value` lines; `#` comments. */
export function parseDotConfig(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

function readEntry(abs: string): TreeEntry {
  const raw = fs.readFileSync(abs, "utf8");
  if (/\.ya?ml$/i.test(abs)) {
    const parsed = yaml.load(raw);
    const list = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" && Array.isArray((parsed as {items?:unknown[]}).items) ? (parsed as {items:Record<string,unknown>[]}).items : undefined);
    const fileTitle = !Array.isArray(parsed) && parsed && typeof parsed === "object" ? (parsed as {title?:string}).title : undefined;
    return {
      slug: path.basename(abs).replace(/\.[^.]+$/, ""),
      title: fileTitle ?? path.basename(abs).replace(/\.[^.]+$/, ""),
      body: raw,
      data: {},
      list,
    };
  }
  const { data, body } = parseFrontmatter(raw);
  return {
    slug: path.basename(abs).replace(/\.[^.]+$/, ""),
    title: data.title || path.basename(abs).replace(/\.[^.]+$/, ""),
    body,
    data,
  };
}

export function projectSiteTree(contentDir: string): SiteTree {
  const tree: SiteTree = { site: {}, entries: [], sections: [], hidden: [], meta: {} };
  if (!fs.existsSync(contentDir)) return tree;

  const rootEntries = fs.readdirSync(contentDir, { withFileTypes: true });
  for (const ent of rootEntries) {
    const abs = path.join(contentDir, ent.name);
    if (isDot(ent.name)) {
      tree.hidden.push({ path: `~/${ent.name}`, body: ent.isFile() ? fs.readFileSync(abs, "utf8") : "" });
      if (ent.name === ".site" && ent.isFile()) {
        tree.site = parseDotConfig(fs.readFileSync(abs, "utf8"));
      }
      continue;
    }
    if (ent.isFile() && isContentFile(ent.name)) {
      const e = readEntry(abs);
      if (e.list) {
        tree.sections.push({
          dir: ent.name.replace(/\.[^.]+$/, ""),
          title: e.title && e.title !== ent.name.replace(/\.[^.]+$/, "") ? e.title : titleize(ent.name.replace(/\.[^.]+$/, "")),
          order: Number.MAX_SAFE_INTEGER,
          entries: e.list.map((row) => ({
            slug: `${ent.name.replace(/\.[^.]+$/, "")}/${row.id ?? row.title}`,
            title: row.title ? String(row.title) : String(row.id ?? "row"),
            body: typeof row.body === "string" ? row.body : "",
            data: row,
          })),
        });
        continue;
      }
      tree.entries.push(e);
      continue;
    }
    if (!ent.isDirectory()) continue;

    const section: TreeSection = {
      dir: ent.name,
      title: titleize(ent.name),
      order: Number.MAX_SAFE_INTEGER,
      entries: [],
    };
    for (const sub of fs.readdirSync(abs, { withFileTypes: true })) {
      const subAbs = path.join(abs, sub.name);
      if (isDot(sub.name)) {
        tree.hidden.push({ path: `~/${ent.name}/${sub.name}`, body: sub.isFile() ? fs.readFileSync(path.join(abs, sub.name), "utf8") : "" });
        if (sub.name === ".meta" && sub.isFile()) {
          const meta = parseDotConfig(fs.readFileSync(subAbs, "utf8"));
          tree.meta[ent.name] = meta;
          if (meta.title) section.title = meta.title;
          if (meta.order != null && meta.order !== "") section.order = Number(meta.order);
          if (meta.blurb) section.blurb = meta.blurb;
        }
        continue;
      }
      if (sub.isFile() && isContentFile(sub.name)) {
        const e = readEntry(subAbs);
        e.slug = `${ent.name}/${e.slug}`;
        section.entries.push(e);
      } else if (sub.isDirectory()) {
        // deeper nesting: files become entries slugged sub/file
        for (const deep of fs.readdirSync(subAbs, { withFileTypes: true })) {
          if (isDot(deep.name)) {
            const deepAbs = path.join(subAbs, deep.name);
            tree.hidden.push({ path: `~/${ent.name}/${sub.name}/${deep.name}`, body: deep.isFile() ? fs.readFileSync(deepAbs, "utf8") : "" });
            continue;
          }
          if (deep.isFile() && isContentFile(deep.name)) {
            const e = readEntry(path.join(subAbs, deep.name));
            e.slug = `${ent.name}/${sub.name}/${e.slug}`;
            section.entries.push(e);
          }
        }
      }
    }
    section.entries.sort((a, b) => (a.title ?? a.slug).localeCompare(b.title ?? b.slug));
    tree.sections.push(section);
  }
  tree.sections.sort((a, b) => a.order - b.order || a.dir.localeCompare(b.dir));
  tree.entries.sort((a, b) => (a.title ?? a.slug).localeCompare(b.title ?? b.slug));
  return tree;
}
