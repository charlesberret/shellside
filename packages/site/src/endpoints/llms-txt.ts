/**
 * /llms.txt — LLM-readable index per llmstxt.org convention.
 * Public items only; same visibility filter as every surface.
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import config from "virtual:shellsite/config";
import { byTitle, entryId, publicEntries } from "../public.js";

export const GET: APIRoute = async () => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const lines: string[] = [`# ${config.identity.name}`, ""];
  if (config.identity.tagline) lines.push(`> ${config.identity.tagline}`, "");
  for (const spec of config.console?.collections ?? []) {
    const items = byTitle(publicEntries(await getCollection(spec.collection)));
    if (!items.length) continue;
    lines.push(`## ${spec.dir}`, "");
    for (const item of items) {
      const data = (item.data ?? {}) as Record<string, unknown>;
      const title = String(data.title ?? entryId(item));
      const url = spec.urlPrefix ? `${base}${spec.urlPrefix}/${entryId(item)}` : `${base}/${spec.dir}/${entryId(item)}`;
      const desc = data.summary ? `: ${String(data.summary)}` : "";
      lines.push(`- [${title}](${url})${desc}`);
    }
    lines.push("");
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
