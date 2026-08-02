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
const edit = await load(path.join(root, "packages/edit-protocol/dist/index.js"));

if (typeof content.isPublicItem !== "function") {
  throw new Error("content-model: missing isPublicItem");
}
if (typeof look.pathToLookRole !== "function") {
  throw new Error("look: missing pathToLookRole");
}
if (look.pathToLookRole("work:x:title") !== "item-title") {
  throw new Error("look: pathToLookRole work title");
}
if (edit.parseContentPath("work:kettle:links.0.href")?.field !== "links.0.href") {
  throw new Error("edit-protocol: parse link path");
}

console.log("check-reference: ok");
