/**
 * /<section>.txt — full plaintext bundle of one section, per the
 * filesystem-IA contract. Public entries only; same visibility gate
 * as every surface. Parallels the marquee's /projects.txt.
 */
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import config from "virtual:shellsite/config";
import type { ConsoleCollectionSpec } from "../config.js";
import { byTitle, entryId, publicEntries } from "../public.js";

export const getStaticPaths: GetStaticPaths = async () =>
  (config.console?.collections ?? []).map((spec: ConsoleCollectionSpec) => ({
    params: { section: spec.dir },
  }));

export const GET: APIRoute = async ({ params, site }) => {
  const spec = (config.console?.collections ?? []).find((s: ConsoleCollectionSpec) => s.dir === params.section);
  if (!spec) return new Response("not found\n", { status: 404 });
  const origin = site ?? new URL("http://localhost");
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const items = byTitle(publicEntries(await getCollection(spec.collection as never)));
  const records = items.map((item) => {
    const data = (item.data ?? {}) as Record<string, unknown>;
    const id = entryId(item);
    const page = spec.urlPrefix ? `${base}${spec.urlPrefix}/${id}` : `${base}/${spec.dir}/${id}`;
    const lines = [
      `${"=".repeat(72)}`,
      String(data.title ?? id),
      `page: ${new URL(page, origin).href}`,
    ];
    const meta = [data.kind, data.org, data.dates, data.venue, data.role, data.year, data.date]
      .filter((v) => v != null && v !== "")
      .join(" · ");
    if (meta) lines.push(meta);
    if (data.summary) lines.push(String(data.summary));
    const body = (item as { body?: string }).body;
    if (body) lines.push("", body);
    return lines.join("\n");
  });
  return new Response(
    `# ${spec.dir} — ${config.identity.name}\n\n${records.join("\n\n")}\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
};
