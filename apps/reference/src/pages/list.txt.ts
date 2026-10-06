import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { byTitle, publicEntries, type Listed } from "../lib/public";

function lines(heading: string, items: readonly Listed[]): string[] {
  return [heading, ...items.map((item) => `- ${item.data.title ?? item.id}`), ""];
}

export const GET: APIRoute = async () => {
  const work = byTitle(publicEntries(await getCollection("work")) as Listed[]);
  const writing = byTitle(publicEntries(await getCollection("writing")) as Listed[]);
  const records = byTitle(publicEntries(await getCollection("records")) as Listed[]);
  const body = [
    "Reference portfolio",
    "",
    ...lines("Projects", work),
    ...lines("Writing", writing),
    ...lines("Records", records),
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
