/**
 * Leak audit — proves drafts/private content never reach the public build.
 *
 * Reads the built content dir and the static dist; returns failure strings
 * (empty = clean). Sites run this against their own dirs; the shellside kit
 * runs it against the reference build.
 */
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

export type LeakAuditOptions = {
  contentDir: string;
  distDir: string;
  /** collection name → route prefix, e.g. { work: "projects" }. */
  routeDirs: Record<string, string>;
  /** extra substrings forbidden anywhere in dist (marquee redaction needles). */
  needles?: string[];
  /** marker file; when present, a draft sentinel must exist or the audit is vacuous. */
  sentinelMarkerFile?: string;
  /** require a plaintext route in dist (default "list.txt"). */
  plaintextRoute?: string | false;
};

const LEGACY_HIDDEN = new Set(["draft", "unpublished"]);
const SENTINEL = /SHELLSIDE_[A-Z0-9_]*SENTINEL/g;

function walk(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, acc);
    else acc.push(abs);
  }
  return acc;
}

function parseFrontmatter(text: string): { data: Record<string, string>; body: string } {
  if (!text.startsWith("---")) return { data: {}, body: text };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: text };
  const data: Record<string, string> = {};
  for (const line of text.slice(3, end).split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[m[1]] = value;
  }
  return { data, body: text.slice(end + 4) };
}

function isHidden(data: Record<string, string>): boolean {
  if (data.visibility === "draft") return true;
  const visibilityAbsent = data.visibility == null || data.visibility === "";
  return visibilityAbsent && LEGACY_HIDDEN.has(data.status);
}

function entryId(relPosix: string): string {
  return relPosix.replace(/\.(md|mdx|markdown|ya?ml)$/i, "");
}

type Entry = { collection: string; id: string; data: Record<string, unknown>; body: string };

function* collectionEntries(contentDir: string, routeDirs: Record<string, string>): Generator<Entry> {
  for (const collection of Object.keys(routeDirs)) {
    const single = path.join(contentDir, `${collection}.yaml`);
    if (!fs.existsSync(single)) continue;
    const rows = (yaml.load(fs.readFileSync(single, "utf8")) ?? []) as (Record<string, unknown> | null)[];
    for (const row of rows) {
      if (!row?.id) continue;
      const { id, ...data } = row;
      yield { collection, id: String(id), data, body: JSON.stringify(data) };
    }
  }
  for (const abs of walk(contentDir)) {
    const rel = path.relative(contentDir, abs).split(path.sep).join("/");
    const collection = rel.split("/")[0];
    if (!routeDirs[collection]) continue;
    if (!/\.(md|mdx|markdown|ya?ml)$/i.test(rel)) continue;
    const { data, body } = parseFrontmatter(fs.readFileSync(abs, "utf8"));
    yield { collection, id: entryId(rel.slice(collection.length + 1)), data, body };
  }
}

export function leakAudit(opts: LeakAuditOptions): string[] {
  const failures: string[] = [];
  const routeDirs = opts.routeDirs;
  const plaintextRoute = opts.plaintextRoute === undefined ? "list.txt" : opts.plaintextRoute;

  if (!fs.existsSync(opts.distDir)) {
    return [`missing ${opts.distDir} — build first`];
  }
  const files = walk(opts.distDir);
  const rels: string[] = [];
  let text = "";
  for (const abs of files) {
    rels.push(path.relative(opts.distDir, abs).split(path.sep).join("/"));
    const buf = fs.readFileSync(abs);
    if (buf.includes(0)) continue;
    text += `\n${buf.toString("utf8")}`;
  }

  const hiddenRoutes: string[] = [];
  const hiddenSentinels: string[] = [];
  const publicTitles: string[] = [];
  for (const { collection, id, data, body } of collectionEntries(opts.contentDir, routeDirs)) {
    if (isHidden(data as Record<string, string>)) {
      hiddenRoutes.push(`${routeDirs[collection]}/${id}`);
      for (const match of `${data.title ?? ""}\n${body}`.matchAll(SENTINEL)) {
        hiddenSentinels.push(match[0]);
      }
    } else if (data.title) {
      publicTitles.push(String(data.title));
    }
  }

  if (publicTitles.length === 0) {
    failures.push("no public titles found in content");
  }
  for (const title of publicTitles) {
    if (!text.includes(title)) failures.push(`public title missing from dist: ${title}`);
  }
  for (const route of hiddenRoutes) {
    const hit = rels.find((rel) => rel.includes(route));
    if (hit) failures.push(`draft route emitted: ${hit}`);
    if (text.includes(`/${route}`)) failures.push(`draft route linked in dist: /${route}`);
  }
  for (const sentinel of new Set(hiddenSentinels)) {
    if (text.includes(sentinel)) failures.push(`draft sentinel leaked: ${sentinel}`);
  }
  if (
    opts.sentinelMarkerFile &&
    fs.existsSync(opts.sentinelMarkerFile) &&
    hiddenSentinels.length === 0
  ) {
    failures.push("sentinel fixture has no draft sentinels — leak audit would be vacuous");
  }
  for (const needle of opts.needles ?? []) {
    if (text.includes(needle)) failures.push(`redaction needle in dist: ${needle}`);
  }
  if (plaintextRoute !== false &&
      !rels.some((rel) => rel === plaintextRoute || rel.endsWith(`/${plaintextRoute}`))) {
    failures.push(`missing plaintext ${plaintextRoute}`);
  }
  return failures;
}
