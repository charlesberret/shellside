/**
 * /<section>.txt — full plaintext bundle of one section, per the
 * filesystem-IA contract. Public entries only; same visibility gate
 * as every surface. Parallels the marquee's /projects.txt.
 */
import type { APIRoute, GetStaticPaths } from "astro";
import path from "node:path";
import config from "virtual:shellsite/config";
import { buildSectionTxt, projectSiteTree } from "../site-tree.js";

export const getStaticPaths: GetStaticPaths = async () => {
  const tree = projectSiteTree(path.resolve("src", "content"));
  return tree.sections.map((section) => ({
    params: { section: section.dir },
  }));
};

export const GET: APIRoute = async ({ params, site }) => {
  const origin = site ?? new URL("http://localhost");
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const tree = projectSiteTree(path.resolve("src", "content"));
  const body = buildSectionTxt(
    tree,
    String(params.section),
    config.identity.name,
    origin.href,
    base,
  );
  if (!body) return new Response("not found\n", { status: 404 });
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
