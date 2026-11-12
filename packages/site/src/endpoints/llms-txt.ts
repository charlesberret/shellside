/**
 * /llms.txt — LLM-readable index per llmstxt.org convention.
 * Public items only; same visibility filter as every surface.
 */
import type { APIRoute } from "astro";
import path from "node:path";
import config from "virtual:shellsite/config";
import { buildLlmsTxtLines, projectSiteTree } from "../site-tree.js";

export const GET: APIRoute = async () => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const tree = projectSiteTree(path.resolve("src", "content"));
  const lines = buildLlmsTxtLines(
    tree,
    config.identity.name,
    config.identity.tagline,
    base,
  );
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
