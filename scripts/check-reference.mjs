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
if (typeof look.createLookHistory !== "undefined") {
  throw new Error("look: fs factory leaked into the client-safe entry");
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
if (edit.contentFileForPath("record:sample:date") !== "records/sample.md") {
  throw new Error("edit-protocol: content file");
}
if (edit.fieldKindFromPath("work:sample:tags.0") !== "tags") {
  throw new Error("edit-protocol: tags kind");
}

console.log("check-reference: ok");
