/**
 * /list.txt — plaintext listing of every public item across the
 * collection map. Same visibility filter as every other surface.
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import config from "virtual:shellsite/config";
import { byTitle, entryId, publicEntries } from "../public.js";

export const GET: APIRoute = async () => {
  const lines: string[] = [config.identity.name, ""];
  for (const spec of config.console?.collections ?? []) {
    const items = byTitle(
      publicEntries(await getCollection(spec.collection)),
    );
    lines.push(
      spec.dir,
      ...items.map((item) => `- ${(item.data as { title?: string } | undefined)?.title ?? entryId(item)}`),
      "",
    );
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
