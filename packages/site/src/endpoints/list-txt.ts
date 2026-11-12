/**
 * /list.txt — plaintext listing of every public item across the
 * content tree. Same visibility filter as every other surface.
 */
import type { APIRoute } from "astro";
import path from "node:path";
import config from "virtual:shellsite/config";
import { buildListTxtLines, projectSiteTree } from "../site-tree.js";

export const GET: APIRoute = async () => {
  const tree = projectSiteTree(path.resolve("src", "content"));
  const lines = buildListTxtLines(tree, config.identity.name);
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
