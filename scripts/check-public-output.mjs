/**
 * Basic R0 leak audit for the reference production build.
 *
 * Reads the content that was built (apps/reference/src/content) and the
 * static dist. Fails when:
 * - a non-public slug is emitted as a route
 * - a SHELLSIDE_*_SENTINEL from a non-public file appears in dist
 * - a public title is missing from dist
 * - a redaction needle appears in dist
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REDACTION_NEEDLES } from "./redaction.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "apps", "reference", "src", "content");
const distDir = path.join(root, "apps", "reference", "dist");

const ROUTE_DIRS = {
  work: "projects",
  writing: "writing",
  records: "records",
};

const LEGACY_HIDDEN = new Set(["draft", "unpublished"]);
const SENTINEL = /SHELLSIDE_[A-Z0-9_]*SENTINEL/g;

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, acc);
    else acc.push(abs);
  }
  return acc;
}

function parseFrontmatter(text) {
  if (!text.startsWith("---")) return { data: {}, body: text };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: text };
  const data = {};
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

function isHidden(data) {
  if (data.visibility === "draft") return true;
  const visibilityAbsent = data.visibility == null || data.visibility === "";
  return visibilityAbsent && LEGACY_HIDDEN.has(data.status);
}

function entryId(relPosix) {
  return relPosix.replace(/\.(md|mdx|markdown|ya?ml)$/i, "");
}

function loadExpectations() {
  const hiddenRoutes = [];
  const hiddenSentinels = [];
  const publicTitles = [];
  for (const abs of walk(contentDir)) {
    const rel = path.relative(contentDir, abs).split(path.sep).join("/");
    const collection = rel.split("/")[0];
    if (!ROUTE_DIRS[collection]) continue;
    if (!/\.(md|mdx|markdown|ya?ml)$/i.test(rel)) continue;
    const text = fs.readFileSync(abs, "utf8");
    const { data, body } = parseFrontmatter(text);
    const id = entryId(rel.slice(collection.length + 1));
    if (isHidden(data)) {
      hiddenRoutes.push(`${ROUTE_DIRS[collection]}/${id}`);
      for (const match of `${data.title ?? ""}\n${body}`.matchAll(SENTINEL)) {
        hiddenSentinels.push(match[0]);
      }
    } else if (data.title) {
      publicTitles.push(data.title);
    }
  }
  return { hiddenRoutes, hiddenSentinels, publicTitles };
}

function readDistText(files) {
  let text = "";
  const rels = [];
  for (const abs of files) {
    const rel = path.relative(distDir, abs).split(path.sep).join("/");
    rels.push(rel);
    const buf = fs.readFileSync(abs);
    if (buf.includes(0)) continue;
    text += `\n${buf.toString("utf8")}`;
  }
  return { text, rels };
}

const failures = [];
if (!fs.existsSync(distDir)) {
  failures.push("missing apps/reference/dist — run the reference build first");
} else {
  const files = walk(distDir);
  const { text, rels } = readDistText(files);
  const { hiddenRoutes, hiddenSentinels, publicTitles } = loadExpectations();

  if (publicTitles.length === 0) {
    failures.push("no public titles found in reference content");
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
    fs.existsSync(path.join(contentDir, ".shellside-toy")) &&
    hiddenSentinels.length === 0
  ) {
    failures.push("toy fixture has no draft sentinels — leak audit would be vacuous");
  }
  for (const needle of REDACTION_NEEDLES) {
    if (text.includes(needle)) failures.push(`redaction needle in dist: ${needle}`);
  }
  if (!rels.some((rel) => rel === "list.txt" || rel.endsWith("/list.txt"))) {
    failures.push("missing plaintext list.txt");
  }
}

if (failures.length) {
  console.error("check-public-output: FAILED");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("check-public-output: ok");
