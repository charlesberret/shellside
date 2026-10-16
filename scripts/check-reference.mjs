/**
 * Smoke: built packages export expected symbols.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function load(pkgPath) {
  return import(pathToFileURL(pkgPath).href);
}

const content = await load(
  path.join(root, "packages/content-model/dist/index.js"),
);
const look = await load(path.join(root, "packages/look/dist/index.js"));
const lookFs = await load(path.join(root, "packages/look/dist/fs.js"));
const edit = await load(path.join(root, "packages/edit-protocol/dist/index.js"));

if (typeof content.isPublicItem !== "function") {
  throw new Error("content-model: missing isPublicItem");
}
if (typeof look.pathToLookRole !== "function") {
  throw new Error("look: missing pathToLookRole");
}
if (typeof lookFs.createLookHistory !== "function") {
  throw new Error("look/fs: missing createLookHistory");
}
if (typeof lookFs.createFieldStyles !== "function") {
  throw new Error("look/fs: missing createFieldStyles");
}
if (typeof look.createLookHistory !== "undefined" || typeof look.createFieldStyles !== "undefined") {
  throw new Error("look: fs factory leaked into the client-safe entry");
}
if (look.parseFieldStylesRoot({ roles: { "work:x:title": { size: "lg" } } })["item-title"]?.portfolio?.size !== "lg") {
  throw new Error("look: parseFieldStylesRoot path fold");
}
if (look.pathToLookRole("work:x:title") !== "item-title") {
  throw new Error("look: pathToLookRole work title");
}
if (look.pathToLookRole("writing:sample:byline") !== "item-meta") {
  throw new Error("look: byline role");
}
if (look.pathToLookRole("page:writing.groupBook") !== "section-heading") {
  throw new Error("look: writing group role");
}
const skin = look.crossSkinStyle({ color: "#111", case: "upper", size: "lg", font: "mono" });
if (skin.color !== "#111" || skin.case !== "upper" || skin.size || skin.font) {
  throw new Error("look: crossSkinStyle");
}
if (!look.SIZE_KEYS.includes("base") || !look.FONT_KEYS.includes("prose")) {
  throw new Error("look: option lists");
}
if (edit.parseContentPath("work:kettle:links.0.href")?.field !== "links.0.href") {
  throw new Error("edit-protocol: parse link path");
}
if (edit.contentFileForPath("record:sample:date") !== "records.yaml") {
  throw new Error("edit-protocol: content file");
}
if (typeof edit.editKindFromPath !== "function" || edit.editKindFromPath("writing:x:links.pdf").editKind !== "writing-link") {
  throw new Error("edit-protocol: editKindFromPath");
}
const devApi = await load(path.join(root, "packages/dev-api/dist/index.js"));
if (typeof devApi.createContentEditor !== "function" || typeof devApi.createDevContentHandler !== "function") {
  throw new Error("dev-api: missing editor or handler factory");
}
if (edit.fieldKindFromPath("work:sample:tags.0") !== "tags") {
  throw new Error("edit-protocol: tags kind");
}

const vfs = await load(
  path.join(root, "packages/console-vfs/dist/index.js"),
);
if (typeof vfs.projectCollections !== "function") {
  throw new Error("console-vfs: missing projectCollections");
}
const tree = vfs.projectCollections([
  { dir: "projects", items: [{ slug: "x", body: "b" }] },
]);
if (vfs.nodeAt(vfs.dir(tree), ["projects", "x.md"])?.body !== "b") {
  throw new Error("console-vfs: projection + nodeAt round-trip");
}

// reference dist: console page exists and carries the VFS payload
{
  const consoleHtml = path.join(
    root,
    "apps/reference/dist/console/index.html",
  );
  const { existsSync, readFileSync } = await import("node:fs");
  if (!existsSync(consoleHtml)) {
    throw new Error("reference: no /console page built");
  }
  const html = readFileSync(consoleHtml, "utf8");
  if (!html.includes('id="vfs-data"') || !html.includes("projects")) {
    throw new Error("reference: console page lacks the VFS payload");
  }
}
console.log("check-reference: ok");
